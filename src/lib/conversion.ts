import { encode } from '@toon-format/toon'

export type ConversionResult = {
  toonText: string
  jsonTokens: number
  toonTokens: number
  savedTokens: number
  error: string | null
}

export const estimateTokens = (text: string): number => {
  if (!text) {
    return 0
  }

  return Math.ceil(text.length / 4)
}

export const convertJsonToToon = (jsonText: string): ConversionResult => {
  const jsonTokens = estimateTokens(jsonText)

  if (!jsonText.trim()) {
    return {
      toonText: '',
      jsonTokens,
      toonTokens: 0,
      savedTokens: 0,
      error: null,
    }
  }

  try {
    const parsed = JSON.parse(jsonText)
    const toonText = encode(parsed, { indent: 2 })
    const toonTokens = estimateTokens(toonText)

    return {
      toonText,
      jsonTokens,
      toonTokens,
      savedTokens: Math.max(jsonTokens - toonTokens, 0),
      error: null,
    }
  } catch (error) {
    return {
      toonText: '',
      jsonTokens,
      toonTokens: 0,
      savedTokens: 0,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error while parsing JSON',
    }
  }
}
