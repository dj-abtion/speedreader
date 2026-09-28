import { beforeEach, describe, expect, it } from 'vitest'
import { encodeCodeBlock } from './code'
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

  describe('with several words per flash', () => {
    it('reads a long text at 300 WPM in the same time as one word per flash', () => {
      const tokens = tokenize(text)
      let endedAt: number | null = null
      const player = new Player({ tokens, wpm: 300, chunkSize: 3, clock, onEnd: () => (endedAt = clock.time) })
      const expected = durations(weights(tokens), 300).reduce((a, b) => a + b, 0)

      player.play()
      clock.advance(expected + RAMP_MS + 1000)

      expect(endedAt).not.toBeNull()
      expect(endedAt!).toBeGreaterThanOrEqual(expected)
      expect(endedAt! - expected).toBeLessThan(RAMP_MS)
    })

    it('advances a whole chunk at a time and exposes the current chunk', () => {
      const seen: number[] = []
      const player = new Player({ tokens: tokenize('a b c d e f'), wpm: 600, chunkSize: 2, clock, onTick: (i) => seen.push(i) })
      expect(player.chunk).toEqual({ start: 0, end: 2 })
      player.play()
      clock.advance(3000)
      expect(seen).toEqual([2, 4])
      expect(player.chunk).toEqual({ start: 4, end: 6 })
    })

    it('snaps seeks to the start of the containing chunk', () => {
      const player = new Player({ tokens: tokenize('a b c d e f'), wpm: 300, chunkSize: 3, clock })
      player.seek(4)
      expect(player.index).toBe(3)
    })

    it('starts from the chunk containing a saved position', () => {
      const player = new Player({ tokens: tokenize('a b c d e f'), wpm: 300, chunkSize: 2, clock, position: 3 })
      expect(player.index).toBe(2)
    })

    it('re-chunks around the current position when the size changes', () => {
      const player = new Player({ tokens: tokenize('a b c d e f g'), wpm: 300, chunkSize: 1, clock, position: 5 })
      player.setChunkSize(3)
      expect(player.chunkSize).toBe(3)
      expect(player.index).toBe(3)
      expect(player.chunk).toEqual({ start: 3, end: 6 })
    })

    it('clamps the chunk size to 1–3', () => {
      const player = new Player({ tokens: tokenize('a'), wpm: 300, clock })
      player.setChunkSize(9)
      expect(player.chunkSize).toBe(3)
      player.setChunkSize(0)
      expect(player.chunkSize).toBe(1)
    })

    it('reports being on the last chunk', () => {
      const player = new Player({ tokens: tokenize('a b c d e'), wpm: 300, chunkSize: 2, clock, position: 4 })
      expect(player.atLastChunk).toBe(true)
      player.seek(1)
      expect(player.atLastChunk).toBe(false)
    })
  })
})

describe('Player at a code block', () => {
  const tokens = tokenize(`One two.\n\n${encodeCodeBlock({ language: '', source: 'x = 1' })}\n\nThree four.`)

  it('stops on the code block and plays on past it', () => {
    const clock = new FakeClock()
    let stops = 0
    const player = new Player({ tokens, wpm: 300, clock, onStop: () => stops++ })

    player.play()
    clock.advance(5000)
    expect(stops).toBe(1)
    expect(player.playing).toBe(false)
    expect(player.atCode).toBe(true)
    expect(clock.hasPendingFrame).toBe(false)

    player.play()
    expect(player.atCode).toBe(false)
    expect(tokens[player.index].text).toBe('Three')
  })
})
