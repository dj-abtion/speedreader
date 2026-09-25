import { describe, expect, it } from 'vitest'
import { orpIndex, splitAtPivot } from './orp'

describe('orpIndex', () => {
  it.each([
    ['a', 0],
    ['to', 1],
    ['hello', 1],
    ['reader', 2],
    ['wonderful', 2],
    ['incredible', 3],
    ['comprehension', 3],
    ['extraordinarily', 4],
  ])('places the pivot of %s at %i', (word, index) => {
    expect(orpIndex(word)).toBe(index)
  })

  it('ignores leading and trailing punctuation when measuring', () => {
    expect(orpIndex('"hello,"')).toBe(2)
    expect(orpIndex('(reader).')).toBe(3)
  })

  it('handles tokens without letters', () => {
    expect(orpIndex('—')).toBe(0)
    expect(orpIndex('')).toBe(0)
  })
})

describe('splitAtPivot', () => {
  it('splits a word into before, pivot and after', () => {
    expect(splitAtPivot('reader')).toEqual({ before: 're', pivot: 'a', after: 'der' })
  })

  it('handles non-BMP characters as single letters', () => {
    expect(splitAtPivot('𝒜bc')).toEqual({ before: '𝒜', pivot: 'b', after: 'c' })
  })
})
