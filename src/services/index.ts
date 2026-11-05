import { createLocalStorageTaskService } from './localStorageTaskService'
import { failureSimulation } from './simulation'
import { createTabSync } from './sync'
import type { TaskService } from './types'

export const tabSync = createTabSync()

let service: TaskService | null = null

export function getTaskService(): TaskService {
  service ??= createLocalStorageTaskService({
    storage: window.localStorage,
    failureRate: failureSimulation.failureRate,
    onWrite: () => {
      tabSync.notify()
    },
  })
  return service
}

export { ServiceError } from './types'
export type { TaskService, CreateTaskInput, UpdateTaskInput } from './types'
