import { isNumber, isUnit, numberParts } from './number'
import { numberPartPauses } from './timing'
import type { Token } from './tokenize'

export const MAX_CHUNK_LENGTH = 18

/** Tokens `start` (inclusive) to `end` (exclusive) shown together in one flash. */
export interface Chunk {
  start: number
  end: number
  // A large number is read over several chunks: each shows `text`, one part of the number,
  // for `share` of the number's time.
  text?: string
  share?: number
}

// Chunks stop at any clause, sentence or paragraph end so pauses and sentence navigation keep
// working, and at MAX_CHUNK_LENGTH characters so a chunk still fits on a phone screen.
// Numbers get a flash of their own, as reading one alongside words is too much at once,
// apart from a unit straight after them ("25 km"), which is part of the number and joins its
// last part.
export function chunkTokens(tokens: Token[], size: number): Chunk[] {
  const chunks: Chunk[] = []
  let start = 0
  while (start < tokens.length) {
    let end = start + 1
    let length = tokens[start].text.length
    while (end - start < size && end < tokens.length && !endsBreak(tokens[end - 1])) {
      if (!joinsAroundNumbers(tokens[start], tokens[end - 1], tokens[end])) break
      const next = length + 1 + tokens[end].text.length
      if (next > MAX_CHUNK_LENGTH) break
      length = next
      end++
    }
    const parts = numberParts(tokens[start].text)
    if (parts) chunks.push(...numberChunks(tokens, { start, end }, parts))
    else chunks.push({ start, end })
    start = end
  }
  return chunks
}

function numberChunks(tokens: Token[], { start, end }: Chunk, parts: string[]): Chunk[] {
  const pauses = numberPartPauses(parts)
  const total = pauses.reduce((sum, pause) => sum + pause, 0)
  const unit = tokens.slice(start + 1, end).map((t) => ` ${t.text}`).join('')
  return parts.map((part, i) => {
    const isLast = i === parts.length - 1
    return {
      start,
      end: isLast ? end : start + 1,
      text: isLast ? part + unit : part,
      share: pauses[i] / total,
    }
  })
}

export function chunkText(tokens: Token[], chunk: Chunk): string {
  if (chunk.text !== undefined) return chunk.text
  return tokens
    .slice(chunk.start, chunk.end)
    .map((t) => t.text)
    .join(' ')
}

// The first chunk showing the token, so a number read in parts is always entered at its start.
export function chunkAt(chunks: Chunk[], index: number): number {
  let low = 0
  let high = chunks.length - 1
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (chunks[mid].end > index) high = mid
    else low = mid + 1
  }
  return low
}

function joinsAroundNumbers(first: Token, previous: Token, next: Token): boolean {
  if (isNumber(first.text)) return previous === first && isUnit(next.text)
  return !isNumber(next.text)
}

function endsBreak(token: Token): boolean {
  return token.endsClause || token.endsSentence || token.endsParagraph
}
