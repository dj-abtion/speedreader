import { describe, expect, it } from 'vitest'
import { AVERAGE_WPM, monthSummary, savedMs } from './stats'

describe('savedMs', () => {
  it('is the time an average reader would take, minus the time actually spent', () => {
    expect(savedMs(AVERAGE_WPM, 20_000)).toBe(40_000)
  })

  it('never goes below zero for a slow read', () => {
    expect(savedMs(AVERAGE_WPM, 90_000)).toBe(0)
  })
})

describe('monthSummary', () => {
  const now = new Date(2026, 8, 28, 12)

  it('adds up the time saved by texts finished this calendar month', () => {
    const finishes = [
      { at: new Date(2026, 8, 1, 9).getTime(), words: AVERAGE_WPM, readingMs: 30_000 },
      { at: new Date(2026, 8, 27, 9).getTime(), words: AVERAGE_WPM * 2, readingMs: 60_000 },
      { at: new Date(2026, 7, 31, 23).getTime(), words: AVERAGE_WPM, readingMs: 0 },
    ]
    expect(monthSummary(finishes, now)).toEqual({ savedMs: 90_000, count: 2 })
  })

  it('is empty without finishes', () => {
    expect(monthSummary([], now)).toEqual({ savedMs: 0, count: 0 })
  })
})
