import { Box, Flex, Grid, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { validateNumericSetting } from '../../domain/settingsValidation'

const labelStyle = { fontSize: 'xs', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', fontWeight: '700' }

function Field({ id, label, children, span = 1 }) {
  return <Box gridColumn={{ base: '1', md: `span ${span}` }}><Text as="label" htmlFor={id} {...labelStyle} display="block" mb="1.5">{label}</Text>{children}</Box>
}

function Check({ checked, onChange, children }) {
  return <Flex as="label" align="center" gap="2" py="1" fontSize="sm" cursor="pointer"><input className="native-checkbox" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{children}</Flex>
}

function ResponsiveSection({ id, title, expanded, onToggle, children }) {
  return (
    <Box
      display={{ base: 'block', md: 'contents' }}
      bg={{ base: 'var(--surface)', md: 'transparent' }}
      border={{ base: '1px solid var(--border)', md: '0' }}
      borderRadius={{ base: '12px', md: '0' }}
      mb={{ base: '3', md: '0' }}
      overflow="hidden"
    >
      <Flex
        className="settings-toggle"
        as="button"
        type="button"
        display={{ base: 'flex', md: 'none' }}
        w="100%"
        justify="space-between"
        align="center"
        cursor="pointer"
        px="4"
        py="3"
        color="var(--accent)"
        fontWeight="800"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={id}
      >
        {title}
        <Text as="span" color="var(--text)">{expanded ? '▾' : '▸'}</Text>
      </Flex>
      <Grid
        id={id}
        display={{ base: expanded ? 'grid' : 'none', md: 'contents' }}
        gridTemplateColumns="minmax(0, 1fr)"
        gap="3.5"
        px={{ base: '4', md: '0' }}
        pb={{ base: '4', md: '0' }}
      >
        {children}
      </Grid>
    </Box>
  )
}

function ValidatedNumberField({ name, label, value, onChange, onValidityChange }) {
  const [draft, setDraft] = useState(String(value))
  const validation = validateNumericSetting(name, draft)
  const inputId = `setting-${name}`
  const errorId = `${inputId}-error`

  const handleChange = (event) => {
    const nextDraft = event.target.value
    const nextValidation = validateNumericSetting(name, nextDraft)
    setDraft(nextDraft)
    onValidityChange(name, nextValidation.valid)
    if (nextValidation.valid) onChange(nextValidation.value)
  }

  return (
    <Field id={inputId} label={label}>
      <input
        id={inputId}
        className="native-control"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={draft}
        aria-invalid={!validation.valid}
        aria-describedby={!validation.valid ? errorId : undefined}
        onChange={handleChange}
      />
      <Text id={errorId} role={!validation.valid ? 'alert' : undefined} aria-hidden={validation.valid} visibility={validation.valid ? 'hidden' : 'visible'} className="field-error">{validation.valid ? '\u00a0' : validation.error}</Text>
    </Field>
  )
}

export default function SettingsPanel({ settings, display, title, dispatch, onValidationChange }) {
  const [expanded, setExpanded] = useState(true)
  const [mobileSections, setMobileSections] = useState({ configuration: true, clustering: false, filters: false })
  const [invalidFields, setInvalidFields] = useState(() => new Set())
  const setting = (name, value) => dispatch({ type: 'SET_SETTING', name, value })
  const filter = (name, value) => dispatch({ type: 'SET_DISPLAY', name, value })

  useEffect(() => onValidationChange(invalidFields.size === 0), [invalidFields, onValidationChange])

  const reportValidity = (name, valid) => {
    setInvalidFields((current) => {
      const next = new Set(current)
      if (valid) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleMobileSection = (name) => {
    setMobileSections((current) => ({ ...current, [name]: !current[name] }))
  }

  return (
    <Box bg={{ base: 'transparent', md: 'var(--surface)' }} border={{ base: '0', md: '1px solid var(--border)' }} borderRadius={{ base: '0', md: '12px' }} mb="5" className="settings-panel no-print">
      <Flex className="settings-toggle" as="button" type="button" display={{ base: 'none', md: 'flex' }} w="100%" justify="space-between" align="center" cursor="pointer" px="4" py="3" color="var(--accent)" fontWeight="800" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>Gig Settings &amp; Stage Sheet Display <Text as="span" color="var(--text)">{expanded ? '▾' : '▸'}</Text></Flex>
      <Grid display={{ base: 'block', md: expanded ? 'grid' : 'none' }} px={{ base: '0', md: '4' }} pt={{ base: '0', md: '2' }} pb={{ base: '0', md: '4' }} gridTemplateColumns={{ md: 'repeat(5, minmax(0, 1fr))' }} gap={{ base: '0', md: '3.5' }} alignItems="start">
        <ResponsiveSection id="mobile-configuration" title="Configuration" expanded={mobileSections.configuration} onToggle={() => toggleMobileSection('configuration')}>
          <Field id="setting-title" label="Gig / Stage Header Title" span={2}>
            <input id="setting-title" className="native-control" value={title} maxLength={100} onChange={(event) => dispatch({ type: 'SET_TITLE', value: event.target.value })} placeholder="e.g. ANTF Lighthorse 12-16-26" />
          </Field>
          <ValidatedNumberField name="numSets" label="Number of Sets (1–4)" value={settings.numSets} onChange={(value) => setting('numSets', value)} onValidityChange={reportValidity} />
          <ValidatedNumberField name="targetMinutes" label="Target Set Length (20–90 Min)" value={settings.targetMinutes} onChange={(value) => setting('targetMinutes', value)} onValidityChange={reportValidity} />
          <ValidatedNumberField name="bufferSeconds" label="Song Buffer (1–60 Sec)" value={settings.bufferSeconds} onChange={(value) => setting('bufferSeconds', value)} onValidityChange={reportValidity} />
          <ValidatedNumberField name="encoreCount" label="Encore Songs (0–3)" value={settings.encoreCount} onChange={(value) => setting('encoreCount', value)} onValidityChange={reportValidity} />
          <Field id="setting-max-tuning" label="Max Tuning Changes / Set"><select id="setting-max-tuning" className="native-control" value={settings.maxTuningChanges} onChange={(e) => setting('maxTuningChanges', Number(e.target.value))}><option value="99">No Limit</option><option value="3">Max 3</option><option value="2">Max 2</option><option value="1">Max 1</option><option value="0">0 (Single Tuning)</option></select></Field>
          <Field id="setting-max-guitar" label="Max Guitar Changes / Set"><select id="setting-max-guitar" className="native-control" value={settings.maxGuitarChanges} onChange={(e) => setting('maxGuitarChanges', Number(e.target.value))}><option value="99">No Limit</option><option value="4">Max 4</option><option value="3">Max 3</option><option value="2">Max 2</option><option value="1">Max 1</option><option value="0">0 (No Setup Change)</option></select></Field>
        </ResponsiveSection>

        <ResponsiveSection id="mobile-clustering" title="Clustering &amp; Pool" expanded={mobileSections.clustering} onToggle={() => toggleMobileSection('clustering')}>
          <Box gridColumn={{ base: '1', md: 'span 1' }}>
            <Text {...labelStyle} display={{ base: 'none', md: 'block' }} mb="1.5">Clustering &amp; Pool</Text>
            <Check checked={settings.groupTuning} onChange={(v) => setting('groupTuning', v)}>Group Standard / Drop D</Check>
            <Check checked={settings.groupGuitars} onChange={(v) => setting('groupGuitars', v)}>Group Guitar Swaps</Check>
            <Check checked={settings.groupGenre} onChange={(v) => setting('groupGenre', v)}>Group Genre (2–3 Songs)</Check>
            <Check checked={settings.includeWeight4} onChange={(v) => setting('includeWeight4', v)}>Include Weight 4</Check>
          </Box>
        </ResponsiveSection>

        <ResponsiveSection id="mobile-stage-filters" title="Stage Sheet Filters" expanded={mobileSections.filters} onToggle={() => toggleMobileSection('filters')}>
          <Box gridColumn={{ base: '1', md: '1 / -1' }} bg={{ base: 'transparent', md: 'rgba(42,27,49,.32)' }} border={{ base: '0', md: '1px solid var(--border)' }} borderRadius={{ base: '0', md: '8px' }} p={{ base: '0', md: '3' }}>
            <Text {...labelStyle} display={{ base: 'none', md: 'block' }} color="var(--accent)" mb="1">Stage Sheet Display Filters</Text>
            <Grid gridTemplateColumns={{ base: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }} columnGap="4" rowGap="0">
              {[['artist','Artist Name'],['genre','Genre'],['vocal','Vocal Diff'],['duration','Duration'],['guitars','Guitar Count'],['tuning','Guitar Tuning'],['bassTuning','Bass Tuning'],['tempo','Tempo (BPM)'],['key','Key']].map(([name, label]) => <Check key={name} checked={display[name]} onChange={(v) => filter(name, v)}>Show {label}</Check>)}
            </Grid>
          </Box>
        </ResponsiveSection>
      </Grid>
    </Box>
  )
}
