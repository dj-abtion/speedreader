import { beforeEach, describe, expect, it } from 'vitest'
import { Player, type Clock } from './player'
import { tokenize } from './tokenize'
import { durations, RAMP_MS, weights } from './timing'

class FakeClock implements Clock {
  time = 0
  private pending: (() => void) | null = null

  now = () => this.time
  requestFrame = (callback: () => void) => {
    this.pending = callback
    return 1
  }
  cancelFrame = () => {
    this.pending = null
  }

  advance(ms: number, frameMs = 16) {
    const end = this.time + ms
    while (this.time < end) {
      this.time = Math.min(this.time + frameMs, end)
      const callback = this.pending
      this.pending = null
      callback?.()
    }
  }

  get hasPendingFrame() {
    return this.pending !== null
  }
}

const text = Array.from(
  { length: 30 },
  (_, i) => `Sentence number ${i} has several words, some of them considerably longer. Then another!`,
).join('\n\n')

describe('Player', () => {
  let clock: FakeClock

  beforeEach(() => {
    clock = new FakeClock()
  })

  it('reads a long text at 300 WPM in the expected time, plus only the ramp-up', () => {
    const tokens = tokenize(text)
    let endedAt: number | null = null
    const player = new Player({ tokens, wpm: 300, clock, onEnd: () => (endedAt = clock.time) })
    const expected = durations(weights(tokens), 300).reduce((a, b) => a + b, 0)

    player.play()
    clock.advance(expected + RAMP_MS + 1000)

    expect(endedAt).not.toBeNull()
    expect(endedAt!).toBeGreaterThanOrEqual(expected)
    expect(endedAt! - expected).toBeLessThan(RAMP_MS)
    expect(player.playing).toBe(false)
    expect(player.index).toBe(tokens.length - 1)
  })

  it('advances through tokens and reports each change', () => {
    const seen: number[] = []
    const player = new Player({ tokens: tokenize('one two three'), wpm: 600, clock, onTick: (i) => seen.push(i) })
    player.play()
    clock.advance(1000)
    expect(seen).toEqual([1, 2])
  })

  it('stops advancing when paused and stops requesting frames', () => {
    const player = new Player({ tokens: tokenize('a b c d e f g h'), wpm: 600, clock })
    player.play()
    clock.advance(RAMP_MS)
    player.pause()
    const index = player.index
    clock.advance(5000)
    expect(player.index).toBe(index)
    expect(clock.hasPendingFrame).toBe(false)
  })

  it('rewinds to the start of the current sentence on resume', () => {
    const tokens = tokenize('One two three. Four five six seven eight.')
    const player = new Player({ tokens, wpm: 300, clock, position: 6 })
    player.play()
    expect(player.index).toBe(3)
  })

  it('shows the first token immediately and waits its duration before advancing', () => {
    const player = new Player({ tokens: tokenize('one two'), wpm: 100, clock })
    player.play()
    clock.advance(400)
    expect(player.index).toBe(0)
  })

  it('moves by sentence and clamps seeks', () => {
    const tokens = tokenize('One two. Three four. Five six.')
    const player = new Player({ tokens, wpm: 300, clock })
    player.forward()
    expect(player.index).toBe(2)
    player.forward()
    expect(player.index).toBe(4)
    player.back()
    expect(player.index).toBe(2)
    player.seek(99)
    expect(player.index).toBe(5)
    player.seek(-3)
    expect(player.index).toBe(0)
  })

  it('uses full-speed timing for a seek made after the ramp-up', () => {
    const tokens = tokenize('a b c d e f g h i j k l m n o p')
    const player = new Player({ tokens, wpm: 100, clock })
    player.play()
    clock.advance(RAMP_MS * 2)
    player.seek(10)
    const full = durations(weights(tokens), 100)[10]
    clock.advance(full - 20, 1)
    expect(player.index).toBe(10)
    clock.advance(40, 1)
    expect(player.index).toBe(11)
  })

  it('reports the final token before ending, even when both happen in one frame', () => {
    const seen: number[] = []
    const player = new Player({ tokens: tokenize('a b'), wpm: 1000, clock, onTick: (i) => seen.push(i) })
    player.play()
    clock.advance(5000, 5000)
    expect(seen).toEqual([1])
  })

  it('clamps WPM to the supported range', () => {
    const player = new Player({ tokens: tokenize('a'), wpm: 300, clock })
    player.setWpm(5000)
    expect(player.wpm).toBe(1000)
    player.setWpm(10)
    expect(player.wpm).toBe(100)
  })

  it('reports remaining time at the current WPM', () => {
    const tokens = tokenize('a b c d')
    const player = new Player({ tokens, wpm: 240, clock })
    expect(player.remainingMs).toBeCloseTo(1000)
    player.seek(2)
    const [, , c, d] = durations(weights(tokens), 240)
    expect(player.remainingMs).toBeCloseTo(c + d)
  })

  it('does nothing when played with no tokens', () => {
    const player = new Player({ tokens: [], wpm: 300, clock })
    player.play()
    expect(player.playing).toBe(false)
  })
})
