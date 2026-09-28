export const THEMES = ['system', 'light', 'dark'] as const
export const FONTS = ['sans', 'serif'] as const
export const SIZES = ['S', 'M', 'L', 'XL'] as const

export type Theme = (typeof THEMES)[number]
export type Font = (typeof FONTS)[number]
export type Size = (typeof SIZES)[number]

export interface Appearance {
  theme: Theme
  font: Font
  size: Size
}

export const DEFAULT_APPEARANCE: Appearance = { theme: 'system', font: 'sans', size: 'M' }

const SIZE_SCALE: Record<Size, number> = { S: 0.75, M: 1, L: 1.25, XL: 1.5 }

// Must match the backgrounds in app.css so the browser chrome blends with the page.
const THEME_COLORS = { light: '#f7f7f5', dark: '#121212' }

const APPEARANCE_KEY = 'speedreader.appearance'

// Each field falls back on its own, so one bad value never resets the others.
export function parseAppearance(stored: string | null): Appearance {
  let raw: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse(stored ?? '{}')
    if (parsed && typeof parsed === 'object') raw = parsed as Record<string, unknown>
  } catch {
    // Unreadable settings mean defaults.
  }
  return {
    theme: pick(THEMES, raw.theme, DEFAULT_APPEARANCE.theme),
    font: pick(FONTS, raw.font, DEFAULT_APPEARANCE.font),
    size: pick(SIZES, raw.size, DEFAULT_APPEARANCE.size),
  }
}

function pick<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback
}

export function loadAppearance(): Appearance {
  try {
    return parseAppearance(localStorage.getItem(APPEARANCE_KEY))
  } catch {
    return DEFAULT_APPEARANCE
  }
}

export function saveAppearance(appearance: Appearance): void {
  try {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance))
  } catch {
    // Not persisting is acceptable; the choice still applies until the app closes.
  }
}

export function applyAppearance({ theme, font, size }: Appearance, root = document.documentElement) {
  root.dataset.theme = theme
  root.dataset.font = font
  root.style.setProperty('--text-scale', String(SIZE_SCALE[size]))
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const scheme = meta.media.includes('dark') ? 'dark' : 'light'
    meta.content = THEME_COLORS[theme === 'system' ? scheme : theme]
  }
}
