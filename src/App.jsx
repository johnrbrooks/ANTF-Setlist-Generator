import { Box, Flex, Grid, Heading, Text } from '@chakra-ui/react'
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { useMemo, useReducer, useState } from 'react'
import { appReducer, initialState, moveSongInSets, regularStartsUseWeightOne } from './app/reducer'
import AppButton from './components/AppButton'
import { COLORS } from './domain/constants'
import DataSourceControls from './features/data-source/DataSourceControls'
import SettingsPanel from './features/settings/SettingsPanel'
import { AddSongModal, ReplacementSongModal, SongPoolModal } from './features/song-pool/SongPoolModal'
import SetCard from './features/setlist/SetCard'
import useScrollActivity from './hooks/useScrollActivity'
import { downloadSetlistCsv } from './services/export/csvExport'
import { buildPrintPages } from './services/export/printLayout'
import { CsvSongRepository } from './services/song-data/csvRepository'
import { PublicGoogleSheetsSongRepository } from './services/song-data/publicGoogleSheetsRepository'
import { generateSetlist, getActivePool, getReplacementCandidates, selectSwapSong } from './services/setlist/generator'
import { calculateGigMetrics, countTransitions, formatGigDuration } from './services/setlist/metrics'
import logo from './assets/antf-logo.jpg'

const googleConfig = {
  sheetUrl: import.meta.env.VITE_GOOGLE_SHEET_URL ?? '',
  range: import.meta.env.VITE_GOOGLE_SHEET_RANGE ?? 'A:Q',
}

function findSongPosition(sets, id) {
  for (let setIndex = 0; setIndex < sets.length; setIndex += 1) {
    const songIndex = sets[setIndex].songs.findIndex((song) => song.id === id)
    if (songIndex >= 0) return { setIndex, songIndex }
  }
  return null
}

function GenerationFeedback({ diagnostics }) {
  if (!diagnostics) return null
  const energy = diagnostics.averageEnergyBySet.map(({ title, average }) => `${title === 'Encore' ? 'Enc' : title.replace('Set ', 'S')} ${average}`).join(' · ')
  return <Text className="generation-feedback" role="status" aria-live="polite">Compared {diagnostics.validCandidateCount} valid arrangement{diagnostics.validCandidateCount === 1 ? '' : 's'} • Avg energy {energy}</Text>
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [sourceStatus, setSourceStatus] = useState({ googleLoaded: false, loading: false, error: '' })
  const [poolOpen, setPoolOpen] = useState(false)
  const [addTarget, setAddTarget] = useState(null)
  const [replacementTarget, setReplacementTarget] = useState(null)
  const [replacementOverride, setReplacementOverride] = useState(false)
  const [settingsValid, setSettingsValid] = useState(true)
  const scrolling = useScrollActivity()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )
  const googleConfigured = Boolean(googleConfig.sheetUrl)
  const activeRegularPool = useMemo(() => getActivePool(state.songs, state.settings, state.excludedIds, false), [state.songs, state.settings, state.excludedIds])
  const gigMetrics = useMemo(() => calculateGigMetrics(state.sets, state.settings.bufferSeconds), [state.sets, state.settings.bufferSeconds])
  const usedIds = useMemo(() => new Set(state.sets.flatMap((set) => set.songs.map((song) => song.id))), [state.sets])
  const printPages = useMemo(() => buildPrintPages(state.sets, state.display), [state.sets, state.display])

  const runGeneration = (songs = state.songs, lockedSlots = state.lockedSlots) => {
    if (!songs.length) {
      dispatch({ type: 'GENERATION_ERROR', error: 'Load the public Google Sheet or a CSV before generating.', clear: false })
      return false
    }
    const result = generateSetlist({ songs, settings: state.settings, excludedIds: state.excludedIds, lockedSlots })
    if (result.ok) dispatch({ type: 'GENERATION_SUCCESS', sets: result.sets, diagnostics: result.diagnostics })
    else dispatch({ type: 'GENERATION_ERROR', error: result.error, clear: state.sets.length === 0 })
    return result.ok
  }

  const loadGoogleSongs = async () => {
    setSourceStatus((value) => ({ ...value, loading: true, error: '' }))
    try {
      const repository = new PublicGoogleSheetsSongRepository(googleConfig)
      const result = await repository.listSongs()
      dispatch({ type: 'LOAD_SONGS', ...result, source: { type: 'google', label: `Google Sheet • ${result.songs.length} songs`, loadedAt: result.loadedAt } })
      setSourceStatus({ googleLoaded: true, loading: false, error: '' })
    } catch (error) {
      setSourceStatus((value) => ({ ...value, loading: false, error: error.message }))
    }
  }

  const loadCsv = async (file) => {
    if (!file) return
    setSourceStatus((value) => ({ ...value, loading: true, error: '' }))
    try {
      const result = await new CsvSongRepository(file).listSongs()
      dispatch({ type: 'LOAD_SONGS', ...result, source: { type: 'csv', label: `${file.name} • ${result.songs.length} songs`, loadedAt: result.loadedAt } })
      setSourceStatus((value) => ({ ...value, loading: false }))
    } catch (error) {
      setSourceStatus((value) => ({ ...value, loading: false, error: `CSV load failed: ${error.message}` }))
    }
  }

  const availableToAdd = useMemo(() => {
    if (addTarget === null || !state.sets[addTarget]) return []
    const targetSet = state.sets[addTarget]
    const encore = targetSet.title === 'Encore'
    let candidates = getActivePool(state.songs, state.settings, state.excludedIds, encore).filter((song) => !usedIds.has(song.id))
    if (!encore && targetSet.songs.length < 3) {
      const openingTuning = targetSet.songs[0]?.tuning
      candidates = candidates.filter((song) => song.weight === 1 && (!openingTuning || song.tuning === openingTuning))
    }
    candidates = candidates.filter((song) => {
      const transitions = countTransitions([...targetSet.songs, song])
      return transitions.tuningChanges <= state.settings.maxTuningChanges && transitions.guitarChanges <= state.settings.maxGuitarChanges
    })
    return candidates
  }, [addTarget, state.sets, state.songs, state.settings, state.excludedIds, usedIds])

  const replacementCandidates = useMemo(() => {
    if (!replacementTarget) return []
    return getReplacementCandidates({
      sets: state.sets,
      setIndex: replacementTarget.setIndex,
      songIndex: replacementTarget.songIndex,
      songs: state.songs,
      settings: state.settings,
      excludedIds: state.excludedIds,
      override: replacementOverride,
    })
  }, [replacementTarget, replacementOverride, state.sets, state.songs, state.settings, state.excludedIds])

  const replaceSong = (id) => {
    if (!replacementTarget) return
    const song = state.songs.find((item) => item.id === id)
    if (song) dispatch({ type: 'REPLACE_SONG', ...replacementTarget, song })
    setReplacementTarget(null)
    setReplacementOverride(false)
  }

  const swapBestSong = (setIndex, songIndex) => {
    const result = selectSwapSong({
      sets: state.sets,
      setIndex,
      songIndex,
      songs: state.songs,
      settings: state.settings,
      excludedIds: state.excludedIds,
    })
    if (!result.ok) window.alert(result.error)
    else dispatch({ type: 'REPLACE_SONG', setIndex, songIndex, song: result.song })
  }

  const clearLocks = () => {
    const count = Object.keys(state.lockedSlots).length
    if (!count) return
    if (window.confirm(`Remove all ${count} song lock${count === 1 ? '' : 's'}? The current setlist will stay unchanged.`)) dispatch({ type: 'CLEAR_LOCKS' })
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const from = findSongPosition(state.sets, active.id)
    const to = findSongPosition(state.sets, over.id)
    if (!from || !to) return
    const song = state.sets[from.setIndex].songs[from.songIndex]
    const targetIsEncore = state.sets[to.setIndex].title === 'Encore'
    if (song.encoreOnly && !targetIsEncore) {
      window.alert(`${song.song} is marked Encore Only and cannot be placed in a regular set.`)
      return
    }
    const previewSets = moveSongInSets(state.sets, { fromSet: from.setIndex, fromIndex: from.songIndex, toSet: to.setIndex, toIndex: to.songIndex })
    if (!regularStartsUseWeightOne(previewSets)) {
      window.alert('The first three songs in every regular set must remain Weight 1.')
      return
    }
    dispatch({ type: 'MOVE_SONG', fromSet: from.setIndex, fromIndex: from.songIndex, toSet: to.setIndex, toIndex: to.songIndex })
  }

  return (
    <Box minH="100vh" bg="transparent" color={COLORS.text} px={{ base: 3, md: 5 }} py={{ base: 3, md: 5 }}>
      <Box maxW="1280px" mx="auto">
        <Flex className="print-header" as="header" direction={{ base: 'column', lg: 'row' }} align={{ base: 'stretch', lg: 'center' }} justify="space-between" gap="4" pb="4.5" mb="5" borderBottom="1px solid var(--border)">
          <Flex flex="1" minW="0" align="center" gap={{ base: 2.5, md: 3.5 }}><Box as="img" className="brand-logo no-print" src={logo} alt="ANTF logo" w={{ base: '38px', md: '50px' }} h={{ base: '38px', md: '50px' }} flexShrink="0" borderRadius="full" /><Box minW="0"><Heading as="h1" title={state.title.trim() || 'ANTF Setlist Generator 3.0'} fontSize={{ base: 'xl', md: '2xl' }} fontWeight="900" letterSpacing="-.035em" color="var(--accent)" whiteSpace={{ base: 'nowrap', md: 'normal' }} overflow="hidden" textOverflow="ellipsis">{state.title.trim() || 'ANTF Setlist Generator 3.0'}</Heading><Text className="no-print" color="var(--muted)" fontSize="sm" lineHeight="1.45" whiteSpace="normal">Primary: Time/Tuning • Secondary: Weighting • Tertiary: Genre, Energy &amp; Vocal Spacing</Text></Box></Flex>
          <DataSourceControls
            sourceStatus={sourceStatus}
            source={state.source}
            configured={googleConfigured}
            poolSize={activeRegularPool.length}
            loadedCount={state.songs.length}
            hasSetlist={Boolean(state.sets.length)}
            onLoadGoogle={loadGoogleSongs}
            onRefresh={loadGoogleSongs}
            onCsvFile={loadCsv}
            onOpenPool={() => setPoolOpen(true)}
            onDownload={() => downloadSetlistCsv(state.sets)}
            onPrint={() => window.print()}
          />
        </Flex>

        <SettingsPanel settings={state.settings} display={state.display} title={state.title} dispatch={dispatch} onValidationChange={setSettingsValid} />

        {state.dataIssues.length > 0 && <Box className="no-print" bg="rgba(120,53,15,.8)" color="#fde68a" border="1px solid #d97706" borderRadius="12px" p="3" mb="4"><Text fontWeight="800">Loaded with {state.dataIssues.length} data warning{state.dataIssues.length === 1 ? '' : 's'}</Text>{state.dataIssues.slice(0, 5).map((issue, index) => <Text key={`${issue.row}-${index}`} fontSize="sm">{issue.row > 0 ? `Row ${issue.row}: ` : ''}{issue.message}</Text>)}{state.dataIssues.length > 5 && <Text fontSize="sm">…and {state.dataIssues.length - 5} more.</Text>}</Box>}
        {state.sourceChanged && <Box className="no-print" bg="rgba(30,64,175,.4)" color="#bfdbfe" border="1px solid #3b82f6" borderRadius="10px" p="3" mb="4">Songs were refreshed. The displayed setlist is preserved as a snapshot; regenerate to apply the updated pool.</Box>}
        {state.generationError && <Box className="no-print" bg="#7f1d1d" color="#fecaca" border="1px solid #ef4444" borderRadius="12px" p="4" mb="4" textAlign="center"><Text fontWeight="900" color="white">⚠ No Setlist Available</Text><Text>{state.generationError}</Text></Box>}

        <Flex className="desktop-actions no-print" display={{ base: 'none', md: 'flex' }} mb="5" align="center" justify="space-between" gap="2" wrap="wrap">
          <Flex gap="2" wrap="wrap"><AppButton tone="primary" disabled={!settingsValid} title={!settingsValid ? 'Correct the highlighted configuration fields before generating.' : undefined} onClick={() => runGeneration()}>⚡ Generate New Setlist</AppButton>{Object.keys(state.lockedSlots).length > 0 && <AppButton onClick={clearLocks}>🔓 Clear All Locks</AppButton>}</Flex>
          <Flex align="center" justify="flex-end" gap="3" wrap="wrap"><GenerationFeedback diagnostics={state.generationDiagnostics} /><Box bg="var(--surface)" border="1px solid var(--control-border)" borderRadius="999px" px="3.5" py="1.5" color="var(--muted)" fontSize="sm">Total: <Text as="strong" color="white">{gigMetrics.totalSongs} songs</Text> • <Text as="strong" color="white">{formatGigDuration(gigMetrics.totalSeconds)}</Text></Box></Flex>
        </Flex>
        {(state.generationDiagnostics || Object.keys(state.lockedSlots).length > 0) && <Flex className="no-print" display={{ base: 'flex', md: 'none' }} mb="4" align="center" justify="space-between" gap="3"><GenerationFeedback diagnostics={state.generationDiagnostics} />{Object.keys(state.lockedSlots).length > 0 && <AppButton flexShrink="0" size="xs" onClick={clearLocks}>🔓 Clear Locks</AppButton>}</Flex>}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Grid className="sets-grid" gridTemplateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap="4.5">
            {printPages.map((page) => <Box key={page.id} className={`print-page print-${page.density}`} data-set-count={page.items.length} data-effective-row-height={page.effectiveRowHeight}>
              <Box className="print-page-title">{state.title.trim() || 'ANTF Setlist Generator 3.0'}</Box>
              {page.items.map(({ set, setIndex }) => <SetCard key={set.id} set={set} setIndex={setIndex} regularSetCount={state.sets.filter((item) => item.title !== 'Encore').length} settings={state.settings} display={state.display} lockedSlots={state.lockedSlots} onLock={(songIndex) => dispatch({ type: 'TOGGLE_LOCK', setIndex, songIndex })} onBestSwap={(songIndex) => swapBestSong(setIndex, songIndex)} onSwap={(songIndex) => { setReplacementOverride(false); setReplacementTarget({ setIndex, songIndex }) }} onAdd={() => setAddTarget(setIndex)} onMoveSet={(toIndex) => dispatch({ type: 'MOVE_SET', fromIndex: setIndex, toIndex })} />)}
            </Box>)}
          </Grid>
        </DndContext>
        {!state.sets.length && !state.generationError && <Box py="16" textAlign="center" color="var(--muted)"><Text fontSize="4xl">🎸</Text><Text mt="2" fontWeight="800">Load the public band Sheet or a CSV to build a setlist.</Text></Box>}
      </Box>

      <Flex className="mobile-bottom-bar no-print" data-hidden={scrolling} display={{ base: 'flex', md: 'none' }} align="center" justify="space-between" gap="2">
        <AppButton tone="primary" size="sm" flexShrink="1" minW="0" px="3" disabled={!settingsValid} title={!settingsValid ? 'Correct the highlighted configuration fields before generating.' : undefined} onClick={() => runGeneration()}>⚡ Generate Setlist</AppButton>
        <AppButton tone="pool" size="sm" flexShrink="0" w="40px" minW="40px" px="0" aria-label={`Open Song Pool (${activeRegularPool.length} songs)`} title={`Song Pool (${activeRegularPool.length} songs)`} onClick={() => setPoolOpen(true)}>📋</AppButton>
        <Text minW="0" color="var(--muted)" fontSize="xs" textAlign="right" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Total: <Text as="strong" color="white">{formatGigDuration(gigMetrics.totalSeconds)}</Text></Text>
      </Flex>

      <SongPoolModal open={poolOpen} onClose={() => setPoolOpen(false)} songs={state.songs} excludedIds={state.excludedIds} onToggle={(id) => dispatch({ type: 'TOGGLE_EXCLUDE', id })} />
      <AddSongModal open={addTarget !== null} onClose={() => setAddTarget(null)} title={addTarget !== null ? state.sets[addTarget]?.title : ''} songs={availableToAdd} onAdd={(id) => { const song = state.songs.find((item) => item.id === id); if (song) dispatch({ type: 'ADD_SONG', setIndex: addTarget, song }); setAddTarget(null) }} />
      <ReplacementSongModal key={replacementTarget ? `${replacementTarget.setIndex}-${replacementTarget.songIndex}` : 'closed'} open={replacementTarget !== null} onClose={() => { setReplacementTarget(null); setReplacementOverride(false) }} title={replacementTarget ? `Replace Song ${replacementTarget.songIndex + 1} in ${state.sets[replacementTarget.setIndex]?.title}` : 'Replace Song'} candidates={replacementCandidates} override={replacementOverride} onOverrideChange={setReplacementOverride} onReplace={replaceSong} />
    </Box>
  )
}
