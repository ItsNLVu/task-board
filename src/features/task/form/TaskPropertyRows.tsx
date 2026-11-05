import { DatePicker, Segmented, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { Controller, type Control, type FieldError, type FieldErrors } from 'react-hook-form'
import { DATE_TIME_FORMATS } from '@/common'
import type { TaskFormInput } from '@/domain/schema'
import { PRIORITIES_DESC, TASK_STATUSES, type TaskPriority, type TaskStatus } from '@/domain/task'
import { useTranslation } from '@/i18n'
import { deadlinePresets } from '../deadlinePresets'
import { PriorityIcon, StatusIcon } from '../TaskBits'
import { tidyTags } from '../tidyTags'
import { Field } from './FormField'

function firstMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const e = error as Partial<FieldError> & { root?: FieldError }
  if (typeof e.message === 'string') return e.message
  if (e.root?.message) return e.root.message
  if (Array.isArray(error)) {
    for (const item of error as unknown[]) {
      const m = firstMessage(item)
      if (m) return m
    }
  }
  return undefined
}

export function DeadlineStatusRow({
  control,
  errors,
  mode,
  now,
}: {
  control: Control<TaskFormInput>
  errors: FieldErrors<TaskFormInput>
  mode: 'create' | 'edit'
  now: number
}) {
  const { t } = useTranslation()
  const presets = deadlinePresets(now).map((p) => ({ label: p.label, value: dayjs(p.ms) }))
  return (
    <div className="grid gap-3 sm:grid-cols-[215px_1fr]">
      <Field
        id="task-deadline"
        label={t('taskForm.deadlineLabel')}
        required
        error={errors.deadline?.message}
      >
        <Controller
          control={control}
          name="deadline"
          render={({ field }) => (
            <DatePicker
              id="task-deadline"
              showTime={{ format: DATE_TIME_FORMATS.time24h }}
              format={DATE_TIME_FORMATS.exactDayjs}
              needConfirm={false}
              allowClear={false}
              value={field.value ? dayjs(field.value) : null}
              onChange={(d: Dayjs | null) =>
                field.onChange(d ? d.format(DATE_TIME_FORMATS.localInputDayjs) : '')
              }
              onBlur={field.onBlur}
              presets={presets}
              disabledDate={
                mode === 'create' ? (d: Dayjs) => d.isBefore(dayjs(now).startOf('day')) : undefined
              }
              aria-required="true"
              aria-invalid={Boolean(errors.deadline)}
              aria-describedby={errors.deadline ? 'task-deadline-error' : undefined}
              className="w-full font-mono"
            />
          )}
        />
      </Field>

      <Field id="task-status" label={t('taskForm.statusLabel')} required>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Segmented<TaskStatus>
              aria-label={t('taskForm.statusLabel')}
              block
              value={field.value}
              onChange={(val) => field.onChange(val)}
              options={TASK_STATUSES.map((s) => ({
                value: s,
                label: (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <StatusIcon status={s} decorative />
                    <span>{t(`domain.status.${s}`)}</span>
                  </span>
                ),
              }))}
            />
          )}
        />
      </Field>
    </div>
  )
}

export function PriorityTagsRow({
  control,
  errors,
  tagOptions,
}: {
  control: Control<TaskFormInput>
  errors: FieldErrors<TaskFormInput>
  tagOptions: { value: string; label: string }[]
}) {
  const { t } = useTranslation()
  const tagError = firstMessage(errors.tags)
  return (
    <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
      <Field id="task-priority" label={t('taskForm.priorityLabel')} required>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <Segmented<TaskPriority>
              aria-label={t('taskForm.priorityLabel')}
              value={field.value}
              onChange={(val) => field.onChange(val)}
              options={PRIORITIES_DESC.map((p) => ({
                value: p,
                label: (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <PriorityIcon priority={p} />
                    <span>{t(`domain.priority.${p}`)}</span>
                  </span>
                ),
              }))}
            />
          )}
        />
      </Field>

      <Field id="task-tags" label={t('taskForm.tagsLabel')} error={tagError}>
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <Select
              id="task-tags"
              mode="tags"
              value={field.value}
              onChange={(next: string[]) => field.onChange(tidyTags(next))}
              onBlur={field.onBlur}
              options={tagOptions}
              tokenSeparators={[',']}
              placeholder={t('taskForm.tagsPlaceholder')}
              aria-invalid={Boolean(tagError)}
              aria-describedby={tagError ? 'task-tags-error' : undefined}
              notFoundContent={null}
            />
          )}
        />
      </Field>
    </div>
  )
}
