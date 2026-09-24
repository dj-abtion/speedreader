import type { Token } from './tokenize'

const PARAGRAPH_PAUSE = 2.5
const SENTENCE_PAUSE = 2
const CLAUSE_PAUSE = 1.5
const LONG_WORD_LENGTH = 8
const LONG_WORD_PAUSE = 1.3

export const RAMP_MS = 2000
const RAMP_START = 1.6

// Normalised so the mean weight is 1: pauses redistribute time rather than
// add it, which keeps the chosen WPM equal to the real average reading rate.
export function weights(tokens: Token[]): number[] {
  const raw = tokens.map(rawWeight)
  const mean = raw.reduce((sum, w) => sum + w, 0) / raw.length
  return raw.map((w) => w / mean)
}

export function durations(tokenWeights: number[], wpm: number): number[] {
  const base = 60_000 / wpm
  return tokenWeights.map((w) => w * base)
}

export function rampMultiplier(msSincePlay: number): number {
  if (msSincePlay >= RAMP_MS) return 1
  return 1 + (RAMP_START - 1) * (1 - msSincePlay / RAMP_MS)
}

export function remainingMs(tokenDurations: number[], index: number): number {
  return tokenDurations.slice(index).reduce((sum, d) => sum + d, 0)
}

function rawWeight(token: Token): number {
  const pause = token.endsParagraph
    ? PARAGRAPH_PAUSE
    : token.endsSentence
      ? SENTENCE_PAUSE
      : token.endsClause
        ? CLAUSE_PAUSE
        : 1
  return token.text.length > LONG_WORD_LENGTH ? pause * LONG_WORD_PAUSE : pause
}
