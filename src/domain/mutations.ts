import { orderAtEnd, planMove, type MoveTarget } from './order'
import { completedAtFor } from './rules'
import type { Task, TaskDraft } from './task'

export function buildNewTask(
  draft: TaskDraft,
  id: string,
  tasks: readonly Task[],
  nowIso: string,
): Task {
  return {
    id,
    ...draft,
    order: orderAtEnd(tasks, draft.status),
    createdAt: nowIso,
    updatedAt: nowIso,
    completedAt: completedAtFor(null, draft.status, nowIso),
  }
}

export function applyUpdate(
  task: Task,
  patch: Partial<TaskDraft>,
  tasks: readonly Task[],
  nowIso: string,
): Task {
  const status = patch.status ?? task.status
  const statusChanged = status !== task.status
  return {
    ...task,
    ...patch,
    status,
    order: statusChanged ? orderAtEnd(tasks, status, task.id) : task.order,
    completedAt: completedAtFor(task, status, nowIso),
    updatedAt: nowIso,
  }
}

export function applyMove(
  tasks: readonly Task[],
  taskId: string,
  target: MoveTarget,
  nowIso: string,
): Task[] {
  const task = tasks.find((t) => t.id === taskId)
  if (!task) return []
  const plan = planMove(tasks, taskId, target)
  const moved: Task = {
    ...task,
    status: target.status,
    order: plan.order,
    completedAt: completedAtFor(task, target.status, nowIso),
    updatedAt: nowIso,
  }
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const renumbered = plan.renumbered.flatMap(({ id, order }) => {
    const t = byId.get(id)
    return t ? [{ ...t, order }] : []
  })
  return [moved, ...renumbered]
}
