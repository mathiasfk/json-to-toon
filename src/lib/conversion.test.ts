import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@toon-format/toon', async () => {
  const actual = await vi.importActual<typeof import('@toon-format/toon')>('@toon-format/toon')
  return {
    ...actual,
    decode: vi.fn(actual.decode),
  }
})

const actualToonModule = await vi.importActual<typeof import('@toon-format/toon')>(
  '@toon-format/toon',
)
const actualDecode = actualToonModule.decode

import * as toon from '@toon-format/toon'
import { convertJsonToToon, convertToonToJson, estimateTokens } from './conversion'

afterEach(() => {
  vi.mocked(toon.decode).mockImplementation(actualDecode)
})

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
    expect(result.convertedText.trim()).toBe('name: Ada\nrole: admin')
    expect(result.jsonTokens).toBe(estimateTokens(input))
    expect(result.toonTokens).toBe(estimateTokens(result.convertedText))
    expect(result.savedTokens).toBeGreaterThanOrEqual(0)
  })

  it('gracefully handles whitespace-only input', () => {
    const result = convertJsonToToon('   ')

    expect(result.convertedText).toBe('')
    expect(result.error).toBeNull()
    expect(result.jsonTokens).toBe(estimateTokens('   '))
    expect(result.savedTokens).toBe(0)
  })

  it('captures parse errors for invalid JSON', () => {
    const result = convertJsonToToon('{ "oops"')

    expect(result.convertedText).toBe('')
    expect(result.error).not.toBeNull()
    expect(result.savedTokens).toBe(0)
  })
})

describe('convertToonToJson', () => {
  it('converts TOON to JSON with token stats', () => {
    const toonInput = 'name: Ada\nrole: admin'
    const result = convertToonToJson(toonInput)

    expect(result.error).toBeNull()
    expect(() => JSON.parse(result.convertedText)).not.toThrow()
    expect(JSON.parse(result.convertedText)).toEqual({
      name: 'Ada',
      role: 'admin',
    })
    expect(result.toonTokens).toBe(estimateTokens(toonInput))
    expect(result.jsonTokens).toBe(estimateTokens(result.convertedText))
  })

  it('gracefully handles whitespace-only input', () => {
    const result = convertToonToJson('   ')

    expect(result.convertedText).toBe('')
    expect(result.error).toBeNull()
    expect(result.toonTokens).toBe(estimateTokens('   '))
    expect(result.jsonTokens).toBe(0)
    expect(result.savedTokens).toBe(0)
  })

  it('captures parse errors for invalid TOON', () => {
    vi.mocked(toon.decode).mockImplementation(() => {
      throw new Error('bad toon')
    })

    const result = convertToonToJson('does not matter')

    expect(result.convertedText).toBe('')
    expect(result.error).not.toBeNull()
    expect(result.savedTokens).toBe(0)
  })
})
