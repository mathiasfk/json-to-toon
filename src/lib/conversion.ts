import { decode, encode } from '@toon-format/toon'

export type ConversionResult = {
  convertedText: string
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
      convertedText: '',
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
      convertedText: toonText,
      jsonTokens,
      toonTokens,
      savedTokens: Math.max(jsonTokens - toonTokens, 0),
      error: null,
    }
  } catch (error) {
    return {
      convertedText: '',
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

export const convertToonToJson = (toonText: string): ConversionResult => {
  const toonTokens = estimateTokens(toonText)

  if (!toonText.trim()) {
    return {
      convertedText: '',
      jsonTokens: 0,
      toonTokens,
      savedTokens: 0,
      error: null,
    }
  }

  try {
    const parsed = decode(toonText)
    const jsonText = JSON.stringify(parsed, null, 2)
    const jsonTokens = estimateTokens(jsonText)

    return {
      convertedText: jsonText,
      jsonTokens,
      toonTokens,
      savedTokens: Math.max(jsonTokens - toonTokens, 0),
      error: null,
    }
  } catch (error) {
    return {
      convertedText: '',
      jsonTokens: 0,
      toonTokens,
      savedTokens: 0,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error while parsing TOON',
    }
  }
}
