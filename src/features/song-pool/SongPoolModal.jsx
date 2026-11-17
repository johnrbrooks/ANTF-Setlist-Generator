import { Box, Flex, Input, Text } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import AppButton from '../../components/AppButton'
import Modal from '../../components/Modal'

const matches = (song, query) => [song.song, song.artist, song.genre, song.tuning, `w${song.weight}`, `v${song.vocalDifficulty}`].some((value) => value.toLowerCase().includes(query))

export function SongPoolModal({ open, onClose, songs, excludedIds, onToggle }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => songs.filter((song) => matches(song, query.toLowerCase())), [songs, query])
  return <Modal open={open} title="Song Pool & Gig Exclusions" onClose={onClose} fixedHeight><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search song, artist, genre, tuning, weight, or vocal diff…" bg="var(--bg)" color="var(--text)" borderColor="#64748b" _placeholder={{ color: '#94a3b8' }} _focusVisible={{ borderColor: 'var(--accent)', outline: '2px solid var(--accent)' }} mb="3" />{filtered.map((song) => { const excluded = excludedIds.has(song.id); const details = `${song.genre} • Vocal ${song.vocalDifficulty}/5 • Weight ${song.weight} • ${song.tuning} • ${song.twoGuitars ? '2 Gtr' : '1 Gtr'}${song.encoreOnly ? ' • Encore Only' : ''}`; return <Flex key={song.id} align="center" justify="space-between" minW="0" gap="3" py="2" borderBottom="1px solid var(--border)"><Box minW="0" overflow="hidden"><Text fontWeight="800" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={`${song.song} (${song.artist})`}>{song.song} <Text as="span" color="var(--muted)" fontWeight="400">({song.artist})</Text></Text><Text fontSize="xs" color="var(--muted)" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={details}>{details}</Text></Box><AppButton flexShrink="0" size="xs" tone={excluded ? 'danger' : 'success'} onClick={() => onToggle(song.id)}>{excluded ? 'Excluded' : 'Active'}</AppButton></Flex>})}</Modal>
}

export function AddSongModal({ open, onClose, title, songs, onAdd }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => songs.filter((song) => matches(song, query.toLowerCase())), [songs, query])
  return <Modal open={open} title={`Add Song to ${title}`} onClose={onClose}><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search available unused songs…" bg="var(--bg)" color="var(--text)" borderColor="#64748b" _placeholder={{ color: '#94a3b8' }} _focusVisible={{ borderColor: 'var(--accent)', outline: '2px solid var(--accent)' }} mb="3" />{filtered.length === 0 && <Text py="5" textAlign="center" color="var(--muted)">No available unused songs found.</Text>}{filtered.map((song) => { const details = `${song.genre} • Vocal ${song.vocalDifficulty}/5 • Weight ${song.weight} • ${song.tuning} • ${song.twoGuitars ? '2 Gtr' : '1 Gtr'}`; return <Flex key={song.id} align="center" justify="space-between" minW="0" gap="3" py="2" borderBottom="1px solid var(--border)"><Box minW="0" overflow="hidden"><Text fontWeight="800" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={`${song.song} (${song.artist})`}>{song.song} <Text as="span" color="var(--muted)" fontWeight="400">({song.artist})</Text></Text><Text fontSize="xs" color="var(--muted)" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={details}>{details}</Text></Box><AppButton flexShrink="0" size="xs" tone="primary" onClick={() => onAdd(song.id)}>+ Add</AppButton></Flex>})}</Modal>
}
