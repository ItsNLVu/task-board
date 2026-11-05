import type { Task, TaskStatus } from './task'

export const ORDER_STEP = 1024
const MIN_GAP = 1e-6

export function columnOf(tasks: readonly Task[], status: TaskStatus, excludeId?: string): Task[] {
  return tasks
    .filter((t) => t.status === status && t.id !== excludeId)
    .sort((a, b) => a.order - b.order)
}

export function orderBetween(before: number | undefined, after: number | undefined): number | null {
  if (before === undefined && after === undefined) return ORDER_STEP
  if (before === undefined) return (after as number) - ORDER_STEP
  if (after === undefined) return before + ORDER_STEP
  if (after - before < MIN_GAP) return null
  return (before + after) / 2
}

export function orderAtEnd(tasks: readonly Task[], status: TaskStatus, excludeId?: string): number {
  const column = columnOf(tasks, status, excludeId)
  const last = column[column.length - 1]
  return last ? last.order + ORDER_STEP : ORDER_STEP
}

export interface MoveTarget {
  status: TaskStatus
  prevId?: string | null
  nextId?: string | null
}

export interface MovePlan {
  order: number
  renumbered: { id: string; order: number }[]
}

export function planMove(tasks: readonly Task[], taskId: string, target: MoveTarget): MovePlan {
  const column = columnOf(tasks, target.status, taskId)
  const prev = target.prevId ? column.find((t) => t.id === target.prevId) : undefined
  const next = target.nextId ? column.find((t) => t.id === target.nextId) : undefined

  let before = prev?.order
  let after = next?.order
  if (prev && !next) after = column[column.indexOf(prev) + 1]?.order
  if (next && !prev) before = column[column.indexOf(next) - 1]?.order
  if (!prev && !next) before = column[column.length - 1]?.order

  const order = orderBetween(before, after)
  if (order !== null) return { order, renumbered: [] }

  const insertAt = next ? column.indexOf(next) : prev ? column.indexOf(prev) + 1 : column.length
  const ids = column.map((t) => t.id)
  ids.splice(insertAt, 0, taskId)
  const renumbered: { id: string; order: number }[] = []
  let movedOrder = ORDER_STEP
  ids.forEach((id, i) => {
    const value = (i + 1) * ORDER_STEP
    if (id === taskId) movedOrder = value
    else renumbered.push({ id, order: value })
  })
  return { order: movedOrder, renumbered }
}
