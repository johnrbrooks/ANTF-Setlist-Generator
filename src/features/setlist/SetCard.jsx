import { Badge, Box, Flex, Text } from '@chakra-ui/react'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import AppButton from '../../components/AppButton'
import Modal from '../../components/Modal'
import { validateSet, formatSeconds } from '../../services/setlist/metrics'

const badgeBase = { className: 'song-badge', fontSize: '10px', fontWeight: '800', px: '1.5', py: '.5', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '.03em' }

function SongBadge({ children, bg = '#334155', color = '#e2e8f0', className = '' }) {
  return <Badge {...badgeBase} className={`song-badge ${className}`} bg={bg} color={color} flexShrink="0" maxW={{ base: '130px', md: 'none' }} overflow="hidden" textOverflow="ellipsis" title={String(children)}>{children}</Badge>
}

function SortableSong({ song, index, set, setIndex, previous, display, locked, onLock, onBestSwap, onSwap, onOpenActions }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id, data: { setIndex, songIndex: index } })
  const tuningChange = previous && previous.tuning !== song.tuning
  const bassTuning = song.bassTuning || song.tuning
  const previousBassTuning = previous && (previous.bassTuning || previous.tuning)
  const bassTuningChange = previous && previousBassTuning !== bassTuning
  const guitarChange = previous && previous.twoGuitars !== song.twoGuitars
  const transitionCount = [tuningChange, bassTuningChange, guitarChange].filter(Boolean).length
  const vocalClass = song.vocalDifficulty >= 5 ? 'vocal-5' : song.vocalDifficulty === 4 ? 'vocal-4' : song.vocalDifficulty === 3 ? 'vocal-3' : ''
  return (
    <>
      {previous && transitionCount > 0 && <Flex className="transition-group" mx="1.5" my=".5" gap="1" wrap="nowrap" overflow="hidden">{tuningChange && <Box className="transition-banner tuning-transition" minW="0" flex="1 1 0" fontSize={{ base: '9px', sm: '10px' }} fontWeight="800" px={{ base: '1.5', sm: '2' }} py=".5" borderRadius="5px" textAlign="center" textTransform="uppercase" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={`Guitar tuning: ${previous.tuning} to ${song.tuning}`}>⚡ Guitar: {previous.tuning} ➔ {song.tuning}</Box>}{bassTuningChange && <Box className="transition-banner bass-transition" minW="0" flex="1 1 0" fontSize={{ base: '9px', sm: '10px' }} fontWeight="800" px={{ base: '1.5', sm: '2' }} py=".5" borderRadius="5px" textAlign="center" textTransform="uppercase" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={`Bass tuning: ${previousBassTuning} to ${bassTuning}`}>𝄢 Bass: {previousBassTuning} ➔ {bassTuning}</Box>}{guitarChange && <Box className="transition-banner guitar-transition" minW="0" flex="1 1 0" fontSize={{ base: '9px', sm: '10px' }} fontWeight="800" px={{ base: '1.5', sm: '2' }} py=".5" borderRadius="5px" textAlign="center" textTransform="uppercase" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={`Guitar change: ${song.twoGuitars ? '2 guitars' : '1 guitar'}`}>◆ Setup ({song.twoGuitars ? '2 Guitars' : '1 Guitar'})</Box>}</Flex>}
      <Box ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} data-dragging={isDragging} className="song-row" as="li" display="flex" alignItems="center" minW="0" gap="2" px="2.5" py="1.5" borderBottom="1px solid rgba(112,66,128,.24)" bg={locked ? 'rgba(142,69,176,.14)' : 'transparent'} border={locked ? '1px solid rgba(166,91,200,.52)' : undefined} borderRadius="8px" _hover={{ bg: 'var(--surface-hover)' }}>
        <Box className="drag-handle no-print" flexShrink="0" color="var(--text)" bg="rgba(12,10,13,.76)" border="1px solid var(--control-border)" borderRadius="5px" px="1" fontSize="lg" {...attributes} {...listeners} aria-label={`Drag ${song.song}`}>⋮⋮</Box>
        <Box className="song-content" flex="1" minW="0" overflow="hidden">
          <Flex className="song-primary" align="center" gap="1.5" flexWrap={{ base: 'nowrap', md: 'wrap' }} overflow="visible"><Text className="song-number" flexShrink="0" color="var(--muted)" fontSize="sm" fontWeight="800" w="26px" whiteSpace="nowrap">{index + 1}.</Text><Text className="song-name" minW="0" flex={{ base: '1 1 auto', md: '0 1 auto' }} overflow={{ base: 'visible', md: 'hidden' }} textOverflow={{ base: 'clip', md: 'ellipsis' }} whiteSpace={{ base: 'normal', md: 'nowrap' }} overflowWrap="break-word" title={song.song} fontWeight="800" fontSize="sm">{song.song}</Text>{display.artist && <Text className="song-artist" flex={{ base: '0 1 38%', md: '0 1 auto' }} minW="0" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" title={song.artist} color="var(--muted)" fontSize="xs"><Text as="span" className="artist-prefix">— </Text>{song.artist}</Text>}</Flex>
          <Flex className="song-details" pl="32px" mt=".5" gap="1" flexWrap={{ base: 'nowrap', md: 'wrap' }} overflow="hidden">
            {display.tuning && <SongBadge bg={song.tuning === 'Drop D' ? 'var(--drop-bg)' : 'var(--std-bg)'} color={song.tuning === 'Drop D' ? 'var(--drop-text)' : 'var(--std-text)'}>{song.tuning}</SongBadge>}
            {display.bassTuning && song.bassTuning && song.bassTuning !== song.tuning && <SongBadge className="bass-tuning-badge" bg="var(--bass-bg)" color="var(--bass-text)">Bass: {song.bassTuning}</SongBadge>}
            {display.key && <SongBadge>Key: {song.key}</SongBadge>}
            {display.tempo && <SongBadge>{song.bpm} BPM</SongBadge>}
            {display.genre && <SongBadge>{song.genre}</SongBadge>}
            {display.vocal && <SongBadge className={vocalClass} bg={song.vocalDifficulty === 3 ? '#ca8a04' : song.vocalDifficulty === 4 ? '#c2410c' : song.vocalDifficulty >= 5 ? '#b91c1c' : undefined}>Vocal Diff: {song.vocalDifficulty}/5</SongBadge>}
            {display.duration && <SongBadge>{song.length}</SongBadge>}
            {display.guitars && <SongBadge>{song.twoGuitars ? '2 Guitars' : '1 Guitar'}</SongBadge>}
            {set.title === 'Encore' ? <SongBadge bg="var(--role-enc)" color="white">Encore</SongBadge> : index === 0 && song.opener ? <SongBadge bg="var(--role-open)" color="white">Opener</SongBadge> : index === set.songs.length - 1 && song.closer ? <SongBadge bg="var(--role-close)" color="white">Closer</SongBadge> : null}
          </Flex>
        </Box>
        <Flex className="no-print" display={{ base: 'none', md: 'flex' }} flexShrink="0" gap="1"><AppButton size="xs" minW="32px" aria-label={locked ? `Unlock ${song.song}` : `Lock ${song.song}`} title="Lock/Unlock Song" onClick={onLock}>{locked ? '🔒' : '🔓'}</AppButton><AppButton size="xs" minW="32px" aria-label={`Automatically replace ${song.song} with best match`} title="Best Match" onClick={onBestSwap}>↻</AppButton><AppButton size="xs" minW="32px" aria-label={`Replace ${song.song}`} title="Choose Replacement" onClick={onSwap}>♫</AppButton></Flex>
        <AppButton className="no-print" display={{ base: 'inline-flex', md: 'none' }} flexShrink="0" size="xs" minW="32px" px="1" aria-label={`More actions for ${song.song}`} title="Song Actions" onClick={onOpenActions}>⋯</AppButton>
      </Box>
    </>
  )
}

export default function SetCard({ set, setIndex, regularSetCount, settings, display, lockedSlots, onLock, onBestSwap, onSwap, onAdd, onMoveSet }) {
  const [expanded, setExpanded] = useState(true)
  const [actionSongIndex, setActionSongIndex] = useState(null)
  const metrics = validateSet(set, settings)
  const actionSong = actionSongIndex === null ? null : set.songs[actionSongIndex]
  const closeActions = () => setActionSongIndex(null)
  return (
    <>
    <Box className="set-card" data-song-count={set.songs.length} bg="var(--surface)" border="1px solid var(--border)" borderRadius="12px" overflow="hidden" alignSelf="start">
      <Flex className="set-header" bg="rgba(42,27,49,.6)" px="3.5" py="2.5" borderBottom="1px solid var(--border)" justify="space-between" align="center" minW="0" gap="2" onClick={() => setExpanded((value) => !value)} cursor="pointer">
        <Flex align="center" minW="0" gap="2"><Text className="set-title" flexShrink="0" color="var(--accent)" fontWeight="800">{set.title}</Text><Text className="no-print" flexShrink="0" color="var(--muted)" fontSize="xs">{expanded ? '▾' : '▸'}</Text>{set.title !== 'Encore' && <select className="set-position-select no-print" aria-label={`Move ${set.title} to position`} value={setIndex} onClick={(event) => event.stopPropagation()} onChange={(event) => { event.stopPropagation(); onMoveSet(Number(event.target.value)) }}>{Array.from({ length: regularSetCount }, (_, index) => <option key={index} value={index}>Move to Set {index + 1}</option>)}</select>}</Flex>
        <Text className="set-meta" flexShrink="0" whiteSpace="nowrap" textAlign="right" color="var(--muted)" fontSize="xs">{set.songs.length} songs • {formatSeconds(metrics.totalSeconds)}<br />{metrics.tuningChanges} Tuning / {metrics.guitarChanges} Guitar swaps</Text>
      </Flex>
      <Box className="set-content" display={expanded ? 'block' : 'none'}>
        {metrics.warnings.length > 0 && <Box className="no-print" bg="rgba(127,29,29,.55)" color="#fecaca" px="3" py="2" fontSize="xs">{metrics.warnings.map((warning) => <Text key={warning}>⚠ {warning}</Text>)}</Box>}
        <SortableContext items={set.songs.map((song) => song.id)} strategy={verticalListSortingStrategy}>
          <Box className="song-list" as="ul" listStyleType="none" m="0" p="1.5">{set.songs.map((song, index) => <SortableSong key={song.id} song={song} index={index} set={set} setIndex={setIndex} previous={set.songs[index - 1]} display={display} locked={Boolean(lockedSlots[`${setIndex}-${index}`])} onLock={() => onLock(index)} onBestSwap={() => onBestSwap(index)} onSwap={() => onSwap(index)} onOpenActions={() => setActionSongIndex(index)} />)}</Box>
        </SortableContext>
        <Box className="no-print" p="1.5" borderTop="1px solid var(--border)" bg="rgba(31,22,35,.55)"><AppButton w="100%" size="xs" borderStyle="dashed" color="var(--accent)" onClick={onAdd}>+ Add Song to {set.title}</AppButton></Box>
      </Box>
    </Box>
    <Modal compact open={Boolean(actionSong)} title={actionSong ? `Actions for ${actionSong.song}` : 'Song Actions'} onClose={closeActions}>
      {actionSong && <Flex direction="column" gap="2">
        <AppButton w="100%" onClick={() => { onLock(actionSongIndex); closeActions() }}>{lockedSlots[`${setIndex}-${actionSongIndex}`] ? '🔓 Unlock Song' : '🔒 Lock Song'}</AppButton>
        <AppButton w="100%" onClick={() => { onBestSwap(actionSongIndex); closeActions() }}>↻ Best Match</AppButton>
        <AppButton w="100%" tone="primary" onClick={() => { onSwap(actionSongIndex); closeActions() }}>♫ Choose Replacement</AppButton>
      </Flex>}
    </Modal>
    </>
  )
}
