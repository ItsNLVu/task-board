import { format } from 'date-fns'

export const TIME_MS = {
  second: 1_000,
  minute: 60_000,
  hour: 60 * 60_000,
  day: 24 * 60 * 60_000,
} as const

export const DATE_TIME_FORMATS = {
  exactDateFns: 'HH:mm, dd/MM/yyyy',
  exactDayjs: 'HH:mm, DD/MM/YYYY',
  shortDate: 'dd/MM',
  time24h: 'HH:mm',
  localInputDateFns: "yyyy-MM-dd'T'HH:mm",
  localInputDayjs: 'YYYY-MM-DDTHH:mm',
  fileStamp: 'yyyyMMdd-HHmm',
} as const

const LOCAL_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

export function formatExactDateTime(value: string | number | Date): string {
  return format(new Date(value), DATE_TIME_FORMATS.exactDateFns)
}

export function formatShortDate(value: string | number | Date): string {
  return format(new Date(value), DATE_TIME_FORMATS.shortDate)
}

export function formatTime24h(value: string | number | Date): string {
  return format(new Date(value), DATE_TIME_FORMATS.time24h)
}

export function formatFileStamp(value: string | number | Date): string {
  return format(new Date(value), DATE_TIME_FORMATS.fileStamp)
}

export function isoToLocalInput(iso: string): string {
  return format(new Date(iso), DATE_TIME_FORMATS.localInputDateFns)
}

export function localInputToMs(value: string): number {
  if (!LOCAL_INPUT_PATTERN.test(value)) return Number.NaN
  return new Date(value).getTime()
}
