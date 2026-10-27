import { afterEach, describe, expect, it, vi } from 'vitest'
import { handle, MAX_BYTES, pageUrl } from './fetch'

const ORIGIN = 'https://dj-abtion.github.io'

function request(url: string, origin = ORIGIN, method = 'GET'): Request {
  return new Request(`https://didread-fetch.example.workers.dev/?url=${encodeURIComponent(url)}`, {
    method,
    headers: origin ? { Origin: origin } : {},
  })
}

function stubPage(body: BodyInit, init: ResponseInit = {}, finalUrl = '') {
  const page = new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' }, ...init })
  if (finalUrl) Object.defineProperty(page, 'url', { value: finalUrl })
  const fetch = vi.fn(async () => page)
  vi.stubGlobal('fetch', fetch)
  return fetch
}

afterEach(() => vi.unstubAllGlobals())

describe('handle', () => {
  it('passes the page through for Didread, with the address it ended up at', async () => {
    const fetch = stubPage('<p>Hello</p>', {}, 'https://example.com/final')
    const response = await handle(request('https://example.com/a'))
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('<p>Hello</p>')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN)
    expect(response.headers.get('X-Final-Url')).toBe('https://example.com/final')
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
    expect(fetch).toHaveBeenCalledWith(new URL('https://example.com/a'), expect.anything())
  })

  it('serves only Didread itself', async () => {
    const fetch = stubPage('<p>Hello</p>')
    expect((await handle(request('https://example.com/', 'https://elsewhere.example'))).status).toBe(403)
    expect((await handle(request('https://example.com/', ''))).status).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('refuses addresses that are not public web pages', async () => {
    stubPage('')
    const response = await handle(request('file:///etc/passwd'))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'url' })
  })

  it('reports the status of a page that failed', async () => {
    stubPage('Not here', { status: 404 })
    const response = await handle(request('https://example.com/missing'))
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'status', status: 404 })
  })

  it('refuses files that are not pages', async () => {
    stubPage('%PDF', { headers: { 'Content-Type': 'application/pdf' } })
    expect(await (await handle(request('https://example.com/a.pdf'))).json()).toEqual({ error: 'type' })
  })

  it('refuses pages over the size cap', async () => {
    stubPage(new Uint8Array(MAX_BYTES + 1))
    expect(await (await handle(request('https://example.com/huge'))).json()).toEqual({ error: 'size' })
  })

  it('reports a site that could not be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('network'))))
    expect(await (await handle(request('https://example.com/'))).json()).toEqual({ error: 'unreachable' })
  })
})

describe('pageUrl', () => {
  it('accepts public http and https addresses', () => {
    expect(pageUrl('https://example.com/a?b=1')?.href).toBe('https://example.com/a?b=1')
    expect(pageUrl('http://example.com')?.href).toBe('http://example.com/')
  })

  it('rejects other schemes, credentials and local addresses', () => {
    for (const url of [
      null,
      'not a url',
      'ftp://example.com',
      'https://user:pass@example.com',
      'http://localhost:8080',
      'http://127.0.0.1',
      'http://2130706433',
      'http://10.0.0.1',
      'http://192.168.1.1',
      'http://172.20.0.1',
      'http://169.254.169.254',
      'http://[::1]',
      'http://printer.local',
    ]) {
      expect(pageUrl(url), String(url)).toBeNull()
    }
  })
})
