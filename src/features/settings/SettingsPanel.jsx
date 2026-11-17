import { Box, Flex, Grid, Text } from '@chakra-ui/react'
import { useState } from 'react'

const labelStyle = { fontSize: 'xs', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', fontWeight: '700' }

function Field({ label, children, span = 1 }) {
  return <Box gridColumn={{ base: '1', md: `span ${span}` }}><Text as="label" {...labelStyle} display="block" mb="1.5">{label}</Text>{children}</Box>
}

function Check({ checked, onChange, children }) {
  return <Flex as="label" align="center" gap="2" py="1" fontSize="sm" cursor="pointer"><input className="native-checkbox" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{children}</Flex>
}

export default function SettingsPanel({ settings, display, title, dispatch }) {
  const [expanded, setExpanded] = useState(true)
  const setting = (name, value) => dispatch({ type: 'SET_SETTING', name, value })
  const filter = (name, value) => dispatch({ type: 'SET_DISPLAY', name, value })
  return (
    <Box bg="var(--surface)" border="1px solid var(--border)" borderRadius="12px" mb="5" className="no-print">
      <Flex as="button" type="button" w="100%" justify="space-between" align="center" cursor="pointer" px="4" py="3" color="var(--accent)" fontWeight="800" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>Gig Settings &amp; Stage Sheet Display <Text as="span" color="var(--muted)">{expanded ? '▾' : '▸'}</Text></Flex>
      {expanded && <Grid px="4" pb="4" gridTemplateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }} gap="3.5" alignItems="end">
        <Field label="Gig / Stage Header Title" span={2}>
          <input className="native-control" value={title} onChange={(event) => dispatch({ type: 'SET_TITLE', value: event.target.value })} placeholder="e.g. ANTF Lighthorse 12-16-26" />
        </Field>
        <Field label="Number of Sets"><select className="native-control" value={settings.numSets} onChange={(e) => setting('numSets', Number(e.target.value))}><option value="3">3 Sets</option><option value="4">4 Sets</option></select></Field>
        <Field label="Target Set Length (Min)"><input className="native-control" type="number" min="20" max="60" value={settings.targetMinutes} onChange={(e) => setting('targetMinutes', Math.min(60, Math.max(20, Number(e.target.value))))} /></Field>
        <Field label="Song Buffer (Sec)"><select className="native-control" value={settings.bufferSeconds} onChange={(e) => setting('bufferSeconds', Number(e.target.value))}>{[15,20,25,30].map((value) => <option key={value} value={value}>{value} sec</option>)}</select></Field>
        <Field label="Encore Songs"><select className="native-control" value={settings.encoreCount} onChange={(e) => setting('encoreCount', Number(e.target.value))}>{[0,1,2,3].map((value) => <option key={value} value={value}>{value === 0 ? 'No Encore' : `${value} Song${value > 1 ? 's' : ''}`}</option>)}</select></Field>
        <Field label="Max Tuning Changes / Set"><select className="native-control" value={settings.maxTuningChanges} onChange={(e) => setting('maxTuningChanges', Number(e.target.value))}><option value="99">No Limit</option><option value="3">Max 3</option><option value="2">Max 2</option><option value="1">Max 1</option><option value="0">0 (Single Tuning)</option></select></Field>
        <Field label="Max Guitar Changes / Set"><select className="native-control" value={settings.maxGuitarChanges} onChange={(e) => setting('maxGuitarChanges', Number(e.target.value))}><option value="99">No Limit</option><option value="4">Max 4</option><option value="3">Max 3</option><option value="2">Max 2</option><option value="1">Max 1</option><option value="0">0 (No Setup Change)</option></select></Field>
        <Field label="Clustering & Pool"><Check checked={settings.groupTuning} onChange={(v) => setting('groupTuning', v)}>Group Standard / Drop D</Check><Check checked={settings.groupGuitars} onChange={(v) => setting('groupGuitars', v)}>Group Guitar Swaps</Check><Check checked={settings.includeWeight4} onChange={(v) => setting('includeWeight4', v)}>Include Weight 4</Check></Field>
        <Box gridColumn={{ base: '1', sm: '1 / -1' }} bg="rgba(15,23,42,.4)" border="1px solid var(--border)" borderRadius="8px" p="3">
          <Text {...labelStyle} color="var(--accent)" mb="1">Stage Sheet Display Filters</Text>
          <Flex wrap="wrap" gapX="4" gapY="0">
            {[['artist','Artist Name'],['genre','Genre'],['vocal','Vocal Diff'],['duration','Duration'],['guitars','Guitar Count'],['tuning','Tuning'],['tempo','Tempo (BPM)'],['key','Key']].map(([name, label]) => <Check key={name} checked={display[name]} onChange={(v) => filter(name, v)}>Show {label}</Check>)}
          </Flex>
        </Box>
      </Grid>}
    </Box>
  )
}
