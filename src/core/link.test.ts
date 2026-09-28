import { describe, expect, it } from 'vitest'
import { decodeText, encodeText, payloadFromHash, payloadFromLink, readerLink } from './link'

const APP = 'https://dj-abtion.github.io/speedreader/'

describe('encodeText / decodeText', () => {
  it('round-trips text, including non-ASCII characters', async () => {
    const text = '## Plan\n\nRead faster — “one word” at a time. Ærø, 東京, 🚀.'
    expect(await decodeText(await encodeText(text))).toBe(text)
  })

  it('produces a URL-safe payload', async () => {
    const payload = await encodeText('?'.repeat(500) + '>>>~~~'.repeat(200))
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('compresses a long reply well below its original size', async () => {
    const reply = Array.from({ length: 300 }, (_, i) => `Sentence ${i} explains a detail.`).join(' ')
    expect((await encodeText(reply)).length).toBeLessThan(reply.length / 2)
  })

  it('rejects a damaged payload', async () => {
    const payload = await encodeText('Some words that will be cut off in transit.')
    await expect(decodeText(payload.slice(0, 10))).rejects.toThrow()
    await expect(decodeText('not base64!')).rejects.toThrow()
  })

  it('refuses text that inflates past the size limit', async () => {
    const payload = await encodeText('a'.repeat(6_000_000))
    await expect(decodeText(payload)).rejects.toThrow(/too large/)
  })
})

describe('payloadFromHash', () => {
  it('reads the payload from a #t= fragment', () => {
    expect(payloadFromHash('#t=abc_-1')).toBe('abc_-1')
  })

  it('ignores other fragments', () => {
    expect(payloadFromHash('')).toBeNull()
    expect(payloadFromHash('#t=')).toBeNull()
    expect(payloadFromHash('#top')).toBeNull()
  })
})

describe('payloadFromLink', () => {
  it('recognises a reader link for this app', () => {
    expect(payloadFromLink(readerLink(APP, 'abc'), APP)).toBe('abc')
    expect(payloadFromLink(`  ${APP}#t=abc\n`, APP)).toBe('abc')
    expect(payloadFromLink('https://dj-abtion.github.io/speedreader#t=abc', APP)).toBe('abc')
  })

  it('ignores other links and ordinary text', () => {
    expect(payloadFromLink('https://example.com/#t=abc', APP)).toBeNull()
    expect(payloadFromLink(APP, APP)).toBeNull()
    expect(payloadFromLink(`Open ${APP}#t=abc now`, APP)).toBeNull()
    expect(payloadFromLink('Just some words.', APP)).toBeNull()
  })
})
