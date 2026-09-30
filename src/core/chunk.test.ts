import { describe, expect, it } from 'vitest'
import { chunkAt, chunkText, chunkTokens, MAX_CHUNK_LENGTH } from './chunk'
import { tokenize } from './tokenize'

const texts = (input: string, size: number) => {
  const tokens = tokenize(input)
  return chunkTokens(tokens, size).map((c) => chunkText(tokens, c))
}

describe('chunkTokens', () => {
  it('keeps one token per chunk at size 1', () => {
    expect(texts('one two three', 1)).toEqual(['one', 'two', 'three'])
  })

  it('groups up to the requested number of words', () => {
    expect(texts('a b c d e', 2)).toEqual(['a b', 'c d', 'e'])
    expect(texts('a b c d e', 3)).toEqual(['a b c', 'd e'])
  })

  it('never lets a chunk run past a clause or sentence end', () => {
    expect(texts('one two, three four. five six', 3)).toEqual(['one two,', 'three four.', 'five six'])
  })

  it('never joins across paragraphs', () => {
    expect(texts('Title\n\nBody starts here', 3)).toEqual(['Title', 'Body starts here'])
  })

  it(`caps a chunk at ${MAX_CHUNK_LENGTH} characters including spaces`, () => {
    const chunks = texts('understanding fundamentals is essential', 3)
    expect(chunks).toEqual(['understanding', 'fundamentals is', 'essential'])
    for (const chunk of texts('some rather lengthy wordings together here', 3)) {
      expect(chunk.length).toBeLessThanOrEqual(MAX_CHUNK_LENGTH)
    }
  })

  it('shows numbers on their own', () => {
    expect(texts('we sold 1,200 units in 2026 alone', 3)).toEqual(['we sold', '1,200', 'units in', '2026', 'alone'])
  })

  it('keeps a unit with its number', () => {
    expect(texts('we ran 25 km in 2 hrs today', 3)).toEqual(['we ran', '25 km', 'in', '2 hrs', 'today'])
    expect(texts('it rose 40 % after', 2)).toEqual(['it rose', '40 %', 'after'])
  })

  it('reads a large number over several chunks, with its unit on the last', () => {
    expect(texts('about 3,847,221 km away', 1)).toEqual(['about', '3 million', '847 thousand', '221', 'km', 'away'])
    expect(texts('about 1.200.000 kr i alt', 3)).toEqual(['about', '1 million', '200 tusind kr', 'i alt'])
  })

  it('splits a large number\'s time between its chunks', () => {
    const chunks = chunkTokens(tokenize('3,847,221'), 1)
    expect(chunks.map((c) => [c.start, c.end])).toEqual([[0, 1], [0, 1], [0, 1]])
    expect(chunks.reduce((sum, c) => sum + (c.share ?? 0), 0)).toBeCloseTo(1, 10)
  })

  it('joins nothing but a unit to a number', () => {
    expect(texts('eat 5 a day', 3)).toEqual(['eat', '5', 'a day'])
    expect(texts('25 km more', 1)).toEqual(['25', 'km', 'more'])
  })

  it('covers every token exactly once, in order', () => {
    const tokens = tokenize('The quick brown fox, it jumps. Over the lazy dog again and again.')
    const chunks = chunkTokens(tokens, 3)
    expect(chunks[0].start).toBe(0)
    chunks.forEach((c, i) => {
      expect(c.end).toBeGreaterThan(c.start)
      if (i > 0) expect(c.start).toBe(chunks[i - 1].end)
    })
    expect(chunks.at(-1)?.end).toBe(tokens.length)
  })

  it('returns no chunks for no tokens', () => {
    expect(chunkTokens([], 2)).toEqual([])
  })
})

describe('chunkAt', () => {
  it('finds the chunk containing a token index', () => {
    const chunks = chunkTokens(tokenize('a b c d e'), 2)
    expect(chunkAt(chunks, 0)).toBe(0)
    expect(chunkAt(chunks, 1)).toBe(0)
    expect(chunkAt(chunks, 3)).toBe(1)
    expect(chunkAt(chunks, 4)).toBe(2)
  })

  it('finds the first chunk of a number read in parts', () => {
    const chunks = chunkTokens(tokenize('a 3,847,221 b'), 1)
    expect(chunkAt(chunks, 1)).toBe(1)
    expect(chunkAt(chunks, 2)).toBe(4)
  })
})
