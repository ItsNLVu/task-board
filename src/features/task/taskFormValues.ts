import { isoToLocalInput, localInputToMs } from '@/domain/deadline'
import type { TaskFormInput, TaskFormOutput } from '@/domain/schema'
import type { Task, TaskDraft, TaskStatus } from '@/domain/task'
import { readNow } from '@/lib/clock'

export function defaultValuesFor(
  task: Task | undefined,
  status: TaskStatus = 'todo',
): TaskFormInput {
  if (task) {
    return {
      title: task.title,
      description: task.description,
      deadline: isoToLocalInput(task.deadline),
      status: task.status,
      priority: task.priority,
      tags: [...task.tags],
      subtasks: task.subtasks.map((s) => ({ ...s })),
    }
  }
  const d = new Date(readNow() + 24 * 3_600_000)
  d.setMinutes(0, 0, 0)
  return {
    title: '',
    description: '',
    deadline: isoToLocalInput(d.toISOString()),
    status,
    priority: 'medium',
    tags: [],
    subtasks: [],
  }
}

export function toDraft(values: TaskFormOutput): TaskDraft {
  return {
    ...values,
    deadline: new Date(localInputToMs(values.deadline)).toISOString(),
  }
}
