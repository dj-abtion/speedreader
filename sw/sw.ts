/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import {
  SHARE_ACTION,
  SHARE_INBOX_CACHE,
  SHARE_INBOX_KEY,
  SHARED_FLAG,
  type SharedFields,
} from '../src/lib/shareInbox'

declare const self: ServiceWorkerGlobalScope

const BASE = import.meta.env.BASE_URL

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL(`${BASE}index.html`)))

// The share target posts here. Answering it in the worker keeps shared text on the device:
// it is parked in Cache Storage and the page is opened with only a flag in its URL.
registerRoute(
  ({ url }) => url.pathname === SHARE_ACTION,
  async ({ request }) => {
    const form = await request.formData()
    const fields: SharedFields = {
      title: String(form.get('title') ?? ''),
      text: String(form.get('text') ?? ''),
      url: String(form.get('url') ?? ''),
    }
    const cache = await caches.open(SHARE_INBOX_CACHE)
    await cache.put(SHARE_INBOX_KEY, new Response(JSON.stringify(fields)))
    return Response.redirect(`${BASE}?${SHARED_FLAG}`, 303)
  },
  'POST',
)
