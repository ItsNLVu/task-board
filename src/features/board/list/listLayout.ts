import type { Task, TaskStatus } from '@/domain/task'

export type Row = { kind: 'cards'; tasks: Task[] } | { kind: 'now' }

export const STATUS_DROP_PREFIX = 'list-status:'
export const statusDropId = (s: TaskStatus) => `${STATUS_DROP_PREFIX}${s}`

export function columnsFor(width: number): number {
  if (width >= 1400) return 4
  if (width >= 980) return 3
  if (width >= 620) return 2
  return 1
}

export function buildRows(tasks: readonly Task[], columns: number, divider: number | null): Row[] {
  const rows: Row[] = []
  const pushChunks = (slice: readonly Task[]) => {
    for (let i = 0; i < slice.length; i += columns) {
      rows.push({ kind: 'cards', tasks: slice.slice(i, i + columns) })
    }
  }
  if (divider === null) {
    pushChunks(tasks)
    return rows
  }
  pushChunks(tasks.slice(0, divider))
  rows.push({ kind: 'now' })
  pushChunks(tasks.slice(divider))
  return rows
}
