import type { Task } from '@/domain/task'

let counter = 0

export const NOW = new Date('2026-11-05T10:00:00.000Z').getTime()

export function makeTask(overrides: Partial<Task> = {}): Task {
  counter++
  const hex = counter.toString(16).padStart(12, '0')
  return {
    id: `00000000-0000-4000-8000-${hex}`,
    title: `Task số ${counter}`,
    description: '',
    deadline: new Date(NOW + 3 * 86_400_000).toISOString(),
    status: 'todo',
    priority: 'medium',
    tags: [],
    subtasks: [],
    order: counter * 1024,
    createdAt: new Date(NOW - 86_400_000).toISOString(),
    updatedAt: new Date(NOW - 86_400_000).toISOString(),
    completedAt: null,
    ...overrides,
  }
}
