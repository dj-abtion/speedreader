import { describe, expect, it } from 'vitest'
import { parseShare } from './share'

const params = (query: string) => new URLSearchParams(query)

describe('parseShare', () => {
  it('returns nothing when no shared content is present', () => {
    expect(parseShare(params(''))).toEqual({ kind: 'none' })
    expect(parseShare(params('?text=%20%20'))).toEqual({ kind: 'none' })
  })

  it('turns shared text into a document, using the shared title when given', () => {
    expect(parseShare(params('?title=Article&text=Some%20words%20here.'))).toEqual({
      kind: 'document',
      document: { title: 'Article', text: 'Some words here.' },
    })
  })

  it('leaves the title empty when none is shared', () => {
    expect(parseShare(params('?text=Just%20text.'))).toEqual({
      kind: 'document',
      document: { title: '', text: 'Just text.' },
    })
  })

  it('rejects a bare link in the url field', () => {
    expect(parseShare(params('?title=Page&url=https%3A%2F%2Fexample.com%2Fa'))).toEqual({
      kind: 'link',
    })
  })

  it('rejects text that is only a link, as Android often sends it', () => {
    expect(parseShare(params('?text=https%3A%2F%2Fexample.com%2Fa'))).toEqual({ kind: 'link' })
  })

  it('keeps shared text that contains a link alongside real content', () => {
    const result = parseShare(params('?text=Read%20this%20later%20https%3A%2F%2Fexample.com'))
    expect(result).toEqual({
      kind: 'document',
      document: { title: '', text: 'Read this later https://example.com' },
    })
  })
})
