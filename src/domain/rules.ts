import { normalizeTitle } from './text'
import type { Task, TaskStatus } from './task'

export function findTitleConflict(
  tasks: readonly Pick<Task, 'id' | 'title' | 'status'>[],
  title: string,
  selfId?: string,
): Pick<Task, 'id' | 'title' | 'status'> | undefined {
  const key = normalizeTitle(title)
  return tasks.find(
    (t) => t.id !== selfId && t.status !== 'done' && normalizeTitle(t.title) === key,
  )
}

export function completedAtFor(
  previous: Pick<Task, 'status' | 'completedAt'> | null,
  nextStatus: TaskStatus,
  nowIso: string,
): string | null {
  if (nextStatus !== 'done') return null
  if (previous?.status === 'done' && previous.completedAt) return previous.completedAt
  return nowIso
}
