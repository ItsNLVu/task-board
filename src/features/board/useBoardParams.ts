import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { STORAGE_KEYS } from '@/common'
import { safeStorage } from '@/lib/storage'
import {
  DEFAULT_PARAMS,
  parseBoardParams,
  serializeBoardParams,
  type BoardParams,
} from './boardParams'

const VIEW_KEY = STORAGE_KEYS.view

export function useBoardParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => parseBoardParams(searchParams), [searchParams])

  const update = useCallback(
    (patch: Partial<BoardParams>) => {
      setSearchParams((prev) => serializeBoardParams({ ...parseBoardParams(prev), ...patch }), {
        replace: true,
      })
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    update({ q: '', status: [], priority: [], tags: [], due: null })
  }, [update])

  return { params, update, clearFilters }
}

export function useViewPersistence() {
  const location = useLocation()
  const navigate = useNavigate()
  const restored = useRef(false)

  useEffect(() => {
    if (restored.current) return
    restored.current = true
    if (location.search) return
    const saved = safeStorage.get(VIEW_KEY)
    if (!saved) return
    const normalized = serializeBoardParams(parseBoardParams(new URLSearchParams(saved))).toString()
    if (normalized) {
      void navigate({ pathname: location.pathname, search: `?${normalized}` }, { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    if (!restored.current) return
    const normalized = serializeBoardParams(
      parseBoardParams(new URLSearchParams(location.search)),
    ).toString()
    safeStorage.set(VIEW_KEY, normalized)
  }, [location.search])
}

export { DEFAULT_PARAMS }
