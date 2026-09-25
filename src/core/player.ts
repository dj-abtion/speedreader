import { nextSentenceStart, previousSentenceStart, sentenceStart } from './navigation'
import { durations, rampMultiplier, remainingMs, weights } from './timing'
import type { Token } from './tokenize'

export const MIN_WPM = 100
export const MAX_WPM = 1000

export interface Clock {
  now(): number
  requestFrame(callback: () => void): number
  cancelFrame(id: number): void
}

export const browserClock: Clock = {
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (id) => cancelAnimationFrame(id),
}

export interface PlayerOptions {
  tokens: Token[]
  wpm: number
  position?: number
  clock?: Clock
  onTick?: (index: number) => void
  onEnd?: () => void
}

// Drives playback from elapsed wall-clock time rather than chained timeouts,
// so timer jitter never accumulates into drift.
export class Player {
  index: number
  playing = false
  wpm: number

  private readonly tokens: Token[]
  private readonly weights: number[]
  private durations: number[]
  private readonly clock: Clock
  private readonly onTick: (index: number) => void
  private readonly onEnd: () => void
  private frameId: number | null = null
  private startedAt = 0
  private nextAt = 0

  constructor({ tokens, wpm, position = 0, clock = browserClock, onTick, onEnd }: PlayerOptions) {
    this.tokens = tokens
    this.weights = weights(tokens)
    this.wpm = clampWpm(wpm)
    this.durations = durations(this.weights, this.wpm)
    this.clock = clock
    this.onTick = onTick ?? (() => {})
    this.onEnd = onEnd ?? (() => {})
    this.index = this.clampIndex(position)
  }

  get remainingMs(): number {
    return remainingMs(this.durations, this.index)
  }

  play(): void {
    if (this.playing || this.tokens.length === 0) return
    this.index = sentenceStart(this.tokens, this.index)
    this.playing = true
    this.startedAt = this.clock.now()
    this.nextAt = this.startedAt + this.currentDuration()
    this.scheduleFrame()
  }

  pause(): void {
    this.playing = false
    if (this.frameId !== null) this.clock.cancelFrame(this.frameId)
    this.frameId = null
  }

  toggle(): void {
    if (this.playing) this.pause()
    else this.play()
  }

  seek(index: number): void {
    this.index = this.clampIndex(index)
    if (this.playing) {
      const now = this.clock.now()
      this.nextAt = now + this.currentDuration(now)
    }
  }

  back(): void {
    this.seek(previousSentenceStart(this.tokens, this.index))
  }

  forward(): void {
    this.seek(nextSentenceStart(this.tokens, this.index))
  }

  setWpm(wpm: number): void {
    this.wpm = clampWpm(wpm)
    this.durations = durations(this.weights, this.wpm)
  }

  private readonly frame = (): void => {
    this.frameId = null
    const now = this.clock.now()
    const startIndex = this.index
    while (now >= this.nextAt) {
      if (this.index === this.tokens.length - 1) {
        if (this.index !== startIndex) this.onTick(this.index)
        this.pause()
        this.onEnd()
        return
      }
      this.index++
      this.nextAt += this.currentDuration(this.nextAt)
    }
    if (this.index !== startIndex) this.onTick(this.index)
    this.scheduleFrame()
  }

  private scheduleFrame(): void {
    this.frameId = this.clock.requestFrame(this.frame)
  }

  private currentDuration(at = this.startedAt): number {
    return this.durations[this.index] * rampMultiplier(at - this.startedAt)
  }

  private clampIndex(index: number): number {
    return Math.min(Math.max(index, 0), Math.max(this.tokens.length - 1, 0))
  }
}

function clampWpm(wpm: number): number {
  return Math.min(Math.max(wpm, MIN_WPM), MAX_WPM)
}
