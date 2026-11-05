const COMBINING_MARKS = /\p{M}/gu

export function normalizeTitle(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi')
}

export function cleanText(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ')
}

function foldChar(ch: string): string {
  const lower = ch.toLocaleLowerCase('vi')
  if (lower === 'đ') return 'd'
  return lower.normalize('NFD').replace(COMBINING_MARKS, '')
}

export interface FoldedText {
  text: string
  map: number[]
}

export function foldWithMap(input: string): FoldedText {
  let text = ''
  const map: number[] = []
  let index = 0
  for (const ch of input) {
    const folded = foldChar(ch)
    for (let k = 0; k < folded.length; k++) map.push(index)
    text += folded
    index += ch.length
  }
  map.push(index)
  return { text, map }
}

export function fold(input: string): string {
  return foldWithMap(input).text
}

export type Range = readonly [start: number, end: number]

export function findMatches(folded: FoldedText, foldedNeedle: string): Range[] {
  if (!foldedNeedle) return []
  const ranges: Range[] = []
  let from = 0
  for (;;) {
    const at = folded.text.indexOf(foldedNeedle, from)
    if (at === -1) break
    const end = at + foldedNeedle.length
    ranges.push([folded.map[at] ?? 0, folded.map[end] ?? folded.map.length - 1])
    from = end
  }
  return ranges
}

export function splitByRanges(
  text: string,
  ranges: readonly Range[],
): { text: string; match: boolean }[] {
  const parts: { text: string; match: boolean }[] = []
  let cursor = 0
  for (const [start, end] of ranges) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false })
    parts.push({ text: text.slice(start, end), match: true })
    cursor = end
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false })
  return parts
}
