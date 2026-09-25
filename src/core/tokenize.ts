export interface Token {
  text: string
  endsSentence: boolean
  endsClause: boolean
  endsParagraph: boolean
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

function splitLong(word: string): string[] {
  if (word.length <= MAX_TOKEN_LENGTH) return [word]
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
