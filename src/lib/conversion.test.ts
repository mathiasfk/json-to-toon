import { describe, expect, it } from 'vitest'
import { convertJsonToToon, estimateTokens } from './conversion'

describe('estimateTokens', () => {
  it('returns zero for empty text', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('ceil-divides the character count by four', () => {
    expect(estimateTokens('1234')).toBe(1)
    expect(estimateTokens('12345')).toBe(2)
  })
})

describe('convertJsonToToon', () => {
  it('converts JSON to TOON with token stats', () => {
    const input = JSON.stringify({ name: 'Ada', role: 'admin' })
    const result = convertJsonToToon(input)

    expect(result.error).toBeNull()
    expect(result.toonText.trim()).toBe('name: Ada\nrole: admin')
    expect(result.jsonTokens).toBe(estimateTokens(input))
    expect(result.toonTokens).toBe(estimateTokens(result.toonText))
    expect(result.savedTokens).toBeGreaterThanOrEqual(0)
  })

  it('gracefully handles whitespace-only input', () => {
    const result = convertJsonToToon('   ')

    expect(result.toonText).toBe('')
    expect(result.error).toBeNull()
    expect(result.jsonTokens).toBe(estimateTokens('   '))
    expect(result.savedTokens).toBe(0)
  })

  it('captures parse errors for invalid JSON', () => {
    const result = convertJsonToToon('{ "oops"')

    expect(result.toonText).toBe('')
    expect(result.error).not.toBeNull()
    expect(result.savedTokens).toBe(0)
  })
})
