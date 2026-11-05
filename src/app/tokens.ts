export const LIGHT_TOKENS = {
  bg: '#f7f8fa',
  panel: '#ffffff',
  'panel-2': '#f2f3f7',
  line: '#e6e8ee',
  'line-strong': '#9499a6',
  ink: '#16181d',
  'ink-2': '#525662',
  'ink-3': '#686d7a',
  accent: '#5e6ad2',
  'accent-ink': '#ffffff',
  'accent-soft': '#eef0ff',
  danger: '#c81e1e',
  'danger-soft': '#fef2f2',
  warning: '#b45309',
  'warning-soft': '#fffbeb',
  'p-high': '#c2410c',
  'p-high-soft': '#fff7ed',
  'p-medium': '#1d4ed8',
  'p-medium-soft': '#eff6ff',
  'p-low': '#525662',
  'p-low-soft': '#f2f3f7',
  mark: '#fde68a',
} as const

export const DARK_TOKENS: Record<keyof typeof LIGHT_TOKENS, string> = {
  bg: '#0f1115',
  panel: '#16181d',
  'panel-2': '#1e2128',
  line: '#262932',
  'line-strong': '#5a6070',
  ink: '#f3f4f6',
  'ink-2': '#9ca3af',
  'ink-3': '#6b7280',
  accent: '#6e78ff',
  'accent-ink': '#ffffff',
  'accent-soft': '#1e2248',
  danger: '#f87171',
  'danger-soft': '#2d1619',
  warning: '#fbbf24',
  'warning-soft': '#2b2111',
  'p-high': '#fb923c',
  'p-high-soft': '#2c1a12',
  'p-medium': '#60a5fa',
  'p-medium-soft': '#17233b',
  'p-low': '#9ca3af',
  'p-low-soft': '#1e2128',
  mark: '#5b4612',
} as const

export const TOKENS = LIGHT_TOKENS

export type TokenKey = keyof typeof LIGHT_TOKENS
export type ThemeMode = 'light' | 'dark'

export const FONT_SANS = "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif"
export const FONT_MONO = "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace"
