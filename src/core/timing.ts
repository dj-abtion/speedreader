import { digitCount, isNumber, numberParts } from './number'
import type { Token } from './tokenize'

const PARAGRAPH_PAUSE = 2.5
const SENTENCE_PAUSE = 2
const CLAUSE_PAUSE = 1.5
const LONG_WORD_LENGTH = 8
const LONG_WORD_PAUSE = 1.3
// Numbers can't be recognised by their shape the way words can, so each digit needs reading.
const NUMBER_PAUSE_PER_DIGIT = 0.15
const MAX_NUMBER_PAUSE = 2

export const RAMP_MS = 2000
const RAMP_START = 1.6

// Normalised so the mean weight is 1: pauses redistribute time rather than
// add it, which keeps the chosen WPM equal to the real average reading rate.
// Number pauses are applied after normalising, so they add time instead: otherwise a
// number-heavy text would rush the words between its numbers.
export function weights(tokens: Token[]): number[] {
  const raw = tokens.map(rawWeight)
  const mean = raw.reduce((sum, w) => sum + w, 0) / raw.length
  return raw.map((w, i) => (w / mean) * numberPause(tokens[i]))
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
  const isLongWord = token.text.length > LONG_WORD_LENGTH && !isNumber(token.text)
  return isLongWord ? pause * LONG_WORD_PAUSE : pause
}

// A number read in parts gets the time of each part, as each is a flash of its own to read.
function numberPause(token: Token): number {
  if (!isNumber(token.text)) return 1
  const parts = numberParts(token.text)
  if (!parts) return digitPause(token.text)
  return numberPartPauses(parts).reduce((sum, pause) => sum + pause, 0)
}

export function numberPartPauses(parts: string[]): number[] {
  return parts.map(digitPause)
}

function digitPause(text: string): number {
  return Math.min(MAX_NUMBER_PAUSE, 1 + NUMBER_PAUSE_PER_DIGIT * digitCount(text))
}
