// Fetches a web page for Didread, which can't do it from the browser because most sites don't
// allow cross-origin reads. The page is passed through unchanged: the article is picked out on
// the device, and nothing is stored or logged here.

const ALLOWED_ORIGINS = new Set([
  'https://dj-abtion.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
])
const READABLE_TYPES = /^(text\/html|application\/xhtml\+xml|text\/plain)\b/i
// Matches the cap on text decoded from reader links.
export const MAX_BYTES = 5_000_000
const TIMEOUT_MS = 15_000
const USER_AGENT =
  'Mozilla/5.0 (compatible; Didread/1.0; +https://dj-abtion.github.io/speedreader/) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

export type FetchError = 'origin' | 'url' | 'unreachable' | 'status' | 'type' | 'size'

export default {
  fetch: handle,
}

export async function handle(request: Request): Promise<Response> {
  const origin = request.headers.get('Origin') ?? ''
  if (!ALLOWED_ORIGINS.has(origin)) return failure('', 'origin', 403)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })
  if (request.method !== 'GET') return failure(origin, 'url', 405)

  const target = pageUrl(new URL(request.url).searchParams.get('url'))
  if (!target) return failure(origin, 'url', 400)

  let page: Response
  try {
    page = await fetch(target, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return failure(origin, 'unreachable', 502)
  }
  if (!page.ok) return failure(origin, 'status', 502, { status: page.status })

  const type = page.headers.get('Content-Type') ?? 'text/html'
  if (!READABLE_TYPES.test(type)) return failure(origin, 'type', 415)
  if (Number(page.headers.get('Content-Length')) > MAX_BYTES) return failure(origin, 'size', 413)
  const body = await readCapped(page)
  if (!body) return failure(origin, 'size', 413)

  return new Response(body, {
    headers: { ...cors(origin), 'Content-Type': type, 'X-Final-Url': page.url || target.href },
  })
}

// Only public web pages: no other schemes, credentials or addresses on the local network.
export function pageUrl(raw: string | null): URL | null {
  let url: URL
  try {
    url = new URL(raw ?? '')
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.username || url.password) return null
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return null
  if (/^(0|10|127|169\.254|172\.(1[6-9]|2\d|3[01])|192\.168)\./.test(host)) return null
  if (host.includes(':')) return null
  return url
}

async function readCapped(page: Response): Promise<Uint8Array<ArrayBuffer> | null> {
  const reader = page.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

function cors(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Expose-Headers': 'X-Final-Url',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

function failure(origin: string, error: FetchError, status: number, extra: object = {}): Response {
  return new Response(JSON.stringify({ error, ...extra }), {
    status,
    headers: { ...(origin ? cors(origin) : {}), 'Content-Type': 'application/json' },
  })
}
