import { describe, expect, it } from 'vitest'
import { tokenize } from './tokenize'
import { durations, rampMultiplier, RAMP_MS, remainingMs, weights } from './timing'

const sample = tokenize(
  Array.from(
    { length: 40 },
    (_, i) =>
      `Paragraph ${i} starts here, and it continues with extraordinarily long words; then it ends. Short one!`,
  ).join('\n\n'),
)

describe('weights', () => {
  it('pauses longer at sentence ends than clause ends than plain words', () => {
    const [plain, clause, sentence] = weights(tokenize('word word, word. next word'))
    expect(clause).toBeGreaterThan(plain)
    expect(sentence).toBeGreaterThan(clause)
  })

  it('pauses longest at paragraph ends', () => {
    const w = weights(tokenize('one two. three\n\nfour five'))
    expect(w[2]).toBeGreaterThan(w[1])
  })

  it('gives long words extra time', () => {
    const [short, long] = weights(tokenize('cat elephantine'))
    expect(long).toBeGreaterThan(short)
  })

  it('averages to exactly 1 so WPM is the average rate', () => {
    const w = weights(sample)
    expect(w.reduce((a, b) => a + b, 0) / w.length).toBeCloseTo(1, 10)
  })

  it('returns an empty list for no tokens', () => {
    expect(weights([])).toEqual([])
  })
})

describe('durations', () => {
  it('reads a long text at 300 WPM in (word count / 300) minutes', () => {
    const total = durations(weights(sample), 300).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo((sample.length / 300) * 60_000, 6)
  })
})

describe('rampMultiplier', () => {
  it('starts slower and eases to full speed', () => {
    expect(rampMultiplier(0)).toBeGreaterThan(1)
    expect(rampMultiplier(RAMP_MS / 2)).toBeLessThan(rampMultiplier(0))
    expect(rampMultiplier(RAMP_MS)).toBe(1)
    expect(rampMultiplier(RAMP_MS * 10)).toBe(1)
  })
})

describe('remainingMs', () => {
  it('sums the durations from the current token to the end', () => {
    expect(remainingMs([100, 200, 300], 1)).toBe(500)
    expect(remainingMs([100, 200, 300], 3)).toBe(0)
  })
})
