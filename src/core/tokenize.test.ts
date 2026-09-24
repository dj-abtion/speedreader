import { describe, expect, it } from 'vitest'
import { tokenize } from './tokenize'

const texts = (input: string) => tokenize(input).map((t) => t.text)

describe('tokenize', () => {
  it('splits on any whitespace', () => {
    expect(texts('The  quick\tbrown\nfox')).toEqual(['The', 'quick', 'brown', 'fox'])
  })

  it('returns no tokens for blank input', () => {
    expect(tokenize('   \n\n ')).toEqual([])
  })

  it('flags sentence ends, including trailing quotes and brackets', () => {
    const tokens = tokenize('It works. Really? "Yes!" (Truly.)')
    expect(tokens.map((t) => t.endsSentence)).toEqual([false, true, true, true, true])
  })

  it('does not end a sentence on common abbreviations', () => {
    const tokens = tokenize('Ask Dr. Smith, e.g. tomorrow.')
    expect(tokens.find((t) => t.text === 'Dr.')?.endsSentence).toBe(false)
    expect(tokens.find((t) => t.text === 'e.g.')?.endsSentence).toBe(false)
    expect(tokens.at(-1)?.endsSentence).toBe(true)
  })

  it('flags clause ends', () => {
    const tokens = tokenize('First, second; third: fourth')
    expect(tokens.map((t) => t.endsClause)).toEqual([true, true, true, false])
  })

  it('flags paragraph ends, which are also sentence ends', () => {
    const tokens = tokenize('A heading\n\nBody text here.\n  \nNext')
    const heading = tokens[1]
    expect(heading).toMatchObject({ text: 'heading', endsParagraph: true, endsSentence: true })
    expect(tokens.filter((t) => t.endsParagraph).map((t) => t.text)).toEqual([
      'heading',
      'here.',
      'Next',
    ])
  })

  it('breaks words joined by an em dash or ellipsis, keeping the mark on the first part', () => {
    expect(texts('wait—what… no...really')).toEqual(['wait—', 'what…', 'no...', 'really'])
    expect(tokenize('wait—what').map((t) => t.endsClause)).toEqual([true, false])
  })

  it('treats a trailing ellipsis as a clause end, not a sentence end', () => {
    const [first] = tokenize('Well... fine.')
    expect(first).toMatchObject({ endsClause: true, endsSentence: false })
  })

  it('folds a free-standing dash into the previous word as a clause end', () => {
    const tokens = tokenize('this — that -- other')
    expect(tokens.map((t) => t.text)).toEqual(['this', 'that', 'other'])
    expect(tokens.map((t) => t.endsClause)).toEqual([true, true, false])
  })

  it('keeps hyphenated compounds of up to 13 characters whole', () => {
    expect(texts('a well-known fact')).toEqual(['a', 'well-known', 'fact'])
  })

  it('splits long hyphenated compounds at hyphens', () => {
    expect(texts('state-of-the-art')).toEqual(['state-of-the-', 'art'])
  })

  it('splits long words into balanced chunks of at most 12 characters plus a hyphen', () => {
    const chunks = texts('antidisestablishmentarianism')
    expect(chunks).toEqual(['antidisest-', 'ablishment-', 'arianism'])
    expect(chunks.join('').replaceAll('-', '')).toBe('antidisestablishmentarianism')
  })

  it('puts flags only on the last chunk of a split word', () => {
    const tokens = tokenize('antidisestablishmentarianism.')
    expect(tokens.map((t) => t.endsSentence)).toEqual([false, false, true])
  })

  it('never produces a token longer than 13 characters', () => {
    const tokens = tokenize('https://example.com/a/very/long/path?query=1 supercalifragilisticexpialidocious')
    for (const token of tokens) expect(token.text.length).toBeLessThanOrEqual(13)
  })
})
