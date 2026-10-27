// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { articleFromHtml, textFromElement } from './article'
import { encodeCodeBlock } from './code'

const prose = (n: number) =>
  Array.from({ length: n }, (_, i) => `<p>Paragraph ${i} carries enough words, commas, and sentences to look like an article. It goes on a little longer, too.</p>`).join('')

function element(html: string): Element {
  return new DOMParser().parseFromString(html, 'text/html').body
}

describe('articleFromHtml', () => {
  it('keeps the article and its title, leaving out navigation and scripts', () => {
    const html = `<html><head><title>The Long Story of Reading | Site</title></head><body>
      <nav><a href="/">Home</a><a href="/about">About</a></nav>
      <article><h1>The Long Story of Reading</h1>${prose(6)}</article>
      <script>track()</script><footer>Copyright</footer></body></html>`
    const doc = articleFromHtml(html)
    expect(doc?.title).toBe('The Long Story of Reading')
    expect(doc?.text).toContain('Paragraph 0 carries enough words')
    expect(doc?.text).toContain('Paragraph 5')
    expect(doc?.text).not.toContain('About')
    expect(doc?.text).not.toContain('track()')
  })

  it('finds nothing on a page without an article', () => {
    expect(articleFromHtml('<html><body></body></html>')).toBeNull()
  })
})

describe('textFromElement', () => {
  it('separates paragraphs and headings with a blank line', () => {
    expect(textFromElement(element('<h2>Heading</h2><p>One   line\n here.</p><p>Two.</p>'))).toBe(
      'Heading\n\nOne line here.\n\nTwo.',
    )
  })

  it('puts list items and table rows on their own lines with a pause', () => {
    const html = '<p>Before.</p><ul><li>First</li><li>Second.</li></ul><table><tr><th>A</th><td>B</td></tr></table>'
    expect(textFromElement(element(html))).toBe('Before.\n\nFirst —\nSecond.\n\nA — B —')
  })

  it('keeps code as a code block with its language', () => {
    const html = '<p>Run it:</p><pre><code class="language-sh">npm install\nnpm test\n</code></pre><p>Done.</p>'
    expect(textFromElement(element(html))).toBe(
      `Run it:\n\n${encodeCodeBlock({ language: 'sh', source: 'npm install\nnpm test' })}\n\nDone.`,
    )
  })

  it('breaks lines at <br> and drops images', () => {
    expect(textFromElement(element('<p>Line one<br>line two<img alt="x"></p>'))).toBe('Line one\nline two')
  })
})
