import { FieldTimeOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Form, Input } from 'antd'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  formatExact,
  formatOverdueDuration,
  formatRelativeDeadline,
  getDeadlineState,
  isoToLocalInput,
  localInputToMs,
} from '@/domain/deadline'
import { collectTags } from '@/domain/query'
import { makeTaskFormSchema, type TaskFormInput, type TaskFormOutput } from '@/domain/schema'
import type { Task, TaskDraft, TaskStatus } from '@/domain/task'
import { useTranslation } from '@/i18n'
import { readNow, useNow } from '@/lib/clock'
import { Field } from './form/FormField'
import { DeadlineStatusRow, PriorityTagsRow } from './form/TaskPropertyRows'
import { SubtaskEditor } from './SubtaskEditor'
import { defaultValuesFor, toDraft } from './taskFormValues'

interface TaskFormProps {
  mode: 'create' | 'edit'
  task?: Task
  tasks: readonly Task[]
  initialStatus?: TaskStatus
  onSubmit: (draft: TaskDraft) => Promise<boolean>
  onCancel: () => void
  onDirtyChange: (dirty: boolean) => void
  footerStart?: ReactNode
  children?: ReactNode
}

export function TaskForm({
  mode,
  task,
  tasks,
  initialStatus,
  onSubmit,
  onCancel,
  onDirtyChange,
  footerStart,
  children,
}: TaskFormProps) {
  const now = useNow()
  const { t } = useTranslation()
  const [baselineDeadline, setBaselineDeadline] = useState(
    task ? isoToLocalInput(task.deadline) : undefined,
  )
  const schema = makeTaskFormSchema({
    mode,
    now: readNow,
    tasks,
    selfId: task?.id,
    originalDeadline: baselineDeadline,
  })
  const tagOptions = useMemo(
    () => collectTags(tasks).map(({ tag }) => ({ value: tag, label: tag })),
    [tasks],
  )

  const form = useForm<TaskFormInput, unknown, TaskFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: defaultValuesFor(task, initialStatus),
    mode: 'onTouched',
  })
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = form

  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty, onDirtyChange])

  const seenVersion = useRef(task?.updatedAt)
  const saving = useRef(false)
  const [stale, setStale] = useState(false)

  const loadLatest = (latest: Task) => {
    seenVersion.current = latest.updatedAt
    setBaselineDeadline(isoToLocalInput(latest.deadline))
    setStale(false)
    reset(defaultValuesFor(latest))
  }

  useEffect(() => {
    if (!task || saving.current || task.updatedAt === seenVersion.current) return
    if (isDirty) {
      setStale(true)
      return
    }
    seenVersion.current = task.updatedAt
    setBaselineDeadline(isoToLocalInput(task.deadline))
    setStale(false)
    reset(defaultValuesFor(task))
  }, [task, isDirty, reset])

  const deadlineValue = useWatch({ control, name: 'deadline' })
  const statusValue = useWatch({ control, name: 'status' })
  const deadlineMs = localInputToMs(deadlineValue)
  const deadlineIso = Number.isNaN(deadlineMs) ? null : new Date(deadlineMs).toISOString()
  const deadlineState = deadlineIso
    ? getDeadlineState({ status: statusValue, deadline: deadlineIso }, now)
    : null

  const submit = handleSubmit(async (values) => {
    saving.current = true
    const ok = await onSubmit(toDraft(values))
    saving.current = false
    if (!ok) return
    seenVersion.current = undefined
    setStale(false)
    reset(values)
  })

  const describe = (field: keyof TaskFormInput) =>
    errors[field] ? `task-${field}-error` : undefined
  const canSave = !isSubmitting && (mode === 'create' || isDirty)

  return (
    <form
      onSubmit={(e) => void submit(e)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSave) {
          e.preventDefault()
          void submit()
        }
      }}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 overflow-y-auto px-5 pt-0.5 pb-4 sm:px-6">
        {stale && task && (
          <Alert
            type="warning"
            showIcon
            icon={<SyncOutlined aria-hidden />}
            className="mb-3"
            title={t('taskForm.staleWarningTitle')}
            action={
              <Button size="small" onClick={() => loadLatest(task)}>
                {t('taskForm.staleReloadButton')}
              </Button>
            }
          />
        )}

        <Form layout="vertical" component={false} requiredMark={false}>
          <div className="flex flex-col gap-3">
            <Field
              id="task-title"
              label={t('taskForm.titleLabel')}
              required
              error={errors.title?.message}
            >
              <Controller
                control={control}
                name="title"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="task-title"
                    autoFocus={mode === 'create'}
                    placeholder={t('taskForm.titlePlaceholder')}
                    aria-required="true"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={describe('title')}
                    className="font-medium"
                  />
                )}
              />
            </Field>

            {deadlineState === 'overdue' && deadlineIso && (
              <Alert
                type="error"
                showIcon
                icon={<WarningOutlined aria-hidden />}
                title={t('taskForm.overdueAlert', {
                  relative: formatOverdueDuration(deadlineIso, now),
                  exact: formatExact(deadlineIso),
                })}
              />
            )}
            {deadlineState === 'soon' && deadlineIso && (
              <Alert
                type="warning"
                showIcon
                icon={<FieldTimeOutlined aria-hidden />}
                title={t('taskForm.soonAlert', {
                  relative: formatRelativeDeadline(deadlineIso, now),
                })}
              />
            )}

            <DeadlineStatusRow control={control} errors={errors} mode={mode} now={now} />
            <PriorityTagsRow control={control} errors={errors} tagOptions={tagOptions} />

            <Field
              id="task-description"
              label={t('taskForm.descriptionLabel')}
              error={errors.description?.message}
            >
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <Input.TextArea
                    {...field}
                    id="task-description"
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    placeholder={t('taskForm.descriptionPlaceholder')}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={describe('description')}
                  />
                )}
              />
            </Field>

            <SubtaskEditor control={control} errors={errors.subtasks} />
            {children}
          </div>
        </Form>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-line bg-bg/40 px-5 py-2.5 sm:px-6">
        {footerStart}
        <div className="ml-auto flex gap-2">
          <Button onClick={onCancel}>
            {mode === 'create' ? t('common.cancel') : t('common.close')}
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={!canSave}>
            {mode === 'create' ? t('taskForm.submitCreate') : t('taskForm.submitSave')}
          </Button>
        </div>
      </footer>
    </form>
  )
}
