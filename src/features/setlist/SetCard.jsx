import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { validateSet, formatSeconds } from '../../services/setlist/metrics'

const badgeBase = { className: 'song-badge', fontSize: '10px', fontWeight: '800', px: '1.5', py: '.5', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '.03em' }

function SongBadge({ children, bg = '#334155', color = '#e2e8f0', className = '' }) {
  return <Badge {...badgeBase} className={`song-badge ${className}`} bg={bg} color={color}>{children}</Badge>
}

function SortableSong({ song, index, set, setIndex, previous, display, locked, onLock, onSwap }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id, data: { setIndex, songIndex: index } })
  const tuningChange = previous && previous.tuning !== song.tuning
  const guitarChange = previous && previous.twoGuitars !== song.twoGuitars
  const vocalClass = song.vocalDifficulty >= 5 ? 'vocal-5' : song.vocalDifficulty === 4 ? 'vocal-4' : song.vocalDifficulty === 3 ? 'vocal-3' : ''
  return (
    <>
      {previous && (tuningChange || guitarChange) && <Flex className="transition-banner" bg="var(--trans-bg)" color="var(--trans-text)" fontSize="10px" fontWeight="800" px="2" py=".5" mx="1.5" my=".5" border="1px dashed rgba(253,224,71,.4)" borderRadius="5px" textTransform="uppercase" gap="1.5">⚡ {tuningChange && `Tuning: ${previous.tuning} ➔ ${song.tuning}`}{tuningChange && guitarChange && ' | '}{guitarChange && `Guitar Change (${song.twoGuitars ? '2 Guitars' : '1 Guitar'})`}</Flex>}
      <Box ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} data-dragging={isDragging} className="song-row" as="li" display="flex" alignItems="center" gap="2" px="2.5" py="1.5" borderBottom="1px solid rgba(51,65,85,.4)" bg={locked ? 'rgba(56,189,248,.1)' : 'transparent'} border={locked ? '1px solid rgba(56,189,248,.35)' : undefined} borderRadius="8px" _hover={{ bg: 'var(--surface-hover)' }}>
        <Box className="drag-handle no-print" color="var(--muted)" px="1" fontSize="lg" {...attributes} {...listeners} aria-label={`Drag ${song.song}`}>⋮⋮</Box>
        <Box flex="1" minW="0">
          <Flex align="center" gap="1.5" wrap="wrap"><Text className="song-number" color="var(--muted)" fontSize="sm" fontWeight="800" w="20px">{index + 1}.</Text><Text className="song-name" fontWeight="800" fontSize="sm">{song.song}</Text>{display.artist && <Text className="song-artist" color="var(--muted)" fontSize="xs">— {song.artist}</Text>}</Flex>
          <Flex pl="26px" mt=".5" gap="1" wrap="wrap">
            {display.tuning && <SongBadge bg={song.tuning === 'Drop D' ? 'var(--drop-bg)' : 'var(--std-bg)'} color={song.tuning === 'Drop D' ? 'var(--drop-text)' : 'var(--std-text)'}>{song.tuning}</SongBadge>}
            {display.key && <SongBadge>Key: {song.key}</SongBadge>}
            {display.tempo && <SongBadge>{song.bpm} BPM</SongBadge>}
            {display.genre && <SongBadge>{song.genre}</SongBadge>}
            {display.vocal && <SongBadge className={vocalClass} bg={song.vocalDifficulty === 3 ? '#ca8a04' : song.vocalDifficulty === 4 ? '#c2410c' : song.vocalDifficulty >= 5 ? '#b91c1c' : undefined}>Vocal Diff: {song.vocalDifficulty}/5</SongBadge>}
            {display.duration && <SongBadge>{song.length}</SongBadge>}
            {display.guitars && <SongBadge>{song.twoGuitars ? '2 Guitars' : '1 Guitar'}</SongBadge>}
            {set.title === 'Encore' ? <SongBadge bg="var(--role-enc)" color="white">Encore</SongBadge> : index === 0 && song.opener ? <SongBadge bg="var(--role-open)" color="white">Opener</SongBadge> : index === set.songs.length - 1 && song.closer ? <SongBadge bg="var(--role-close)" color="white">Closer</SongBadge> : null}
          </Flex>
        </Box>
        <Flex className="no-print" gap="1"><Button size="xs" variant="outline" borderColor="var(--border)" title="Lock/Unlock Song" onClick={onLock}>{locked ? '🔒' : '🔓'}</Button><Button size="xs" variant="outline" borderColor="var(--border)" title="Swap Song" onClick={onSwap}>↻</Button></Flex>
      </Box>
    </>
  )
}

export default function SetCard({ set, setIndex, settings, display, lockedSlots, onLock, onSwap, onAdd }) {
  const [expanded, setExpanded] = useState(true)
  const metrics = validateSet(set, settings)
  return (
    <Box className="set-card" bg="var(--surface)" border="1px solid var(--border)" borderRadius="12px" overflow="hidden" alignSelf="start">
      <Flex className="set-header" bg="rgba(15,23,42,.6)" px="3.5" py="2.5" borderBottom="1px solid var(--border)" justify="space-between" align="center" gap="2" onClick={() => setExpanded((value) => !value)} cursor="pointer">
        <Flex align="center" gap="2"><Text className="set-title" color="var(--accent)" fontWeight="800">{set.title}</Text><Text className="no-print" color="var(--muted)" fontSize="xs">{expanded ? '▾' : '▸'}</Text></Flex>
        <Text className="set-meta" textAlign="right" color="var(--muted)" fontSize="xs">{set.songs.length} songs • {formatSeconds(metrics.totalSeconds)}<br />{metrics.tuningChanges} Tuning / {metrics.guitarChanges} Guitar swaps</Text>
      </Flex>
      <Box className="set-content" display={expanded ? 'block' : 'none'}>
        {metrics.warnings.length > 0 && <Box className="no-print" bg="rgba(127,29,29,.55)" color="#fecaca" px="3" py="2" fontSize="xs">{metrics.warnings.map((warning) => <Text key={warning}>⚠ {warning}</Text>)}</Box>}
        <SortableContext items={set.songs.map((song) => song.id)} strategy={verticalListSortingStrategy}>
          <Box className="song-list" as="ul" listStyleType="none" m="0" p="1.5">{set.songs.map((song, index) => <SortableSong key={song.id} song={song} index={index} set={set} setIndex={setIndex} previous={set.songs[index - 1]} display={display} locked={Boolean(lockedSlots[`${setIndex}-${index}`])} onLock={() => onLock(index)} onSwap={() => onSwap(index)} />)}</Box>
        </SortableContext>
        <Box className="no-print" p="1.5" borderTop="1px solid var(--border)" bg="rgba(15,23,42,.3)"><Button w="100%" size="xs" variant="outline" borderStyle="dashed" borderColor="var(--border)" color="var(--accent)" onClick={onAdd}>+ Add Song to {set.title}</Button></Box>
      </Box>
    </Box>
  )
}
