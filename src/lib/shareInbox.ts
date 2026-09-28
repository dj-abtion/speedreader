// Shared content crosses from the service worker to the page through Cache Storage, which
// both can reach and which never leaves the device.
export const SHARE_INBOX_CACHE = 'speedreader-share-inbox'
export const SHARE_INBOX_KEY = `${import.meta.env.BASE_URL}share-inbox`
export const SHARE_ACTION = `${import.meta.env.BASE_URL}share`
export const SHARED_FLAG = 'shared'

export interface SharedFields {
  title: string
  text: string
  url: string
}

export async function takeSharedFields(): Promise<SharedFields | null> {
  try {
    const cache = await caches.open(SHARE_INBOX_CACHE)
    const response = await cache.match(SHARE_INBOX_KEY)
    if (!response) return null
    await cache.delete(SHARE_INBOX_KEY)
    return (await response.json()) as SharedFields
  } catch {
    return null
  }
}
