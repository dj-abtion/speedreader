import type { Token } from './tokenize'

export const MAX_CHUNK_LENGTH = 18

/** Tokens `start` (inclusive) to `end` (exclusive) shown together in one flash. */
export interface Chunk {
  start: number
  end: number
}

// Chunks stop at any clause, sentence or paragraph end so pauses and sentence navigation keep
// working, and at MAX_CHUNK_LENGTH characters so a chunk still fits on a phone screen.
export function chunkTokens(tokens: Token[], size: number): Chunk[] {
  const chunks: Chunk[] = []
  let start = 0
  while (start < tokens.length) {
    let end = start + 1
    let length = tokens[start].text.length
    while (end - start < size && end < tokens.length && !endsBreak(tokens[end - 1])) {
      const next = length + 1 + tokens[end].text.length
      if (next > MAX_CHUNK_LENGTH) break
      length = next
      end++
    }
    chunks.push({ start, end })
    start = end
  }
  return chunks
}

export function chunkText(tokens: Token[], chunk: Chunk): string {
  return tokens
    .slice(chunk.start, chunk.end)
    .map((t) => t.text)
    .join(' ')
}

export function chunkAt(chunks: Chunk[], index: number): number {
  let low = 0
  let high = chunks.length - 1
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (chunks[mid].start <= index) low = mid
    else high = mid - 1
  }
  return low
}

function endsBreak(token: Token): boolean {
  return token.endsClause || token.endsSentence || token.endsParagraph
}
