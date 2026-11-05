import { isPastDeadline } from '@/domain/deadline'
import { previewImport, type ImportMode } from '@/domain/importExport'
import { applyMove, applyUpdate, buildNewTask } from '@/domain/mutations'
import type { MoveTarget } from '@/domain/order'
import { findTitleConflict } from '@/domain/rules'
import { taskDraftSchema, taskSchema } from '@/domain/schema'
import type { Task } from '@/domain/task'
import { t } from '@/i18n'
import { TASKS_STORAGE_KEY } from './sync'
import {
  ServiceError,
  type CreateTaskInput,
  type ImportResult,
  type TaskService,
  type UpdateTaskInput,
} from './types'

interface Envelope {
  version: 1
  tasks: Task[]
}

export interface LocalStorageServiceOptions {
  storage: Storage
  latency?: readonly [number, number]
  failureRate?: () => number
  random?: () => number
  now?: () => number
  uuid?: () => string
  onWrite?: () => void
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

function conflictError(title: string): ServiceError {
  return new ServiceError('CONFLICT', t('domain.service.titleConflict', { title }))
}

export function createLocalStorageTaskService(options: LocalStorageServiceOptions): TaskService {
  const {
    storage,
    latency = [120, 360],
    failureRate = () => 0,
    random = Math.random,
    now = Date.now,
    uuid = () => crypto.randomUUID(),
    onWrite,
  } = options

  function read(): Task[] {
    const raw = storage.getItem(TASKS_STORAGE_KEY)
    if (!raw) return []
    try {
      const data = JSON.parse(raw) as Partial<Envelope> | null
      return Array.isArray(data?.tasks) ? data.tasks : []
    } catch {
      return []
    }
  }

  function write(tasks: Task[]): void {
    try {
      storage.setItem(TASKS_STORAGE_KEY, JSON.stringify({ version: 1, tasks } satisfies Envelope))
    } catch (error) {
      if (isQuotaError(error)) {
        throw new ServiceError('QUOTA', t('domain.service.quotaExceeded'))
      }
      throw error
    }
    onWrite?.()
  }

  async function simulate(isWrite: boolean): Promise<void> {
    const [min, max] = latency
    await sleep(min + random() * (max - min))
    if (isWrite && random() < failureRate()) {
      throw new ServiceError('NETWORK', t('domain.service.simulatedNetworkFailure'))
    }
  }

  function nowIso(): string {
    return new Date(now()).toISOString()
  }

  function findOrThrow(tasks: Task[], id: string): Task {
    const task = tasks.find((t) => t.id === id)
    if (!task) throw new ServiceError('NOT_FOUND', t('domain.service.taskNotFound'))
    return task
  }

  function validate(task: Task): Task {
    const result = taskSchema.safeParse(task)
    if (!result.success) {
      throw new ServiceError(
        'VALIDATION',
        t('domain.service.invalidTaskData'),
        result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      )
    }
    return result.data
  }

  return {
    async list() {
      await simulate(false)
      return read()
    },

    async create(input: CreateTaskInput) {
      await simulate(true)
      const parsed = taskDraftSchema.safeParse(input)
      if (!parsed.success) {
        throw new ServiceError(
          'VALIDATION',
          t('domain.service.invalidTaskData'),
          parsed.error.issues.map((i) => i.message),
        )
      }
      const draft = parsed.data
      if (isPastDeadline(Date.parse(draft.deadline), now())) {
        throw new ServiceError('VALIDATION', `${t('domain.validation.deadlinePastCreate')}.`)
      }
      const tasks = read()
      if (input.id && tasks.some((t) => t.id === input.id)) {
        throw new ServiceError('CONFLICT', t('domain.service.idConflict'))
      }
      if (draft.status !== 'done' && findTitleConflict(tasks, draft.title)) {
        throw conflictError(draft.title)
      }
      const task = validate(buildNewTask(draft, input.id ?? uuid(), tasks, nowIso()))
      write([...tasks, task])
      return task
    },

    async update(id: string, patch: UpdateTaskInput) {
      await simulate(true)
      const tasks = read()
      const current = findOrThrow(tasks, id)
      if (
        patch.deadline !== undefined &&
        patch.deadline !== current.deadline &&
        isPastDeadline(Date.parse(patch.deadline), now())
      ) {
        throw new ServiceError('VALIDATION', `${t('domain.validation.deadlinePastEdit')}.`)
      }
      const next = validate(applyUpdate(current, patch, tasks, nowIso()))
      if (next.status !== 'done' && findTitleConflict(tasks, next.title, id)) {
        throw conflictError(next.title)
      }
      write(tasks.map((t) => (t.id === id ? next : t)))
      return next
    },

    async move(id: string, target: MoveTarget) {
      await simulate(true)
      const tasks = read()
      const current = findOrThrow(tasks, id)
      if (
        current.status === 'done' &&
        target.status !== 'done' &&
        findTitleConflict(tasks, current.title, id)
      ) {
        throw conflictError(current.title)
      }
      const changed = applyMove(tasks, id, target, nowIso())
      const byId = new Map(changed.map((t) => [t.id, t]))
      write(tasks.map((t) => byId.get(t.id) ?? t))
      return changed
    },

    async remove(id: string) {
      await simulate(true)
      const tasks = read()
      const task = findOrThrow(tasks, id)
      write(tasks.filter((t) => t.id !== id))
      return task
    },

    async restore(task: Task) {
      await simulate(true)
      const tasks = read()
      if (tasks.some((t) => t.id === task.id)) return task
      if (task.status !== 'done' && findTitleConflict(tasks, task.title, task.id)) {
        throw new ServiceError(
          'CONFLICT',
          t('domain.service.undoTitleConflict', { title: task.title }),
        )
      }
      const restored = validate(task)
      write([...tasks, restored])
      return restored
    },

    async importTasks(records: unknown[], mode: ImportMode): Promise<ImportResult> {
      await simulate(true)
      const tasks = read()
      const preview = previewImport(records, tasks, mode)
      if (mode === 'replace') {
        write(preview.valid)
      } else {
        const incoming = new Map(preview.valid.map((t) => [t.id, t]))
        const merged = tasks.map((t) => incoming.get(t.id) ?? t)
        const existingIds = new Set(tasks.map((t) => t.id))
        write([...merged, ...preview.valid.filter((t) => !existingIds.has(t.id))])
      }
      return { imported: preview.valid.length, total: records.length }
    },

    async clear() {
      await simulate(true)
      write([])
    },
  }
}
