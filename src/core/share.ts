import type { NewDocument } from './document'

export type ShareResult =
  | { kind: 'none' }
  | { kind: 'link' }
  | { kind: 'document'; document: NewDocument }

const URL_ONLY = /^https?:\/\/\S+$/i

// Share-target params arrive as ?title=&text=&url=. Links can't be fetched without a backend,
// so a share that carries nothing but a link is reported rather than read as a one-word text.
export function parseShare(params: URLSearchParams): ShareResult {
  const title = params.get('title')?.trim() ?? ''
  const text = params.get('text')?.trim() ?? ''
  const url = params.get('url')?.trim() ?? ''

  if (text && !URL_ONLY.test(text)) return { kind: 'document', document: { title, text } }
  if (text || url) return { kind: 'link' }
  return { kind: 'none' }
}
