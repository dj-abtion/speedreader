import { describe, expect, it } from 'vitest'
import { digitCount, isNumber, isUnit, numberParts } from './number'

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

describe('numberParts', () => {
  it('reads millions and up one digit group at a time, with its scale word', () => {
    expect(numberParts('3,847,221')).toEqual(['3 million', '847 thousand', '221'])
    expect(numberParts('1,234,000')).toEqual(['1 million', '234 thousand'])
    expect(numberParts('2,000,000,000')).toEqual(['2 billion'])
    expect(numberParts('5,000,021')).toEqual(['5 million', '21'])
  })

  it('uses Danish scale words for numbers grouped with periods', () => {
    expect(numberParts('3.847.221')).toEqual(['3 millioner', '847 tusind', '221'])
    expect(numberParts('1.000.000')).toEqual(['1 million'])
    expect(numberParts('1.500.000.000')).toEqual(['1 milliard', '500 millioner'])
  })

  it('keeps currency signs, decimals and punctuation on the ends', () => {
    expect(numberParts('$1,234,567.89,')).toEqual(['$1 million', '234 thousand', '567.89,'])
    expect(numberParts('(2.500.000,50).')).toEqual(['(2 millioner', '500 tusind', '0,50).'])
  })

  it('reads smaller numbers, dates and anything ambiguous whole', () => {
    for (const text of ['7', '12,345', '999,999', '1234567', '2026-09-29', '12.34.56.78', '1,234.567.890', '1,234,567,8', '0,000,000']) {
      expect(numberParts(text), text).toBeNull()
    }
  })
})
