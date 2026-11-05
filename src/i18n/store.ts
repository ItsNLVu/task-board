import { STORAGE_KEYS } from '@/common'
import { safeStorage } from '@/lib/storage'
import type { Locale } from './types'

export const LOCALE_STORAGE_KEY = STORAGE_KEYS.locale

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'vi'
  const stored = safeStorage.get(LOCALE_STORAGE_KEY)
  return stored === 'en' ? 'en' : 'vi'
}

function applyLocaleAttribute(locale: Locale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
}

let currentLocale: Locale = readStoredLocale()
applyLocaleAttribute(currentLocale)

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== LOCALE_STORAGE_KEY) return
    const next: Locale = event.newValue === 'en' ? 'en' : 'vi'
    if (next === currentLocale) return
    currentLocale = next
    applyLocaleAttribute(currentLocale)
    emit()
  })
}

export const localeStore = {
  get: (): Locale => currentLocale,
  set: (next: Locale) => {
    if (next === currentLocale) return
    currentLocale = next
    safeStorage.set(LOCALE_STORAGE_KEY, next)
    applyLocaleAttribute(next)
    emit()
  },
  toggle: () => {
    localeStore.set(currentLocale === 'vi' ? 'en' : 'vi')
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
