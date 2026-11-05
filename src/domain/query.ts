import { isInDueRange, isOverdue, type DueRange } from './deadline'
import { fold, foldWithMap, type FoldedText } from './text'
import { PRIORITY_RANK, type Task, type TaskPriority, type TaskStatus } from './task'

export type SortKey = 'deadline' | 'created' | 'priority' | 'updated' | 'order'

export const SORT_KEYS: readonly SortKey[] = ['deadline', 'created', 'priority', 'updated', 'order']

export interface TaskQuery {
  q: string
  status: TaskStatus[]
  priority: TaskPriority[]
  tags: string[]
  due: DueRange | null
}

interface SearchIndex {
  title: FoldedText
  description: FoldedText
}

const searchCache = new WeakMap<Task, SearchIndex>()

export function getSearchIndex(task: Task): SearchIndex {
  let entry = searchCache.get(task)
  if (!entry) {
    entry = { title: foldWithMap(task.title), description: foldWithMap(task.description) }
    searchCache.set(task, entry)
  }
  return entry
}

export function foldQuery(q: string): string {
  return fold(q.trim().replace(/\s+/g, ' '))
}

export function hasActiveFilters(query: TaskQuery): boolean {
  return (
    query.q.trim() !== '' ||
    query.status.length > 0 ||
    query.priority.length > 0 ||
    query.tags.length > 0 ||
    query.due !== null
  )
}

export function filterTasks(tasks: readonly Task[], query: TaskQuery, now: number): Task[] {
  const needle = foldQuery(query.q)
  const statuses = new Set(query.status)
  const priorities = new Set(query.priority)
  const tags = new Set(query.tags.map((t) => t.toLocaleLowerCase('vi')))
  return tasks.filter((task) => {
    if (statuses.size && !statuses.has(task.status)) return false
    if (priorities.size && !priorities.has(task.priority)) return false
    if (tags.size && !task.tags.some((t) => tags.has(t.toLocaleLowerCase('vi')))) return false
    if (query.due && !isInDueRange(task, query.due, now)) return false
    if (needle) {
      const index = getSearchIndex(task)
      if (!index.title.text.includes(needle) && !index.description.text.includes(needle)) {
        return false
      }
    }
    return true
  })
}

const byCreatedDesc = (a: Task, b: Task) => b.createdAt.localeCompare(a.createdAt)
const byDeadlineAsc = (a: Task, b: Task) => Date.parse(a.deadline) - Date.parse(b.deadline)

export function sortTasks(tasks: readonly Task[], sort: SortKey): Task[] {
  const list = [...tasks]
  switch (sort) {
    case 'deadline':
      return list.sort((a, b) => {
        const doneA = a.status === 'done' ? 1 : 0
        const doneB = b.status === 'done' ? 1 : 0
        return doneA - doneB || byDeadlineAsc(a, b) || byCreatedDesc(a, b)
      })
    case 'created':
      return list.sort(byCreatedDesc)
    case 'priority':
      return list.sort(
        (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byDeadlineAsc(a, b),
      )
    case 'updated':
      return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    case 'order':
      return list.sort((a, b) => a.order - b.order)
  }
}

export interface TaskStats {
  total: number
  byStatus: Record<TaskStatus, number>
  overdue: number
  completionRate: number
}

export function computeStats(tasks: readonly Task[], now: number): TaskStats {
  const byStatus: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0 }
  let overdue = 0
  for (const t of tasks) {
    byStatus[t.status]++
    if (isOverdue(t, now)) overdue++
  }
  const total = tasks.length
  return {
    total,
    byStatus,
    overdue,
    completionRate: total === 0 ? 0 : Math.round((byStatus.done / total) * 100),
  }
}

export function collectTags(tasks: readonly Task[]): { tag: string; count: number }[] {
  const counts = new Map<string, { tag: string; count: number }>()
  for (const t of tasks) {
    for (const tag of t.tags) {
      const key = tag.toLocaleLowerCase('vi')
      const entry = counts.get(key)
      if (entry) entry.count++
      else counts.set(key, { tag, count: 1 })
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'vi'))
}

export function nowDividerIndex(sorted: readonly Task[], now: number): number {
  const index = sorted.findIndex((t) => t.status === 'done' || Date.parse(t.deadline) >= now)
  return index === -1 ? sorted.length : index
}
