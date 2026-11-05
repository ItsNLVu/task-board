import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/store'
import { requestCardFocus } from '@/store/uiSlice'
import { SEARCH_INPUT_ID } from './SearchInput'

export function useCardFocusReturn(scrollTo: (taskId: string) => boolean) {
  const focusTaskId = useAppSelector((s) => s.ui.focusTaskId)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!focusTaskId) return
    dispatch(requestCardFocus(null))
    const found = scrollTo(focusTaskId)
    let frame = 0
    let attempts = 0
    const tryFocus = () => {
      const link = document.querySelector<HTMLElement>(`[data-task-link="${focusTaskId}"]`)
      if (link) {
        link.focus({ preventScroll: !found })
        return
      }
      if (found && attempts++ < 5) {
        frame = requestAnimationFrame(tryFocus)
        return
      }
      document.getElementById(SEARCH_INPUT_ID)?.focus()
    }
    frame = requestAnimationFrame(tryFocus)
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [focusTaskId, dispatch, scrollTo])
}
