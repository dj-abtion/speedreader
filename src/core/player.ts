import { chunkAt, chunkTokens, type Chunk } from './chunk'
import { nextSentenceStart, previousSentenceStart, sentenceStart } from './navigation'
import { durations, rampMultiplier, remainingMs, weights } from './timing'
import type { Token } from './tokenize'

export const MIN_WPM = 100
export const MAX_WPM = 1000
export const MIN_CHUNK_SIZE = 1
export const MAX_CHUNK_SIZE = 3

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
  chunkSize?: number
  position?: number
  clock?: Clock
  onTick?: (index: number) => void
  onEnd?: () => void
  // Called when playback stops by itself on a code block, which needs reading at its own pace.
  onStop?: () => void
}

// Drives playback from elapsed wall-clock time rather than chained timeouts,
// so timer jitter never accumulates into drift. `index` is always the first token of the chunk
// on screen, so positions stay token indexes whatever the chunk size.
export class Player {
  index = 0
  playing = false
  wpm: number
  chunkSize: number

  private readonly tokens: Token[]
  private chunks: Chunk[]
  private chunkIndex = 0
  private readonly weights: number[]
  private durations: number[]
  private readonly clock: Clock
  private readonly onTick: (index: number) => void
  private readonly onEnd: () => void
  private readonly onStop: () => void
  private frameId: number | null = null
  private startedAt = 0
  private nextAt = 0

  constructor({
    tokens,
    wpm,
    chunkSize = MIN_CHUNK_SIZE,
    position = 0,
    clock = browserClock,
    onTick,
    onEnd,
    onStop,
  }: PlayerOptions) {
    this.tokens = tokens
    this.chunkSize = clampChunkSize(chunkSize)
    this.chunks = chunkTokens(tokens, this.chunkSize)
    this.weights = weights(tokens)
    this.wpm = clampWpm(wpm)
    this.durations = durations(this.weights, this.wpm)
    this.clock = clock
    this.onTick = onTick ?? (() => {})
    this.onEnd = onEnd ?? (() => {})
    this.onStop = onStop ?? (() => {})
    this.moveTo(position)
  }

  get chunk(): Chunk {
    return this.chunks[this.chunkIndex] ?? { start: 0, end: 0 }
  }

  get atLastChunk(): boolean {
    return this.chunkIndex === this.chunks.length - 1
  }

  get atCode(): boolean {
    return this.tokens[this.chunk.start]?.code !== undefined
  }

  get remainingMs(): number {
    return remainingMs(this.durations, this.index)
  }

  play(): void {
    if (this.playing || this.tokens.length === 0) return
    this.moveTo(sentenceStart(this.tokens, this.index))
    // Playing on from a code block means the reader is done with it.
    if (this.atCode && !this.atLastChunk) this.moveTo(this.chunks[this.chunkIndex + 1].start)
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
    this.moveTo(index)
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

  setChunkSize(size: number): void {
    this.chunkSize = clampChunkSize(size)
    this.chunks = chunkTokens(this.tokens, this.chunkSize)
    this.moveTo(this.index)
  }

  private readonly frame = (): void => {
    this.frameId = null
    const now = this.clock.now()
    const startChunk = this.chunkIndex
    while (now >= this.nextAt) {
      if (this.atLastChunk) {
        if (this.chunkIndex !== startChunk) this.onTick(this.index)
        this.pause()
        this.onEnd()
        return
      }
      this.chunkIndex++
      this.index = this.chunk.start
      if (this.atCode) {
        this.onTick(this.index)
        this.pause()
        this.onStop()
        return
      }
      this.nextAt += this.currentDuration(this.nextAt)
    }
    if (this.chunkIndex !== startChunk) this.onTick(this.index)
    this.scheduleFrame()
  }

  private scheduleFrame(): void {
    this.frameId = this.clock.requestFrame(this.frame)
  }

  private currentDuration(at = this.startedAt): number {
    const { start, end, share = 1 } = this.chunk
    let total = this.durations[start] * share
    for (let i = start + 1; i < end; i++) total += this.durations[i]
    return total * rampMultiplier(at - this.startedAt)
  }

  private moveTo(index: number): void {
    const clamped = Math.min(Math.max(index, 0), Math.max(this.tokens.length - 1, 0))
    this.chunkIndex = chunkAt(this.chunks, clamped)
    this.index = this.chunk.start
  }
}

function clampChunkSize(size: number): number {
  return Math.min(Math.max(Math.round(size), MIN_CHUNK_SIZE), MAX_CHUNK_SIZE)
}

function clampWpm(wpm: number): number {
  return Math.min(Math.max(wpm, MIN_WPM), MAX_WPM)
}
