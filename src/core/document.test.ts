import { describe, expect, it } from 'vitest'
import { textFromFile, titleFromText } from './document'

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
