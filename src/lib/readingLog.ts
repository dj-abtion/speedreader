import type { Finish } from '../core/stats'

const FINISHES_KEY = 'speedreader.finishes'
const MAX_FINISHES = 1000

// Kept apart from the library so time saved survives deleting a text. Storage can be
// unavailable, in which case the stats simply start empty.
export function loadFinishes(): Finish[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(FINISHES_KEY) ?? '[]')
    return Array.isArray(stored) ? stored.filter(isFinish) : []
  } catch {
    return []
  }
}

export function recordFinish(finish: Finish): void {
  try {
    const finishes = [...loadFinishes(), finish].slice(-MAX_FINISHES)
    localStorage.setItem(FINISHES_KEY, JSON.stringify(finishes))
  } catch {
    // Not persisting is acceptable; the stats just miss this text.
  }
}

function isFinish(value: unknown): value is Finish {
  const finish = value as Finish
  return (
    typeof finish?.at === 'number' &&
    typeof finish.words === 'number' &&
    typeof finish.readingMs === 'number'
  )
}
