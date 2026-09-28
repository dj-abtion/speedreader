import { describe, expect, it } from 'vitest'
import { formatClock, formatCount, formatDuration, formatRemaining } from './format'

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

describe('formatDuration', () => {
  it('shows seconds, minutes and seconds, or hours and minutes', () => {
    expect(formatDuration(55_200)).toBe('55 s')
    expect(formatDuration(120_000)).toBe('2 min')
    expect(formatDuration(148_000)).toBe('2 min 28 s')
    expect(formatDuration(3_600_000)).toBe('1 h')
    expect(formatDuration(6_720_000)).toBe('1 h 52 min')
  })
})

describe('formatClock', () => {
  it('shows minutes and zero-padded seconds', () => {
    expect(formatClock(165_000)).toBe('2:45')
    expect(formatClock(5_000)).toBe('0:05')
  })
})

describe('formatCount', () => {
  it('groups thousands', () => {
    expect(formatCount(1240)).toBe('1,240')
  })
})
