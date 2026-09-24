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

export function splitAtPivot(word: string): PivotSplit {
  const chars = Array.from(word)
  const index = orpIndex(word)
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
