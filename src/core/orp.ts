const LETTER = /[\p{L}\p{N}]/u

export interface PivotSplit {
  before: string
  pivot: string
  after: string
}

export function orpIndex(word: string): number {
  const chars = Array.from(word)
  const first = chars.findIndex((c) => LETTER.test(c))
  if (first === -1) return 0
  const last = chars.findLastIndex((c) => LETTER.test(c))
  return first + pivotForLength(last - first + 1)
}

const PHRASE_PIVOT_RATIO = 0.3

// Multi-word chunks fixate about a third of the way in, like a single word's ORP, but the
// word-length table doesn't extend sensibly past one word.
export function phrasePivotIndex(phrase: string): number {
  const chars = Array.from(phrase)
  let index = Math.round(chars.length * PHRASE_PIVOT_RATIO)
  while (index < chars.length - 1 && !LETTER.test(chars[index])) index++
  return index
}

export function splitAtPivot(text: string): PivotSplit {
  const chars = Array.from(text)
  const index = text.includes(' ') ? phrasePivotIndex(text) : orpIndex(text)
  return {
    before: chars.slice(0, index).join(''),
    pivot: chars[index] ?? '',
    after: chars.slice(index + 1).join(''),
  }
}

function pivotForLength(length: number): number {
  if (length <= 1) return 0
  if (length <= 5) return 1
  if (length <= 9) return 2
  if (length <= 13) return 3
  return 4
}
