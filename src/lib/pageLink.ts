import type { NewDocument } from '../core/document'

// Most sites don't let a web page read them, so links are fetched through Didread's own small
// Worker (worker/fetch.ts). Without one configured at build time, links aren't offered at all.
const FETCHER_URL = import.meta.env.VITE_LINK_FETCHER_URL ?? ''
export const canOpenLinks = FETCHER_URL !== ''

const CONSENT_KEY = 'speedreader.linkConsent'
const TIMEOUT_MS = 20_000

export class PageError extends Error {}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function hasLinkConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1'
  } catch {
    return false
  }
}

export function saveLinkConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, '1')
  } catch {
    // Not persisting only means being asked again next time.
  }
}

export async function fetchPage(url: string): Promise<NewDocument> {
  const host = hostOf(url)
  let response: Response
  try {
    response = await fetch(`${FETCHER_URL}?${new URLSearchParams({ url })}`, {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new PageError(navigator.onLine ? `Couldn't open ${host}. Try again in a moment.` : 'Opening a link needs a connection.')
  }
  if (!response.ok) throw new PageError(await failureMessage(response, host))

  const type = response.headers.get('Content-Type') ?? ''
  const html = decode(await response.arrayBuffer(), type)
  if (/^text\/plain\b/i.test(type)) {
    if (html.trim()) return { title: '', text: html.trim() }
  } else {
    const { articleFromHtml } = await import('../core/article')
    const article = articleFromHtml(html)
    if (article) return article
  }
  throw new PageError(`Couldn't find an article on ${host}. Copy the text itself instead.`)
}

async function failureMessage(response: Response, host: string): Promise<string> {
  const { error, status } = (await response.json().catch(() => ({}))) as { error?: string; status?: number }
  switch (error) {
    case 'status':
      if (status === 401 || status === 403) return `${host} doesn't let Didread in. Copy the text itself instead.`
      if (status === 404 || status === 410) return `${host} couldn't find that page.`
      return `${host} answered with an error (${status}). Try again in a moment.`
    case 'unreachable':
      return `Couldn't reach ${host}.`
    case 'type':
      return 'Only web pages can be opened, not PDFs or other files.'
    case 'size':
      return 'That page is too large to open.'
    case 'url':
      return "That link can't be opened."
    default:
      return `Couldn't open ${host}. Try again in a moment.`
  }
}

// The header's charset decides, then a <meta charset> near the top, then UTF-8.
function decode(bytes: ArrayBuffer, type: string): string {
  const head = new TextDecoder('latin1').decode(bytes.slice(0, 2048))
  const charset = /charset=["']?([\w-]+)/i.exec(type)?.[1] ?? /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1]
  try {
    return new TextDecoder(charset ?? 'utf-8').decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}
