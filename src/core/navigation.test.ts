import { describe, expect, it } from 'vitest'
import { tokenize } from './tokenize'
import { nextSentenceStart, previousSentenceStart, sentenceStart } from './navigation'

// indexes:            0   1    2     3     4    5
const tokens = tokenize('One two. Three four. Five six')

describe('sentenceStart', () => {
  it('finds the first token of the sentence containing an index', () => {
    expect(sentenceStart(tokens, 0)).toBe(0)
    expect(sentenceStart(tokens, 1)).toBe(0)
    expect(sentenceStart(tokens, 3)).toBe(2)
    expect(sentenceStart(tokens, 5)).toBe(4)
  })
})

describe('previousSentenceStart', () => {
  it('goes to the start of the current sentence when mid-sentence', () => {
    expect(previousSentenceStart(tokens, 3)).toBe(2)
  })

  it('goes to the previous sentence when already at a sentence start', () => {
    expect(previousSentenceStart(tokens, 2)).toBe(0)
    expect(previousSentenceStart(tokens, 4)).toBe(2)
  })

  it('stays at 0 at the beginning', () => {
    expect(previousSentenceStart(tokens, 0)).toBe(0)
  })
})

describe('nextSentenceStart', () => {
  it('goes to the start of the next sentence', () => {
    expect(nextSentenceStart(tokens, 0)).toBe(2)
    expect(nextSentenceStart(tokens, 3)).toBe(4)
  })

  it('stays within the last sentence', () => {
    expect(nextSentenceStart(tokens, 4)).toBe(4)
    expect(nextSentenceStart(tokens, 5)).toBe(5)
  })
})
