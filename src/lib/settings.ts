import { MAX_CHUNK_SIZE, MAX_WPM, MIN_CHUNK_SIZE, MIN_WPM } from '../core/player'

const WPM_KEY = 'speedreader.wpm'
export const DEFAULT_WPM = 300

// Storage can be unavailable (private mode, blocked site data), so failures fall back to defaults.
export function loadWpm(): number {
  try {
    const stored = Number(localStorage.getItem(WPM_KEY))
    return stored >= MIN_WPM && stored <= MAX_WPM ? stored : DEFAULT_WPM
  } catch {
    return DEFAULT_WPM
  }
}

export function saveWpm(wpm: number): void {
  try {
    localStorage.setItem(WPM_KEY, String(wpm))
  } catch {
    // Not persisting is acceptable; the reader keeps working.
  }
}

const CHUNK_SIZE_KEY = 'speedreader.chunkSize'
export const DEFAULT_CHUNK_SIZE = 1

export function loadChunkSize(): number {
  try {
    const stored = Number(localStorage.getItem(CHUNK_SIZE_KEY))
    return stored >= MIN_CHUNK_SIZE && stored <= MAX_CHUNK_SIZE ? stored : DEFAULT_CHUNK_SIZE
  } catch {
    return DEFAULT_CHUNK_SIZE
  }
}

export function saveChunkSize(size: number): void {
  try {
    localStorage.setItem(CHUNK_SIZE_KEY, String(size))
  } catch {
    // Not persisting is acceptable; the reader keeps working.
  }
}
