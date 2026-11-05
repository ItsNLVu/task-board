import { endOfDay, endOfWeek, startOfDay, startOfWeek } from 'date-fns'
import {
  formatExactDateTime,
  formatShortDate,
  isoToLocalInput,
  localInputToMs,
  TIME_MS,
} from '@/common'
import { t } from '@/i18n'
import type { Task } from './task'

const { minute: MINUTE, hour: HOUR, day: DAY } = TIME_MS

export const DEADLINE_GRACE_MS = MINUTE

export function isPastDeadline(deadlineMs: number, now: number): boolean {
  return deadlineMs < now - DEADLINE_GRACE_MS
}

export type DeadlineState = 'done' | 'overdue' | 'soon' | 'normal'

export function getDeadlineState(
  task: Pick<Task, 'status' | 'deadline'>,
  now: number,
): DeadlineState {
  if (task.status === 'done') return 'done'
  const diff = Date.parse(task.deadline) - now
  if (diff < 0) return 'overdue'
  if (diff < DAY) return 'soon'
  return 'normal'
}

export function isOverdue(task: Pick<Task, 'status' | 'deadline'>, now: number): boolean {
  return getDeadlineState(task, now) === 'overdue'
}

function amount(abs: number): string {
  if (abs < HOUR)
    return t('domain.deadline.unitMinute', { count: Math.max(1, Math.floor(abs / MINUTE)) })
  if (abs < DAY) return t('domain.deadline.unitHour', { count: Math.floor(abs / HOUR) })
  const days = Math.floor(abs / DAY)
  if (days < 30) return t('domain.deadline.unitDay', { count: days })
  if (days < 365) return t('domain.deadline.unitMonth', { count: Math.floor(days / 30) })
  return t('domain.deadline.unitYear', { count: Math.floor(days / 365) })
}

export function formatOverdueDuration(deadline: string, now: number): string {
  const abs = Math.abs(Date.parse(deadline) - now)
  return abs < MINUTE ? t('domain.deadline.justOverdue') : amount(abs)
}

export function formatRelativeDeadline(deadline: string, now: number): string {
  const diff = Date.parse(deadline) - now
  const abs = Math.abs(diff)
  if (diff >= 0) {
    return abs < MINUTE
      ? t('domain.deadline.underMinuteLeft')
      : t('domain.deadline.timeLeft', { amount: amount(abs) })
  }
  return abs < MINUTE
    ? t('domain.deadline.justOverdue')
    : t('domain.deadline.timeOverdue', { amount: amount(abs) })
}

export { formatExactDateTime as formatExact, formatShortDate, isoToLocalInput, localInputToMs }

export type DueRange = 'today' | 'week' | 'overdue'

export const DUE_RANGES: readonly DueRange[] = ['today', 'week', 'overdue']

export function isInDueRange(
  task: Pick<Task, 'status' | 'deadline'>,
  range: DueRange,
  now: number,
): boolean {
  const ms = Date.parse(task.deadline)
  switch (range) {
    case 'today':
      return ms >= startOfDay(now).getTime() && ms <= endOfDay(now).getTime()
    case 'week':
      return (
        ms >= startOfWeek(now, { weekStartsOn: 1 }).getTime() &&
        ms <= endOfWeek(now, { weekStartsOn: 1 }).getTime()
      )
    case 'overdue':
      return isOverdue(task, now)
  }
}
