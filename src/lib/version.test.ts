import { describe, expect, it } from 'vitest'
import { formatVersion } from './version'

describe('formatVersion', () => {
  it('shows the short commit and its date', () => {
    expect(formatVersion({ commit: '077fd5eeee68', date: '2026-09-28T14:25:34+02:00' })).toBe(
      'Version 077fd5e · 28 Sep 2026',
    )
  })

  it('shows only the commit when the date is missing or invalid', () => {
    expect(formatVersion({ commit: '077fd5e', date: '' })).toBe('Version 077fd5e')
    expect(formatVersion({ commit: '077fd5e', date: 'not a date' })).toBe('Version 077fd5e')
  })

  it('labels builds without git information as a development build', () => {
    expect(formatVersion({ commit: '', date: '' })).toBe('Development build')
  })
})
