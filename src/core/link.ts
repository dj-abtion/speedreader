// A reader link carries the whole text in its fragment (#t=…), compressed. Browsers never send
// the fragment to the server, so the text stays between the link and the device.
const PARAM = 't'
const PREFIX = `#${PARAM}=`
const FORMAT = 'deflate-raw'
// Decompression is capped so a crafted link can't inflate into gigabytes.
export const MAX_LINK_TEXT_BYTES = 5_000_000

export async function encodeText(text: string): Promise<string> {
  const compressed = await pipe(new TextEncoder().encode(text), new CompressionStream(FORMAT))
  return toBase64Url(compressed)
}

export async function decodeText(payload: string): Promise<string> {
  const compressed = fromBase64Url(payload)
  const bytes = await pipe(compressed, new DecompressionStream(FORMAT), MAX_LINK_TEXT_BYTES)
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

export function readerLink(appUrl: string, payload: string): string {
  return `${appUrl}${PREFIX}${payload}`
}

export function payloadFromHash(hash: string): string | null {
  return hash.startsWith(PREFIX) && hash.length > PREFIX.length ? hash.slice(PREFIX.length) : null
}

// Recognises a reader link pasted or copied as text, so it opens the text it carries.
export function payloadFromLink(link: string, appUrl: string): string | null {
  const trimmed = link.trim()
  const hashAt = trimmed.indexOf('#')
  if (hashAt < 0 || /\s/.test(trimmed)) return null
  const address = trimmed.slice(0, hashAt)
  if (address !== appUrl && `${address}/` !== appUrl) return null
  return payloadFromHash(trimmed.slice(hashAt))
}

async function pipe(
  input: Uint8Array,
  transform: CompressionStream | DecompressionStream,
  limit = Infinity,
): Promise<Uint8Array> {
  const reader = new Blob([input as BlobPart]).stream().pipeThrough(transform).getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > limit) {
      await reader.cancel()
      throw new Error('Linked text is too large')
    }
    chunks.push(value)
  }
  const output = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }
  return output
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(payload: string): Uint8Array {
  const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}
