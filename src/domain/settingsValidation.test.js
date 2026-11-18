import { describe, expect, it } from 'vitest'
import { isValidSettingValue, validateNumericSetting } from './settingsValidation'

describe('settings validation', () => {
  it('accepts valid typed values and rejects partial or out-of-range input', () => {
    expect(validateNumericSetting('targetMinutes', '45')).toEqual({ valid: true, value: 45, error: '' })
    expect(validateNumericSetting('targetMinutes', '')).toMatchObject({ valid: false })
    expect(validateNumericSetting('targetMinutes', '19')).toMatchObject({ valid: false })
    expect(validateNumericSetting('targetMinutes', '90')).toEqual({ valid: true, value: 90, error: '' })
    expect(validateNumericSetting('targetMinutes', '91')).toMatchObject({ valid: false })
    expect(validateNumericSetting('targetMinutes', '30.5')).toMatchObject({ valid: false })
  })

  it('accepts the expanded whole-number ranges', () => {
    expect(validateNumericSetting('numSets', '1').valid).toBe(true)
    expect(validateNumericSetting('numSets', '4').valid).toBe(true)
    expect(validateNumericSetting('numSets', '0').valid).toBe(false)
    expect(validateNumericSetting('numSets', '5').valid).toBe(false)
    expect(validateNumericSetting('bufferSeconds', '1').valid).toBe(true)
    expect(validateNumericSetting('bufferSeconds', '17').valid).toBe(true)
    expect(validateNumericSetting('bufferSeconds', '60').valid).toBe(true)
    expect(validateNumericSetting('bufferSeconds', '0').valid).toBe(false)
    expect(validateNumericSetting('bufferSeconds', '61').valid).toBe(false)
    expect(isValidSettingValue('maxTuningChanges', 99)).toBe(true)
    expect(isValidSettingValue('maxTuningChanges', 4)).toBe(false)
    expect(isValidSettingValue('groupGenre', true)).toBe(true)
    expect(isValidSettingValue('groupGenre', 'true')).toBe(false)
  })
})
