import { readableText, type NewDocument } from './document'

export type ShareResult =
  | { kind: 'none' }
  | { kind: 'link'; url: string }
  | { kind: 'document'; document: NewDocument }

const URL_ONLY = /^https?:\/\/\S+$/i

// Share-target params arrive as ?title=&text=&url=. A share that carries nothing but a link is
// a page to fetch, not a one-word text. Android often puts the link in the text field.
export function parseShare(params: URLSearchParams): ShareResult {
  const title = params.get('title')?.trim() ?? ''
  const text = params.get('text')?.trim() ?? ''
  const url = params.get('url')?.trim() ?? ''

  if (text && !URL_ONLY.test(text)) return { kind: 'document', document: { title, text: readableText(text) } }
  if (URL_ONLY.test(url)) return { kind: 'link', url }
  if (text) return { kind: 'link', url: text }
  return { kind: 'none' }
}
