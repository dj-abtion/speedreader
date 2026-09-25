import type { Token } from './tokenize'

export function sentenceStart(tokens: Token[], index: number): number {
  let i = index
  while (i > 0 && !tokens[i - 1].endsSentence) i--
  return i
}

export function previousSentenceStart(tokens: Token[], index: number): number {
  const start = sentenceStart(tokens, index)
  return start < index || start === 0 ? start : sentenceStart(tokens, start - 1)
}

export function nextSentenceStart(tokens: Token[], index: number): number {
  for (let i = index; i < tokens.length - 1; i++) {
    if (tokens[i].endsSentence) return i + 1
  }
  return index
}

export function sentenceEnd(tokens: Token[], index: number): number {
  let i = index
  while (i < tokens.length - 1 && !tokens[i].endsSentence) i++
  return i
}
