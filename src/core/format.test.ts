import { describe, expect, it } from 'vitest'
import { formatRemaining } from './format'

describe('formatRemaining', () => {
  it('shows seconds under a minute', () => {
    expect(formatRemaining(0)).toBe('0 s left')
    expect(formatRemaining(42_400)).toBe('43 s left')
  })

  it('shows whole minutes, rounded up, from one minute', () => {
    expect(formatRemaining(60_000)).toBe('1 min left')
    expect(formatRemaining(61_000)).toBe('2 min left')
    expect(formatRemaining(3_540_000)).toBe('59 min left')
  })

  it('shows hours and minutes from one hour', () => {
    expect(formatRemaining(3_600_000)).toBe('1 h left')
    expect(formatRemaining(5_430_000)).toBe('1 h 31 min left')
  })
})
