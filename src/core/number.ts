// Digits, with the separators numbers, dates, times and phone numbers are written with,
// optionally wrapped in punctuation, currency signs or a percent sign ("$1,200", "(14:30),").
const NUMBER = /^[^\p{L}\p{N}]*\d[\d.,:/'’–-]*[^\p{L}\p{N}]*$/u

export function isNumber(text: string): boolean {
  return NUMBER.test(text)
}

export function digitCount(text: string): number {
  return text.match(/\d/g)?.length ?? 0
}
