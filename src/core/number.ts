// Digits, with the separators numbers, dates, times and phone numbers are written with,
// optionally wrapped in punctuation, currency signs or a percent sign ("$1,200", "(14:30),").
const NUMBER = /^[^\p{L}\p{N}]*\d[\d.,:/'’–-]*[^\p{L}\p{N}]*$/u

export function isNumber(text: string): boolean {
  return NUMBER.test(text)
}

export function digitCount(text: string): number {
  return text.match(/\d/g)?.length ?? 0
}

// Units a number is read together with. Lowercased; words that are also common English or
// Danish words ("a", "in", "t") are left out so "5 a day" isn't read as a quantity.
const UNITS = new Set([
  'mm', 'cm', 'm', 'km', 'ft', 'yd', 'mi', 'mg', 'g', 'kg', 'lb', 'lbs', 'oz',
  'ml', 'cl', 'dl', 'l', 'ms', 'sec', 'min', 'hr', 'hrs', 'kb', 'mb', 'gb', 'tb',
  'w', 'kw', 'kwh', 'mw', 'v', 'hz', 'khz', 'mhz', 'ghz', 'mph', 'km/h', 'km/t',
  '%', '°', '°c', '°f', 'kr', 'dkk', 'nok', 'sek', 'usd', 'eur', 'gbp', 'stk',
])

export function isUnit(text: string): boolean {
  return UNITS.has(text.toLowerCase().replace(/[.,;:!?)\]"'”’»]+$/u, ''))
}
