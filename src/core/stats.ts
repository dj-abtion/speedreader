// A commonly cited average silent reading rate for adults reading non-fiction in English
// (Brysbaert, 2019). Time saved is measured against it.
export const AVERAGE_WPM = 238

export interface Finish {
  at: number
  words: number
  readingMs: number
}

export function savedMs(words: number, readingMs: number): number {
  return Math.max(0, (words / AVERAGE_WPM) * 60_000 - readingMs)
}

export function monthSummary(finishes: Finish[], now = new Date()): { savedMs: number; count: number } {
  const thisMonth = finishes.filter((finish) => {
    const at = new Date(finish.at)
    return at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth()
  })
  return {
    savedMs: thisMonth.reduce((sum, finish) => sum + savedMs(finish.words, finish.readingMs), 0),
    count: thisMonth.length,
  }
}
