// Code blocks travel inside a document's text between two private-use characters, so they
// survive storage and links, yet can't be confused with anything a person would type. The
// opening marker is followed by the language (possibly empty) and a newline, then the code.
const START = ''
const END = ''
export const CODE_BLOCK_LABEL = '(code block)'
export const CODE_BLOCK = /([^\n]*)\n([\s\S]*?)/g

export interface CodeBlock {
  language: string
  source: string
}

export function encodeCodeBlock({ language, source }: CodeBlock): string {
  return `${START}${language.replace(/[\n]/g, '')}\n${source.replace(/[]/g, '')}${END}`
}

export function withoutCode(text: string): string {
  return text.replace(CODE_BLOCK, CODE_BLOCK_LABEL)
}
