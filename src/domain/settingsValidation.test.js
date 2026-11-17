import { describe, expect, it } from 'vitest'
import { isValidSettingValue, validateNumericSetting } from './settingsValidation'

describe('settings validation', () => {
  it('accepts valid typed values and rejects partial or out-of-range input', () => {
    expect(validateNumericSetting('targetMinutes', '45')).toEqual({ valid: true, value: 45, error: '' })
    expect(validateNumericSetting('targetMinutes', '')).toMatchObject({ valid: false })
    expect(validateNumericSetting('targetMinutes', '19')).toMatchObject({ valid: false })
    expect(validateNumericSetting('targetMinutes', '61')).toMatchObject({ valid: false })
    expect(validateNumericSetting('targetMinutes', '30.5')).toMatchObject({ valid: false })
  })

  it('preserves the supported discrete choices', () => {
    expect(validateNumericSetting('numSets', '3').valid).toBe(true)
    expect(validateNumericSetting('numSets', '5').valid).toBe(false)
    expect(validateNumericSetting('bufferSeconds', '20').valid).toBe(true)
    expect(validateNumericSetting('bufferSeconds', '21').valid).toBe(false)
    expect(isValidSettingValue('maxTuningChanges', 99)).toBe(true)
    expect(isValidSettingValue('maxTuningChanges', 4)).toBe(false)
    expect(isValidSettingValue('groupGenre', true)).toBe(true)
    expect(isValidSettingValue('groupGenre', 'true')).toBe(false)
  })
})
