import { cleanText, normalizeTitle } from '@/domain/text'

export function tidyTags(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of values) {
    const tag = cleanText(raw)
    const key = normalizeTitle(tag)
    if (!tag || seen.has(key)) continue
    seen.add(key)
    out.push(tag)
  }
  return out
}
