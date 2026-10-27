import { Readability } from '@mozilla/readability'
import { encodeCodeBlock } from './code'
import { withPause, type NewDocument } from './document'

const BLOCKS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DD', 'DETAILS', 'DIV', 'DL', 'DT', 'FIGCAPTION', 'FIGURE',
  'FOOTER', 'FORM', 'HEADER', 'HR', 'MAIN', 'NAV', 'P', 'SECTION', 'SUMMARY',
])
const HEADINGS = /^H[1-6]$/
const SKIPPED = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'MATH', 'IMG', 'PICTURE', 'VIDEO', 'AUDIO', 'IFRAME', 'BUTTON'])

type Gap = '' | '\n' | '\n\n'

// Picks the article out of a fetched page, as a browser's reader view does, and lays it out the
// way stripped Markdown is: paragraphs and headings apart, list items and table rows on their own
// lines with a clause pause, and code kept as a code block.
export function articleFromHtml(html: string): NewDocument | null {
  const page = new DOMParser().parseFromString(html, 'text/html')
  const fallbackTitle = page.title.trim()
  const article = new Readability(page).parse()
  if (!article?.content) return null
  const body = new DOMParser().parseFromString(article.content, 'text/html').body
  const text = textFromElement(body)
  if (!text) return null
  return { title: article.title?.trim() || fallbackTitle, text }
}

export function textFromElement(root: Element): string {
  let out = ''
  let line = ''
  let gap: Gap = ''

  const wider = (a: Gap, b: Gap): Gap => (b.length > a.length ? b : a)
  const emit = (text: string) => {
    out += (out ? gap : '') + text
    gap = ''
  }
  const end = (after: Gap, pause = false) => {
    const text = line.replace(/\s+/g, ' ').trim()
    line = ''
    if (text) emit(pause ? withPause(text) : text)
    gap = wider(gap, after)
  }

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      line += node.textContent ?? ''
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const element = node as Element
    const tag = element.tagName.toUpperCase()
    if (SKIPPED.has(tag)) return
    if (tag === 'BR') return end('\n')
    if (tag === 'PRE') {
      end('\n\n')
      const language = /(?:^|\s)(?:language|lang)-(\S+)/.exec(element.querySelector('code')?.className ?? '')?.[1]
      emit(encodeCodeBlock({ language: language ?? '', source: (element.textContent ?? '').replace(/\n$/, '') }))
      gap = '\n\n'
      return
    }
    if (tag === 'LI' || tag === 'TR' || tag === 'DT') {
      end('\n')
      if (tag === 'TR') line = [...element.children].map((cell) => cell.textContent?.trim()).filter(Boolean).join(' — ')
      else element.childNodes.forEach(walk)
      return end('\n', true)
    }
    if (tag === 'UL' || tag === 'OL' || tag === 'TABLE') {
      end('\n\n')
      element.childNodes.forEach(walk)
      return end('\n\n')
    }
    const block = BLOCKS.has(tag) || HEADINGS.test(tag)
    if (block) end('\n\n')
    element.childNodes.forEach(walk)
    if (block) end('\n\n')
  }

  walk(root)
  end('')
  return out
}
