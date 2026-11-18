export const NUMERIC_SETTING_RULES = Object.freeze({
  numSets: { label: 'Number of sets', min: 1, max: 4, message: 'Use a whole number from 1–4.' },
  targetMinutes: { label: 'Target set length', min: 20, max: 90, message: 'Use 20–90 whole minutes.' },
  bufferSeconds: { label: 'Song buffer', min: 1, max: 60, message: 'Use a whole number from 1–60 seconds.' },
  encoreCount: { label: 'Encore songs', min: 0, max: 3, message: 'Use a whole number from 0–3.' },
})

const selectRules = Object.freeze({
  maxTuningChanges: [0, 1, 2, 3, 99],
  maxGuitarChanges: [0, 1, 2, 3, 4, 99],
})

const booleanSettings = new Set(['groupTuning', 'groupGuitars', 'groupGenre', 'includeWeight4'])

export function validateNumericSetting(name, rawValue) {
  const rule = NUMERIC_SETTING_RULES[name]
  if (!rule) return { valid: false, error: 'Unknown configuration field.' }
  const text = String(rawValue ?? '').trim()
  if (!text) return { valid: false, error: 'A value is required.' }
  if (!/^-?\d+$/.test(text)) return { valid: false, error: rule.message }

  const value = Number(text)
  const inAllowedSet = !rule.allowed || rule.allowed.includes(value)
  const inRange = (rule.min === undefined || value >= rule.min) && (rule.max === undefined || value <= rule.max)
  if (!Number.isSafeInteger(value) || !inAllowedSet || !inRange) return { valid: false, error: rule.message }
  return { valid: true, value, error: '' }
}

export function isValidSettingValue(name, value) {
  if (NUMERIC_SETTING_RULES[name]) return validateNumericSetting(name, value).valid
  if (selectRules[name]) return selectRules[name].includes(value)
  if (booleanSettings.has(name)) return typeof value === 'boolean'
  return false
}
