import { MAX_CHUNK_LENGTH } from './chunk'
import { CODE_BLOCK, CODE_BLOCK_LABEL, type CodeBlock } from './code'
import { isNumber } from './number'

export interface Token {
  text: string
  endsSentence: boolean
  endsClause: boolean
  endsParagraph: boolean
  // A code block reads as one placeholder token that carries the code to show instead.
  code?: CodeBlock
}

export const MAX_TOKEN_LENGTH = 13
const CHUNK_LENGTH = 12

const CLOSERS = `"'”’)\\]»`
const SENTENCE_END = new RegExp(`[.!?][${CLOSERS}]*$`)
const CLAUSE_END = new RegExp(`([,;:—–]|\\.\\.\\.|…)[${CLOSERS}]*$`)
const ELLIPSIS_END = new RegExp(`(\\.\\.\\.|…)[${CLOSERS}]*$`)
const STANDALONE_DASH = /^(—|–|--)$/
const INNER_BREAK = /(?<=—|–|…|\.\.\.)(?=[\p{L}\p{N}])/u

// Lowercased, without the trailing period.
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'e.g', 'i.e', 'cf', 'approx',
])

export function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let proseStart = 0
  for (const match of text.matchAll(CODE_BLOCK)) {
    tokens.push(...tokenizeProse(text.slice(proseStart, match.index)), {
      text: CODE_BLOCK_LABEL,
      endsSentence: true,
      endsClause: false,
      endsParagraph: true,
      code: { language: match[1], source: match[2] },
    })
    proseStart = match.index + match[0].length
  }
  tokens.push(...tokenizeProse(text.slice(proseStart)))
  return tokens
}

function tokenizeProse(text: string): Token[] {
  return text
    .split(/\n\s*\n/)
    .flatMap((paragraph) => {
      const tokens = tokenizeParagraph(paragraph)
      const last = tokens.at(-1)
      if (last) {
        last.endsParagraph = true
        last.endsSentence = true
      }
      return tokens
    })
}

function tokenizeParagraph(paragraph: string): Token[] {
  const tokens: Token[] = []
  for (const word of paragraph.split(/\s+/).filter(Boolean)) {
    if (STANDALONE_DASH.test(word)) {
      const previous = tokens.at(-1)
      if (previous) previous.endsClause = true
      continue
    }
    for (const part of word.split(INNER_BREAK)) {
      tokens.push(...splitLong(part).map(toToken))
    }
  }
  return tokens
}

function toToken(text: string, index: number, chunks: string[]): Token {
  const isLast = index === chunks.length - 1
  return {
    text,
    endsSentence: isLast && endsSentence(text),
    endsClause: isLast && CLAUSE_END.test(text),
    endsParagraph: false,
  }
}

function endsSentence(word: string): boolean {
  if (!SENTENCE_END.test(word) || ELLIPSIS_END.test(word)) return false
  const bare = word.toLowerCase().replace(/^[^\p{L}]+/u, '').replace(/\.$/, '')
  return !ABBREVIATIONS.has(bare)
}

// Half a number is unreadable, so numbers stay whole as long as they still fit on screen.
function splitLong(word: string): string[] {
  if (word.length <= MAX_TOKEN_LENGTH) return [word]
  if (isNumber(word) && word.length <= MAX_CHUNK_LENGTH) return [word]
  return groupHyphenParts(word).flatMap((part) =>
    part.length <= MAX_TOKEN_LENGTH ? [part] : chunk(part),
  )
}

function groupHyphenParts(word: string): string[] {
  const parts = word.split(/(?<=-)(?=.)/)
  const groups: string[] = []
  for (const part of parts) {
    const last = groups.at(-1)
    if (last !== undefined && (last + part).length <= MAX_TOKEN_LENGTH) {
      groups[groups.length - 1] = last + part
    } else {
      groups.push(part)
    }
  }
  return groups
}

function chunk(word: string): string[] {
  const count = Math.ceil(word.length / CHUNK_LENGTH)
  const size = Math.ceil(word.length / count)
  const chunks: string[] = []
  for (let start = 0; start < word.length; start += size) {
    const piece = word.slice(start, start + size)
    const isLast = start + size >= word.length
    chunks.push(isLast || piece.endsWith('-') ? piece : `${piece}-`)
  }
  return chunks
}
