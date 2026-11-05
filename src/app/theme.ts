import { useSyncExternalStore } from 'react'
import { STORAGE_KEYS } from '@/common'
import { safeStorage } from '@/lib/storage'
import type { ThemeMode } from './tokens'

export const THEME_STORAGE_KEY = STORAGE_KEYS.theme
const listeners = new Set<() => void>()

function readInitialTheme(): ThemeMode {
  const saved = safeStorage.get(THEME_STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return 'light'
}

let currentTheme: ThemeMode = readInitialTheme()

function applyDomTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

applyDomTheme(currentTheme)

function notifyTheme() {
  for (const fn of listeners) fn()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== THEME_STORAGE_KEY) return
    const next: ThemeMode = e.newValue === 'dark' ? 'dark' : 'light'
    if (next !== currentTheme) {
      currentTheme = next
      applyDomTheme(currentTheme)
      notifyTheme()
    }
  })
}

export const themeStore = {
  get: (): ThemeMode => currentTheme,
  set: (next: ThemeMode) => {
    if (next === currentTheme) return
    currentTheme = next
    applyDomTheme(currentTheme)
    safeStorage.set(THEME_STORAGE_KEY, currentTheme)
    notifyTheme()
  },
  toggle: () => {
    themeStore.set(currentTheme === 'dark' ? 'light' : 'dark')
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(themeStore.subscribe, themeStore.get, () => 'light')
}

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

function subscribeMotion(listener: () => void) {
  motionQuery.addEventListener('change', listener)
  return () => {
    motionQuery.removeEventListener('change', listener)
  }
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => motionQuery.matches,
    () => false,
  )
}
