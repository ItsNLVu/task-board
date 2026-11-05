export const UI_TIMINGS = {
  searchDebounceMs: 300,
  undoDeleteWindowMs: 5_000,
  tooltipDelayFast: 0.2,
  tooltipDelay: 0.3,
  tooltipDelaySlow: 0.4,
} as const

export const SEED_PRESETS = {
  sampleCount: 50,
  stressTestCount: 1_000,
} as const

export const SIMULATION_DEFAULTS = {
  failureRate: 0.3,
  minLatencyMs: 90,
  maxLatencyMs: 240,
} as const
