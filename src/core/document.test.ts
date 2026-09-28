import { describe, expect, it } from 'vitest'
import { looksLikeMarkdown, readableText, textFromFile, titleFromText } from './document'
import { tokenize } from './tokenize'

describe('titleFromText', () => {
  it('uses the first non-empty line', () => {
    expect(titleFromText('\n\n  A Tale of Two Cities  \nIt was the best of times')).toBe(
      'A Tale of Two Cities',
    )
  })

  it('truncates long first lines at a word boundary', () => {
    const title = titleFromText(
      'It was the best of times, it was the worst of times, it was the age of wisdom',
    )
    expect(title).toBe('It was the best of times, it was the worst of times, it was…')
    expect(title.length).toBeLessThanOrEqual(61)
  })

  it('falls back to a placeholder for blank text', () => {
    expect(titleFromText('   ')).toBe('Untitled')
  })
})

describe('textFromFile', () => {
  it('uses the filename without extension as the title', () => {
    expect(textFromFile('chapter-one.txt', 'Hello there.')).toEqual({
      title: 'chapter-one',
      text: 'Hello there.',
    })
  })

  it('strips Markdown syntax from .md files', () => {
    const { title, text } = textFromFile(
      'notes.md',
      '# Heading\n\nSome **bold** and _italic_ text with a [link](https://example.com).',
    )
    expect(title).toBe('notes')
    expect(text).toContain('Heading')
    expect(text).toContain('Some bold and italic text with a link.')
    expect(text).not.toMatch(/[#*_[\]]|https:/)
  })

  it('keeps paragraph breaks when stripping Markdown', () => {
    const { text } = textFromFile('a.markdown', 'One.\n\nTwo.')
    expect(text).toMatch(/One\.\s*\n\s*\n\s*Two\./)
  })

  it('leaves .txt content untouched', () => {
    expect(textFromFile('a.txt', '**not markdown**').text).toBe('**not markdown**')
  })
})

describe('looksLikeMarkdown', () => {
  it.each([
    ['a heading', '## Plan\n\nSome text.'],
    ['a code fence', 'Run this:\n\n```sh\nnpm test\n```'],
    ['bold text', 'This is **important** to know.'],
    ['a link', 'See [the docs](https://example.com).'],
    ['inline code', 'Call `tokenize` first.'],
    ['a table', '| A | B |\n|---|---|\n| 1 | 2 |'],
    ['a list', 'Steps:\n- one\n- two'],
  ])('spots %s', (_, text) => {
    expect(looksLikeMarkdown(text)).toBe(true)
  })

  it.each([
    ['prose', 'It was the best of times, it was the worst of times.'],
    ['a lone asterisk', 'Terms apply* to all orders.'],
    ['a single numbered line', '1. Is this a list? Not really.'],
    ['a hashtag', 'Loving this #summer weather.'],
  ])('leaves %s alone', (_, text) => {
    expect(looksLikeMarkdown(text)).toBe(false)
  })
})

describe('readableText', () => {

  it('passes plain text through unchanged', () => {
    expect(readableText('Plain words.\n\nMore words.')).toBe('Plain words.\n\nMore words.')
    expect(readableText('Terms apply* here.')).toBe('Terms apply* here.')
  })

  it('strips Markdown syntax from a chat-style reply', () => {
    const text = readableText('## Plan\n\nUse **bold** and `code` with a [link](https://example.com).')
    expect(text).toContain('Plan')
    expect(text).toContain('Use bold and code with a link.')
    expect(text).not.toMatch(/[#*`[\]]|https:/)
  })

  it('reads a code block as a single placeholder that keeps the code', () => {
    const tokens = tokenize(readableText('Run it:\n\n```sh\nnpm run build\n\nnpm **test**\n```\n\nDone.'))
    expect(tokens.map((t) => t.text)).toEqual(['Run', 'it:', '(code block)', 'Done.'])
    expect(tokens[1].endsParagraph).toBe(true)
    expect(tokens[2].code).toEqual({ language: 'sh', source: 'npm run build\n\nnpm **test**' })
  })

  it('treats an unclosed code block as running to the end', () => {
    const tokens = tokenize(readableText('Here:\n\n```\nconst a = 1'))
    expect(tokens.map((t) => t.text)).toEqual(['Here:', '(code block)'])
    expect(tokens[1].code).toEqual({ language: '', source: 'const a = 1' })
  })

  it('titles a text that opens with code by its placeholder', () => {
    expect(titleFromText(readableText('```js\nlet x\n```\n\nAfter.'))).toBe('(code block)')
  })

  it('gives a heading its own paragraph even without a blank line after it', () => {
    const tokens = tokenize(readableText('### Step one\nDo **this** first.'))
    expect(tokens.map((t) => t.text)).toEqual(['Step', 'one', 'Do', 'this', 'first.'])
    expect(tokens[1].endsParagraph).toBe(true)
  })

  it('pauses between list items that have no punctuation of their own', () => {
    const tokens = tokenize(readableText('Options:\n- clipboard button\n- share links\n- a skill.'))
    expect(tokens.map((t) => t.text)).toEqual([
      'Options:', 'clipboard', 'button', 'share', 'links', 'a', 'skill.',
    ])
    expect(tokens[2].endsClause).toBe(true)
    expect(tokens[4].endsClause).toBe(true)
  })

  it('reads table rows cell by cell and drops the divider', () => {
    const tokens = tokenize(readableText('| Action | Input |\n| --- | :---: |\n| Play | Space |'))
    expect(tokens.map((t) => t.text)).toEqual(['Action', 'Input', 'Play', 'Space'])
    expect(tokens.filter((t) => t.endsClause || t.endsSentence)).toHaveLength(4)
  })
})
