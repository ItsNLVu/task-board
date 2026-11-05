import type { ImportMode } from '@/domain/importExport'
import type { MoveTarget } from '@/domain/order'
import type { Task, TaskDraft } from '@/domain/task'

export type ServiceErrorCode = 'VALIDATION' | 'CONFLICT' | 'NOT_FOUND' | 'QUOTA' | 'NETWORK'

export class ServiceError extends Error {
  readonly code: ServiceErrorCode
  readonly details: string[]

  constructor(code: ServiceErrorCode, message: string, details: string[] = []) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.details = details
  }
}

export interface CreateTaskInput extends TaskDraft {
  id?: string
}

export type UpdateTaskInput = Partial<TaskDraft>

export interface ImportResult {
  imported: number
  total: number
}

export interface TaskService {
  list(): Promise<Task[]>
  create(input: CreateTaskInput): Promise<Task>
  update(id: string, patch: UpdateTaskInput): Promise<Task>
  move(id: string, target: MoveTarget): Promise<Task[]>
  remove(id: string): Promise<Task>
  restore(task: Task): Promise<Task>
  importTasks(records: unknown[], mode: ImportMode): Promise<ImportResult>
  clear(): Promise<void>
}
