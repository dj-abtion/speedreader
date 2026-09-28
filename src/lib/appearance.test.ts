import { describe, expect, it } from 'vitest'
import { DEFAULT_APPEARANCE, parseAppearance } from './appearance'

describe('parseAppearance', () => {
  it('reads saved choices', () => {
    const saved = JSON.stringify({ theme: 'dark', font: 'serif', size: 'XL' })
    expect(parseAppearance(saved)).toEqual({ theme: 'dark', font: 'serif', size: 'XL' })
  })

  it('uses the defaults when nothing is saved or the value is unreadable', () => {
    expect(parseAppearance(null)).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance('not json')).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance('42')).toEqual(DEFAULT_APPEARANCE)
  })

  it('replaces only the fields that are invalid', () => {
    const saved = JSON.stringify({ theme: 'sepia', font: 'serif', size: 7 })
    expect(parseAppearance(saved)).toEqual({ theme: 'system', font: 'serif', size: 'M' })
  })
})
