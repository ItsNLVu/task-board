import { describe, expect, it } from 'vitest'
import {
  DATE_TIME_FORMATS,
  formatExactDateTime,
  formatFileStamp,
  formatShortDate,
  formatTime24h,
  isoToLocalInput,
  localInputToMs,
  SEED_PRESETS,
  STORAGE_KEYS,
  TIME_MS,
  UI_TIMINGS,
} from './index'

describe('common shared utilities and constants', () => {
  it('formats dates and times consistently with DATE_TIME_FORMATS', () => {
    const sample = new Date(2026, 10, 5, 14, 30, 0) // Local 05/11/2026 14:30
    expect(formatExactDateTime(sample)).toBe('14:30, 05/11/2026')
    expect(formatShortDate(sample)).toBe('05/11')
    expect(formatTime24h(sample)).toBe('14:30')
    expect(formatFileStamp(sample)).toBe('20261105-1430')
    expect(isoToLocalInput(sample.toISOString())).toBe('2026-11-05T14:30')
  })

  it('parses local datetime input strings and rejects malformed values', () => {
    const ms = localInputToMs('2026-11-05T14:30')
    expect(Number.isNaN(ms)).toBe(false)
    expect(formatExactDateTime(ms)).toBe('14:30, 05/11/2026')
    expect(Number.isNaN(localInputToMs('invalid'))).toBe(true)
  })

  it('exposes consistent storage keys, timings, and format tokens', () => {
    expect(DATE_TIME_FORMATS.exactDateFns).toBe('HH:mm, dd/MM/yyyy')
    expect(DATE_TIME_FORMATS.exactDayjs).toBe('HH:mm, DD/MM/YYYY')
    expect(STORAGE_KEYS.tasks).toBe('taskboard:v1:tasks')
    expect(TIME_MS.day).toBe(86_400_000)
    expect(UI_TIMINGS.searchDebounceMs).toBe(300)
    expect(SEED_PRESETS.sampleCount).toBe(50)
  })
})
