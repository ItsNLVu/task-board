import type vi from './locales/vi.json'

export const SUPPORTED_LOCALES = ['vi', 'en'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export type TranslationSchema = typeof vi

export type NestedKeyOf<T extends object> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown> ? `${K}.${NestedKeyOf<T[K]>}` : K
}[keyof T & string]

export type TranslationKey = NestedKeyOf<TranslationSchema>

export type TranslationParams = Record<string, string | number>

export type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string
