import { describe, expect, it } from 'vitest'
import { digitCount, isNumber, isUnit } from './number'

describe('isNumber', () => {
  it('recognises numbers, amounts, dates and times', () => {
    for (const text of ['7', '3.14', '1,200', '$1,200', '40%', '2026-09-29', '14:30', '(12),', '-5', '€25.', '1/2']) {
      expect(isNumber(text), text).toBe(true)
    }
  })

  it('rejects words, even ones containing digits', () => {
    for (const text of ['word', '1st', 'COVID-19', '25km', 'v2', '—', '']) {
      expect(isNumber(text), text).toBe(false)
    }
  })
})

describe('digitCount', () => {
  it('counts only the digits', () => {
    expect(digitCount('$1,234.50')).toBe(6)
    expect(digitCount('word')).toBe(0)
  })
})

describe('isUnit', () => {
  it('recognises units, ignoring case and trailing punctuation', () => {
    for (const text of ['km', 'KG', 'MB', '%', '°C', 'kr.', 'km/h,', 'min)']) {
      expect(isUnit(text), text).toBe(true)
    }
  })

  it('rejects ordinary words', () => {
    for (const text of ['a', 'in', 'the', 'km-long', 'kilometres']) {
      expect(isUnit(text), text).toBe(false)
    }
  })
})
