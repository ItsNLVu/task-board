import { useCallback, useSyncExternalStore } from 'react'
import en from './locales/en.json'
import vi from './locales/vi.json'
import { localeStore, LOCALE_STORAGE_KEY } from './store'
import {
  SUPPORTED_LOCALES,
  type Locale,
  type TranslateFn,
  type TranslationKey,
  type TranslationParams,
  type TranslationSchema,
} from './types'

const DICTIONARIES: Record<Locale, TranslationSchema> = {
  vi,
  en,
}

function resolvePath(dict: TranslationSchema, key: TranslationKey): string {
  const parts = key.split('.')
  let current: unknown = dict
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return key
    }
  }
  return typeof current === 'string' ? current : key
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    token in params ? String(params[token]) : match,
  )
}

export function t(
  key: TranslationKey,
  params?: TranslationParams,
  locale: Locale = localeStore.get(),
): string {
  const dict = DICTIONARIES[locale]
  const raw = resolvePath(dict, key)
  return interpolate(raw, params)
}

export function useLocale(): Locale {
  return useSyncExternalStore(localeStore.subscribe, localeStore.get, () => 'vi')
}

export function useTranslation(): {
  locale: Locale
  setLocale: (next: Locale) => void
  toggleLocale: () => void
  t: TranslateFn
} {
  const locale = useLocale()
  const translate = useCallback<TranslateFn>((key, params) => t(key, params, locale), [locale])
  return {
    locale,
    setLocale: localeStore.set,
    toggleLocale: localeStore.toggle,
    t: translate,
  }
}

export {
  DICTIONARIES,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  localeStore,
  type Locale,
  type TranslateFn,
  type TranslationKey,
  type TranslationParams,
  type TranslationSchema,
}
