import { DUE_RANGES, type DueRange } from '@/domain/deadline'
import { SORT_KEYS, type SortKey, type TaskQuery } from '@/domain/query'
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from '@/domain/task'

export type ViewMode = 'list' | 'kanban'

export interface BoardParams extends TaskQuery {
  view: ViewMode
  sort: SortKey
}

export const DEFAULT_PARAMS: BoardParams = {
  view: 'list',
  sort: 'deadline',
  q: '',
  status: [],
  priority: [],
  tags: [],
  due: null,
}

function list(value: string | null): string[] {
  return value
    ? value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    : []
}

function oneOf<T extends string>(options: readonly T[], value: string | null): T | null {
  return value !== null && (options as readonly string[]).includes(value) ? (value as T) : null
}

export function parseBoardParams(search: URLSearchParams): BoardParams {
  return {
    view: oneOf<ViewMode>(['list', 'kanban'], search.get('view')) ?? DEFAULT_PARAMS.view,
    sort: oneOf<SortKey>(SORT_KEYS, search.get('sort')) ?? DEFAULT_PARAMS.sort,
    q: search.get('q') ?? '',
    status: list(search.get('status')).filter((s): s is TaskStatus =>
      (TASK_STATUSES as readonly string[]).includes(s),
    ),
    priority: list(search.get('priority')).filter((p): p is TaskPriority =>
      (TASK_PRIORITIES as readonly string[]).includes(p),
    ),
    tags: list(search.get('tags')),
    due: oneOf<DueRange>(DUE_RANGES, search.get('due')),
  }
}

export function serializeBoardParams(params: BoardParams): URLSearchParams {
  const out = new URLSearchParams()
  if (params.view !== DEFAULT_PARAMS.view) out.set('view', params.view)
  if (params.sort !== DEFAULT_PARAMS.sort) out.set('sort', params.sort)
  if (params.q) out.set('q', params.q)
  if (params.status.length) out.set('status', params.status.join(','))
  if (params.priority.length) out.set('priority', params.priority.join(','))
  if (params.tags.length) out.set('tags', params.tags.join(','))
  if (params.due) out.set('due', params.due)
  return out
}

export function toggleIn<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
}
