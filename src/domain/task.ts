export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  deadline: string
  status: TaskStatus
  priority: TaskPriority
  tags: string[]
  subtasks: Subtask[]
  order: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type TaskDraft = Pick<
  Task,
  'title' | 'description' | 'deadline' | 'status' | 'priority' | 'tags' | 'subtasks'
>

export const LIMITS = {
  titleMin: 3,
  titleMax: 120,
  descriptionMax: 2000,
  tagsMax: 5,
  tagMax: 20,
  subtasksMax: 50,
  subtaskTitleMax: 200,
} as const

export const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export const PRIORITIES_DESC: readonly TaskPriority[] = ['urgent', 'high', 'medium', 'low']
