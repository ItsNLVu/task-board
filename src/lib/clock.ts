import { useSyncExternalStore } from 'react'
import { TIME_MS } from '@/common'

type Listener = () => void

const listeners = new Set<Listener>()
let now = Date.now()
let timer: ReturnType<typeof setTimeout> | null = null

function tick() {
  now = Date.now()
  listeners.forEach((l) => l())
}

function schedule() {
  timer = setTimeout(
    () => {
      tick()
      schedule()
    },
    TIME_MS.minute - (Date.now() % TIME_MS.minute) + 50,
  )
}

function onVisibility() {
  if (document.visibilityState === 'visible') tick()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  if (listeners.size === 1) {
    now = Date.now()
    schedule()
    document.addEventListener('visibilitychange', onVisibility)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      if (timer) clearTimeout(timer)
      timer = null
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }
}

export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => now,
  )
}

export function readNow(): number {
  return Date.now()
}
