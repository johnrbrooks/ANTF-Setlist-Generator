import { Box, Flex, Input, Text } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import AppButton from '../../components/AppButton'
import Modal from '../../components/Modal'

const matches = (song, query) => [song.song, song.artist, song.genre, song.tuning, song.bassTuning, `w${song.weight}`, `v${song.vocalDifficulty}`, `e${song.energyRating}`].some((value) => String(value ?? '').toLowerCase().includes(query))

const songDetails = (song) => `${song.genre} • Vocal ${song.vocalDifficulty}/5 • Energy ${song.energyRating}/5 • Weight ${song.weight} • Guitar ${song.tuning}${song.bassTuning ? ` • Bass ${song.bassTuning}` : ''} • ${song.twoGuitars ? '2 Gtr' : '1 Gtr'}${song.encoreOnly ? ' • Encore Only' : ''}`

export function SongPoolModal({ open, onClose, songs, excludedIds, onToggle }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => songs.filter((song) => matches(song, query.toLowerCase())), [songs, query])
  return <Modal open={open} title="Song Pool & Gig Exclusions" onClose={onClose} fixedHeight><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search song, artist, tuning, energy, weight, or vocal diff…" bg="var(--bg)" color="var(--text)" borderColor="var(--control-border)" _placeholder={{ color: 'var(--muted)' }} _focusVisible={{ borderColor: 'var(--accent)', outline: '2px solid var(--accent)' }} mb="3" />{filtered.map((song) => { const excluded = excludedIds.has(song.id); const details = songDetails(song); return <Flex key={song.id} align="center" justify="space-between" minW="0" gap="3" py="2" borderBottom="1px solid var(--border)"><Box minW="0" overflow="hidden"><Text fontWeight="800" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={`${song.song} (${song.artist})`}>{song.song} <Text as="span" color="var(--muted)" fontWeight="400">({song.artist})</Text></Text><Text fontSize="xs" color="var(--muted)" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={details}>{details}</Text></Box><AppButton flexShrink="0" size="xs" tone={excluded ? 'danger' : 'success'} onClick={() => onToggle(song.id)}>{excluded ? 'Excluded' : 'Active'}</AppButton></Flex>})}</Modal>
}

export function AddSongModal({ open, onClose, title, songs, onAdd }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => songs.filter((song) => matches(song, query.toLowerCase())), [songs, query])
  return <Modal open={open} title={`Add Song to ${title}`} onClose={onClose}><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search available unused songs…" bg="var(--bg)" color="var(--text)" borderColor="var(--control-border)" _placeholder={{ color: 'var(--muted)' }} _focusVisible={{ borderColor: 'var(--accent)', outline: '2px solid var(--accent)' }} mb="3" />{filtered.length === 0 && <Text py="5" textAlign="center" color="var(--muted)">No available unused songs found.</Text>}{filtered.map((song) => { const details = songDetails(song); return <Flex key={song.id} align="center" justify="space-between" minW="0" gap="3" py="2" borderBottom="1px solid var(--border)"><Box minW="0" overflow="hidden"><Text fontWeight="800" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={`${song.song} (${song.artist})`}>{song.song} <Text as="span" color="var(--muted)" fontWeight="400">({song.artist})</Text></Text><Text fontSize="xs" color="var(--muted)" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={details}>{details}</Text></Box><AppButton flexShrink="0" size="xs" tone="primary" onClick={() => onAdd(song.id)}>+ Add</AppButton></Flex>})}</Modal>
}

export function ReplacementSongModal({ open, onClose, title, candidates, override, onOverrideChange, onReplace }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => candidates.filter(({ song }) => matches(song, query.toLowerCase())), [candidates, query])
  const best = candidates[0]?.song
  return (
    <Modal open={open} title={title} onClose={onClose} fixedHeight>
      <Flex direction={{ base: 'column', sm: 'row' }} gap="2" mb="3" align={{ sm: 'center' }} justify="space-between">
        <Flex as="label" align="center" gap="2" fontSize="sm" cursor="pointer"><input className="native-checkbox" type="checkbox" checked={override} onChange={(event) => onOverrideChange(event.target.checked)} />Manual override</Flex>
        <AppButton tone="primary" size="sm" disabled={!best} onClick={() => best && onReplace(best.id)}>⚡ Choose Best Match</AppButton>
      </Flex>
      <Box className={override ? 'override-note override-note-warning' : 'override-note'} mb="3">{override ? 'Manual override may break role, opening, duration, or transition rules. Duplicate songs and Encore-only placement remain blocked.' : 'Showing unused songs that preserve the active pool, role, opening, duration, and transition rules.'}</Box>
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search replacement songs…" bg="var(--bg)" color="var(--text)" borderColor="var(--control-border)" _placeholder={{ color: 'var(--muted)' }} _focusVisible={{ borderColor: 'var(--accent)', outline: '2px solid var(--accent)' }} mb="3" />
      {filtered.length === 0 && <Text py="5" textAlign="center" color="var(--muted)">No unused songs match this replacement mode.</Text>}
      {filtered.map(({ song, cost }) => { const details = songDetails(song); return <Flex key={song.id} align="center" justify="space-between" minW="0" gap="3" py="2" borderBottom="1px solid var(--border)"><Box minW="0" overflow="hidden"><Text fontWeight="800" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={`${song.song} (${song.artist})`}>{song.song} <Text as="span" color="var(--muted)" fontWeight="400">({song.artist})</Text></Text><Text fontSize="xs" color="var(--muted)" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={details}>{details} • Flow {cost.toFixed(1)}</Text></Box><AppButton flexShrink="0" size="xs" tone="primary" onClick={() => onReplace(song.id)}>Select</AppButton></Flex>})}
    </Modal>
  )
}
