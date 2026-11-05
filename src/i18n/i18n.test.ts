import { afterEach, describe, expect, it } from 'vitest'
import { DICTIONARIES, LOCALE_STORAGE_KEY, localeStore, t } from './index'

function collectLeafEntries(obj: Record<string, unknown>, prefix = ''): Map<string, string> {
  const result = new Map<string, string>()
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [childKey, childVal] of collectLeafEntries(v as Record<string, unknown>, path)) {
        result.set(childKey, childVal)
      }
    } else if (typeof v === 'string') {
      result.set(path, v)
    }
  }
  return result
}

function extractPlaceholders(str: string): string[] {
  return [...str.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort()
}

describe('i18n JSON + TypeScript dictionary parity & runtime store', () => {
  afterEach(() => {
    localeStore.set('vi')
  })

  it('maintains 100% key parity between vi.json and en.json', () => {
    const viLeaves = collectLeafEntries(DICTIONARIES.vi)
    const enLeaves = collectLeafEntries(DICTIONARIES.en)

    expect([...enLeaves.keys()].sort()).toEqual([...viLeaves.keys()].sort())
    expect(viLeaves.size).toBeGreaterThan(150)

    for (const [key, val] of viLeaves) {
      expect(val.trim().length, `Empty vi translation for ${key}`).toBeGreaterThan(0)
    }
    for (const [key, val] of enLeaves) {
      expect(val.trim().length, `Empty en translation for ${key}`).toBeGreaterThan(0)
    }
  })

  it('preserves identical {placeholder} tokens across vi.json and en.json', () => {
    const viLeaves = collectLeafEntries(DICTIONARIES.vi)
    const enLeaves = collectLeafEntries(DICTIONARIES.en)

    for (const [key, viVal] of viLeaves) {
      const enVal = enLeaves.get(key) ?? ''
      expect(extractPlaceholders(enVal), `Mismatched placeholders for key "${key}"`).toEqual(
        extractPlaceholders(viVal),
      )
    }
  })

  it('interpolates parameters and switches between vi and en', () => {
    expect(localeStore.get()).toBe('vi')
    expect(t('taskCard.subtaskProgressTitle', { done: 3, total: 5 })).toBe(
      '3 trên 5 việc con đã xong',
    )

    localeStore.toggle()
    expect(localeStore.get()).toBe('en')
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(t('taskCard.subtaskProgressTitle', { done: 3, total: 5 })).toBe(
      '3 of 5 subtasks completed',
    )
  })
})
