import { SearchOutlined } from '@ant-design/icons'
import { Input, type InputRef } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { UI_TIMINGS } from '@/common'
import { useTranslation } from '@/i18n'
import { useBoardParams } from './useBoardParams'

export const SEARCH_INPUT_ID = 'board-search'

export function SearchInput() {
  const { params, update } = useBoardParams()
  const { t } = useTranslation()
  const [value, setValue] = useState(params.q)
  const lastSent = useRef(params.q)
  const inputRef = useRef<InputRef>(null)

  useEffect(() => {
    if (params.q !== lastSent.current) {
      lastSent.current = params.q
      setValue(params.q)
    }
  }, [params.q])

  useEffect(() => {
    if (value === lastSent.current) return
    const timer = setTimeout(() => {
      lastSent.current = value
      update({ q: value })
    }, UI_TIMINGS.searchDebounceMs)
    return () => {
      clearTimeout(timer)
    }
  }, [value, update])

  return (
    <Input
      ref={inputRef}
      id={SEARCH_INPUT_ID}
      size="small"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        if (value) {
          e.preventDefault()
          setValue('')
        } else {
          inputRef.current?.blur()
        }
      }}
      allowClear
      prefix={<SearchOutlined aria-hidden className="text-[12px] text-ink-3" />}
      placeholder={t('topBar.searchPlaceholder')}
      aria-label={t('topBar.searchAria')}
      autoComplete="off"
      spellCheck={false}
    />
  )
}
