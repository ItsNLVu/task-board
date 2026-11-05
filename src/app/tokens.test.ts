import css from './theme.css?raw'
import { DARK_TOKENS, LIGHT_TOKENS } from './tokens'

function readSelectorTokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf('}', start))
  const vars: Record<string, string> = {}
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,8})\s*;/gi)) {
    if (name && value) vars[name] = value.toLowerCase()
  }
  return vars
}

describe('design tokens', () => {
  it('theme.css and tokens.ts define the same Light palette', () => {
    expect(readSelectorTokens(':root')).toEqual(LIGHT_TOKENS)
  })

  it('theme.css and tokens.ts define the same Dark palette', () => {
    expect(readSelectorTokens(":root[data-theme='dark']")).toEqual(DARK_TOKENS)
  })
})
