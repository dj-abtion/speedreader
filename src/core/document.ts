import removeMarkdown from 'remove-markdown'

const MAX_TITLE_LENGTH = 60
const MARKDOWN_EXTENSIONS = /\.(md|markdown)$/i

export interface NewDocument {
  title: string
  text: string
}

export function titleFromText(text: string): string {
  const line = text.split('\n').map((l) => l.trim()).find(Boolean)
  if (!line) return 'Untitled'
  if (line.length <= MAX_TITLE_LENGTH) return line
  const cut = line.slice(0, MAX_TITLE_LENGTH)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:]+$/, '')}…`
}

export function textFromFile(filename: string, content: string): NewDocument {
  return {
    title: filename.replace(/\.[^.]+$/, ''),
    text: MARKDOWN_EXTENSIONS.test(filename) ? removeMarkdown(content) : content,
  }
}
