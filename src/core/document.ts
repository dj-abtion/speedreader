import removeMarkdown from 'remove-markdown'
import { encodeCodeBlock, withoutCode, type CodeBlock } from './code'

const MAX_TITLE_LENGTH = 60
const MARKDOWN_EXTENSIONS = /\.(md|markdown)$/i

export interface NewDocument {
  title: string
  text: string
}

export function titleFromText(text: string): string {
  const line = withoutCode(text).split('\n').map((l) => l.trim()).find(Boolean)
  if (!line) return 'Untitled'
  if (line.length <= MAX_TITLE_LENGTH) return line
  const cut = line.slice(0, MAX_TITLE_LENGTH)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:]+$/, '')}…`
}

export function textFromFile(filename: string, content: string): NewDocument {
  return {
    title: filename.replace(/\.[^.]+$/, ''),
    text: MARKDOWN_EXTENSIONS.test(filename) ? stripMarkdown(content) : content,
  }
}

const FENCE = /^\s*(`{3,}|~{3,})/
const HEADING = /^\s{0,3}#{1,6}\s/
const LIST_ITEM = /^\s*([-*+]|\d+[.)])\s+\S/
const TABLE_ROW = /^\s*\|.*\|\s*$/
const TABLE_DIVIDER = /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*(:?-{3,}:?\s*)?$/
const ENDS_WITH_PAUSE = /[.!?,;:—–…]\W*$/u
const MARKDOWN_SIGNALS = [
  /^\s*(`{3,}|~{3,})/m,
  /^\s{0,3}#{1,6}\s+\S/m,
  /\*\*\S[^*\n]*\*\*/,
  /\[[^\]\n]+\]\([^)\s]+\)/,
  /`[^`\n]+`/,
  /^\s*\|?(\s*:?-{3,}:?\s*\|)+/m,
]

// Pasted and shared text is often Markdown (chat replies especially), but plain prose with the
// odd asterisk or numbered line must survive untouched, so only clear Markdown is stripped.
export function looksLikeMarkdown(text: string): boolean {
  if (MARKDOWN_SIGNALS.some((signal) => signal.test(text))) return true
  return text.split('\n').filter((line) => LIST_ITEM.test(line)).length >= 2
}

export function readableText(text: string): string {
  return looksLikeMarkdown(text) ? stripMarkdown(text) : text
}

export function stripMarkdown(markdown: string): string {
  const { text, code } = prepareBlocks(markdown)
  return removeMarkdown(text)
    .replace(/\n\s*\n\s*/g, '\n\n')
    .trim()
    .replace(CODE_SLOT, (_, index: string) => encodeCodeBlock(code[Number(index)]))
}

// Stands in for a code block while remove-markdown runs, which would otherwise mangle the
// code's own asterisks, underscores and blank lines.
const CODE_SLOT = /\uE002(\d+)\uE002/g

// remove-markdown only drops syntax. Code would flash past as noise, headings would run into
// the next line, and list items and table rows would read as one breathless sentence, so code
// is set aside to be shown on its own, a heading gets its own paragraph, and list items and
// table rows get a trailing dash, which the tokenizer reads as a clause pause without showing it.
function prepareBlocks(markdown: string): { text: string; code: CodeBlock[] } {
  const lines: string[] = []
  const code: CodeBlock[] = []
  let fence: { marker: string; lines: string[] } | null = null
  const closeFence = () => {
    if (!fence) return
    code.push({ language: '', ...code.pop(), source: fence.lines.join('\n') })
    fence = null
  }
  for (const line of markdown.split('\n')) {
    const marker = line.match(FENCE)?.[1]
    if (fence) {
      if (marker?.startsWith(fence.marker) && !line.trim().slice(marker.length)) closeFence()
      else fence.lines.push(line)
      continue
    }
    if (marker) {
      fence = { marker, lines: [] }
      code.push({ language: line.trim().slice(marker.length).trim().split(/\s/)[0], source: '' })
      lines.push('', `\uE002${code.length - 1}\uE002`, '')
    } else if (HEADING.test(line)) {
      lines.push('', line, '')
    } else if (TABLE_DIVIDER.test(line)) {
      continue
    } else if (TABLE_ROW.test(line)) {
      const cells = line.trim().slice(1, -1).split('|').map((cell) => cell.trim()).filter(Boolean)
      lines.push(withPause(cells.join(' — ')))
    } else if (LIST_ITEM.test(line)) {
      lines.push(withPause(line))
    } else {
      lines.push(line)
    }
  }
  closeFence()
  return { text: lines.join('\n'), code }
}

function withPause(line: string): string {
  return ENDS_WITH_PAUSE.test(line) ? line : `${line} —`
}
