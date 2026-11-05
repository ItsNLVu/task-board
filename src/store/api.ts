import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import type { ImportMode } from '@/domain/importExport'
import { applyMove, applyUpdate, buildNewTask } from '@/domain/mutations'
import type { MoveTarget } from '@/domain/order'
import type { Task } from '@/domain/task'
import {
  getTaskService,
  ServiceError,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@/services'
import type { ImportResult } from '@/services/types'
import { t } from '@/i18n'
import { notifyError } from '@/lib/notify'

export interface ApiError {
  code: ServiceError['code'] | 'UNKNOWN'
  message: string
  details: string[]
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ServiceError) {
    return { code: error.code, message: error.message, details: error.details }
  }
  return {
    code: 'UNKNOWN',
    message: t('common.unexpectedError'),
    details: [error instanceof Error ? error.message : String(error)],
  }
}

async function run<T>(fn: () => Promise<T>): Promise<{ data: T } | { error: ApiError }> {
  try {
    return { data: await fn() }
  } catch (error) {
    return { error: toApiError(error) }
  }
}

function errorMessage(error: unknown): string {
  const inner = (error as { error?: ApiError } | undefined)?.error
  return inner?.message ?? t('common.actionFailedRollback')
}

const nowIso = () => new Date().toISOString()

export const taskApi = createApi({
  reducerPath: 'taskApi',
  baseQuery: fakeBaseQuery<ApiError>(),
  tagTypes: ['Tasks'],
  endpoints: (build) => ({
    getTasks: build.query<Task[], void>({
      queryFn: () => run(() => getTaskService().list()),
      providesTags: ['Tasks'],
    }),

    createTask: build.mutation<Task, CreateTaskInput & { id: string }>({
      queryFn: (input) => run(() => getTaskService().create(input)),
      async onQueryStarted(input, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
            draft.push(buildNewTask(input, input.id, draft, nowIso()))
          }),
        )
        try {
          const { data } = await queryFulfilled
          dispatch(replaceTasks([data]))
        } catch (error) {
          patch.undo()
          notifyError(errorMessage(error))
        }
      },
    }),

    updateTask: build.mutation<Task, { id: string; patch: UpdateTaskInput }>({
      queryFn: ({ id, patch }) => run(() => getTaskService().update(id, patch)),
      async onQueryStarted({ id, patch }, { dispatch, queryFulfilled }) {
        const undo = dispatch(
          taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
            const index = draft.findIndex((t) => t.id === id)
            const current = draft[index]
            if (current) draft[index] = applyUpdate(current, patch, draft, nowIso())
          }),
        )
        try {
          const { data } = await queryFulfilled
          dispatch(replaceTasks([data]))
        } catch (error) {
          undo.undo()
          notifyError(errorMessage(error))
        }
      },
    }),

    moveTask: build.mutation<Task[], { id: string; target: MoveTarget }>({
      queryFn: ({ id, target }) => run(() => getTaskService().move(id, target)),
      async onQueryStarted({ id, target }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
            const changed = new Map(applyMove(draft, id, target, nowIso()).map((t) => [t.id, t]))
            draft.forEach((t, i) => {
              const next = changed.get(t.id)
              if (next) draft[i] = next
            })
          }),
        )
        try {
          const { data } = await queryFulfilled
          dispatch(replaceTasks(data))
        } catch (error) {
          patch.undo()
          notifyError(errorMessage(error))
        }
      },
    }),

    deleteTask: build.mutation<Task, string>({
      queryFn: (id) => run(() => getTaskService().remove(id)),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          taskApi.util.updateQueryData('getTasks', undefined, (draft) =>
            draft.filter((t) => t.id !== id),
          ),
        )
        try {
          await queryFulfilled
        } catch (error) {
          patch.undo()
          notifyError(errorMessage(error))
        }
      },
    }),

    restoreTask: build.mutation<Task, Task>({
      queryFn: (task) => run(() => getTaskService().restore(task)),
      async onQueryStarted(task, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
            if (!draft.some((t) => t.id === task.id)) draft.push(task)
          }),
        )
        try {
          await queryFulfilled
        } catch (error) {
          patch.undo()
          notifyError(errorMessage(error))
        }
      },
    }),

    importTasks: build.mutation<ImportResult, { records: unknown[]; mode: ImportMode }>({
      queryFn: ({ records, mode }) => run(() => getTaskService().importTasks(records, mode)),
      invalidatesTags: (_result, error) => (error ? [] : ['Tasks']),
    }),

    clearTasks: build.mutation<undefined, void>({
      queryFn: () =>
        run(async () => {
          await getTaskService().clear()
          return undefined
        }),
      invalidatesTags: (_result, error) => (error ? [] : ['Tasks']),
    }),
  }),
})

function replaceTasks(tasks: Task[]) {
  return taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
    const byId = new Map(tasks.map((t) => [t.id, t]))
    draft.forEach((t, i) => {
      const next = byId.get(t.id)
      if (next) draft[i] = next
    })
  })
}

export const {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useMoveTaskMutation,
  useDeleteTaskMutation,
  useRestoreTaskMutation,
  useImportTasksMutation,
  useClearTasksMutation,
} = taskApi
