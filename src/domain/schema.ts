import { z } from 'zod'
import { t } from '@/i18n'
import { isPastDeadline, localInputToMs } from './deadline'
import { findTitleConflict } from './rules'
import { cleanText, normalizeTitle } from './text'
import { LIMITS, TASK_PRIORITIES, TASK_STATUSES, type Task } from './task'

const isoDateTime = z.iso.datetime({ offset: true, error: () => t('domain.validation.isoInvalid') })

function buildTitleSchema() {
  return z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(LIMITS.titleMin, t('domain.validation.titleMin', { min: LIMITS.titleMin }))
        .max(LIMITS.titleMax, t('domain.validation.titleMax', { max: LIMITS.titleMax })),
    )
}

function buildDescriptionSchema() {
  return z
    .string()
    .max(
      LIMITS.descriptionMax,
      t('domain.validation.descriptionMax', { max: LIMITS.descriptionMax }),
    )
}

function buildTagSchema() {
  return z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(1, t('domain.validation.tagEmpty'))
        .max(LIMITS.tagMax, t('domain.validation.tagMax', { max: LIMITS.tagMax })),
    )
}

function buildTagsSchema() {
  return z
    .array(buildTagSchema())
    .max(LIMITS.tagsMax, t('domain.validation.tagsMax', { max: LIMITS.tagsMax }))
    .refine(
      (tags) => new Set(tags.map(normalizeTitle)).size === tags.length,
      t('domain.validation.tagsDuplicate'),
    )
}

function buildSubtaskSchema() {
  return z.object({
    id: z.string().min(1),
    title: z
      .string()
      .transform(cleanText)
      .pipe(
        z
          .string()
          .min(1, t('domain.validation.subtaskEmpty'))
          .max(
            LIMITS.subtaskTitleMax,
            t('domain.validation.subtaskMax', { max: LIMITS.subtaskTitleMax }),
          ),
      ),
    done: z.boolean(),
  })
}

function buildSubtasksSchema() {
  return z
    .array(buildSubtaskSchema())
    .max(LIMITS.subtasksMax, t('domain.validation.subtasksMax', { max: LIMITS.subtasksMax }))
}

const titleSchema = buildTitleSchema()
const descriptionSchema = buildDescriptionSchema()
const tagsSchema = buildTagsSchema()
const subtasksSchema = buildSubtasksSchema()
const statusSchema = z.enum(TASK_STATUSES)
const prioritySchema = z.enum(TASK_PRIORITIES)

export const taskSchema = z
  .object({
    id: z.uuid({ error: () => t('domain.validation.uuidInvalid') }),
    title: titleSchema,
    description: descriptionSchema,
    deadline: isoDateTime,
    status: statusSchema,
    priority: prioritySchema,
    tags: tagsSchema,
    subtasks: subtasksSchema,
    order: z.number({ error: () => t('domain.validation.orderInvalid') }),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
    completedAt: isoDateTime.nullable(),
  })
  .superRefine((task, ctx) => {
    if (task.status === 'done' && task.completedAt === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['completedAt'],
        message: t('domain.validation.completedAtRequired'),
      })
    }
    if (task.status !== 'done' && task.completedAt !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['completedAt'],
        message: t('domain.validation.completedAtMustBeNull'),
      })
    }
  })

export const taskDraftSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  deadline: isoDateTime,
  status: statusSchema,
  priority: prioritySchema,
  tags: tagsSchema,
  subtasks: subtasksSchema,
})

export interface TaskFormContext {
  mode: 'create' | 'edit'
  now: () => number
  tasks: readonly Pick<Task, 'id' | 'title' | 'status'>[]
  selfId?: string
  originalDeadline?: string
}

export function makeTaskFormSchema(ctx: TaskFormContext) {
  return z
    .object({
      title: buildTitleSchema(),
      description: buildDescriptionSchema(),
      deadline: z
        .string()
        .min(1, t('domain.validation.deadlineRequired'))
        .refine((v) => !Number.isNaN(localInputToMs(v)), t('domain.validation.deadlineInvalid')),
      status: statusSchema,
      priority: prioritySchema,
      tags: buildTagsSchema(),
      subtasks: buildSubtasksSchema(),
    })
    .superRefine((values, issue) => {
      const ms = localInputToMs(values.deadline)
      const unchanged = ctx.mode === 'edit' && values.deadline === ctx.originalDeadline
      if (!Number.isNaN(ms) && !unchanged && isPastDeadline(ms, ctx.now())) {
        issue.addIssue({
          code: 'custom',
          path: ['deadline'],
          message:
            ctx.mode === 'create'
              ? t('domain.validation.deadlinePastCreate')
              : t('domain.validation.deadlinePastEdit'),
        })
      }
      if (values.status !== 'done' && findTitleConflict(ctx.tasks, values.title, ctx.selfId)) {
        issue.addIssue({
          code: 'custom',
          path: ['title'],
          message: t('domain.validation.titleDuplicateOpen'),
        })
      }
    })
}

export type TaskFormSchema = ReturnType<typeof makeTaskFormSchema>
export type TaskFormInput = z.input<TaskFormSchema>
export type TaskFormOutput = z.output<TaskFormSchema>
