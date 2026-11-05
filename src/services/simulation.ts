import { SIMULATION_DEFAULTS, STORAGE_KEYS } from '@/common'
import { safeStorage } from '@/lib/storage'

const KEY = STORAGE_KEYS.simulation
export const SIMULATED_FAILURE_RATE = SIMULATION_DEFAULTS.failureRate

type Listener = () => void
const listeners = new Set<Listener>()
let enabled = safeStorage.get(KEY) === '1'

export const failureSimulation = {
  isEnabled: () => enabled,
  setEnabled: (value: boolean) => {
    enabled = value
    safeStorage.set(KEY, value ? '1' : '0')
    listeners.forEach((l) => l())
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  failureRate: () => (enabled ? SIMULATED_FAILURE_RATE : 0),
}
