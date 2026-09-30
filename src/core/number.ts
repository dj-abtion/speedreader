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

// A number in the millions or more can't be sized at a glance, as that means counting its digit
// groups, so it's read one group at a time with the group's scale word:
// "3,847,221" reads "3 million", "847 thousand", "221". The text's language isn't known, so the
// thousands separator stands in for it: "." is taken as Danish, "," as English.
const GROUPED =
  /^(?<before>[^\p{L}\p{N}]*)(?<groups>\d{1,3}(?<separator>[,.])\d{3}(?:\k<separator>\d{3})+)(?<decimals>[.,]\d+)?(?<after>[^\p{L}\p{N}]*)$/u

type Scale = [one: string, many: string]

const ENGLISH_SCALES: Scale[] = [
  ['thousand', 'thousand'],
  ['million', 'million'],
  ['billion', 'billion'],
  ['trillion', 'trillion'],
]

// Danish counts in long scale, so a milliard is 10⁹ and a billion 10¹².
const DANISH_SCALES: Scale[] = [
  ['tusind', 'tusind'],
  ['million', 'millioner'],
  ['milliard', 'milliarder'],
  ['billion', 'billioner'],
]

/** The flashes a large number is read in, or null for a number that's read whole. */
export function numberParts(text: string): string[] | null {
  const match = GROUPED.exec(text)
  if (!match?.groups) return null
  const { before, groups, separator, decimals = '', after } = match.groups
  if (decimals.startsWith(separator)) return null
  const scales = separator === '.' ? DANISH_SCALES : ENGLISH_SCALES
  const values = groups.split(separator).map(Number)
  if (values.length > scales.length + 1 || values[0] === 0) return null

  const parts = values.flatMap((value, i) => {
    const scale = scales[values.length - 2 - i]
    if (!scale) return [`${value}${decimals}`]
    return value === 0 ? [] : [`${value} ${scale[value === 1 ? 0 : 1]}`]
  })
  if (values.at(-1) === 0 && !decimals) parts.pop()
  parts[0] = before + parts[0]
  parts[parts.length - 1] += after
  return parts
}
