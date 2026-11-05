import type { z } from 'zod'
import { formatFileStamp } from '@/common'
import { t } from '@/i18n'
import { normalizeTitle } from './text'
import { taskSchema } from './schema'
import type { Task } from './task'

export const EXPORT_APP = 'task-board'
export const EXPORT_VERSION = 1

export interface ExportEnvelope {
  app: typeof EXPORT_APP
  version: typeof EXPORT_VERSION
  exportedAt: string
  tasks: Task[]
}

export function buildExport(tasks: readonly Task[], now: Date): ExportEnvelope {
  return {
    app: EXPORT_APP,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    tasks: [...tasks],
  }
}

export type ImportMode = 'merge' | 'replace'

export interface ImportIssue {
  index: number
  title?: string
  messages: string[]
}

export interface ImportPreview {
  valid: Task[]
  issues: ImportIssue[]
  updates: number
}

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => {
    const path = i.path.join('.')
    return path ? `${path}: ${i.message}` : i.message
  })
}

export function extractRecords(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw as unknown[]
  if (raw && typeof raw === 'object' && Array.isArray((raw as { tasks?: unknown }).tasks)) {
    return (raw as { tasks: unknown[] }).tasks
  }
  return null
}

export function previewImport(
  records: readonly unknown[],
  existing: readonly Task[],
  mode: ImportMode,
): ImportPreview {
  const issues: ImportIssue[] = []
  const parsed: { index: number; task: Task }[] = []
  const seenIds = new Set<string>()

  records.forEach((record, index) => {
    const result = taskSchema.safeParse(record)
    const title =
      record &&
      typeof record === 'object' &&
      typeof (record as { title?: unknown }).title === 'string'
        ? (record as { title: string }).title
        : undefined
    if (!result.success) {
      issues.push({ index, title, messages: formatZodIssues(result.error) })
      return
    }
    if (seenIds.has(result.data.id)) {
      issues.push({ index, title, messages: [t('domain.validation.importDuplicateId')] })
      return
    }
    seenIds.add(result.data.id)
    parsed.push({ index, task: result.data })
  })

  const kept = mode === 'merge' ? existing.filter((t) => !seenIds.has(t.id)) : []
  const taken = new Map<string, string>()
  for (const t of kept) if (t.status !== 'done') taken.set(normalizeTitle(t.title), 'existing')

  const valid: Task[] = []
  for (const { index, task } of parsed) {
    if (task.status !== 'done') {
      const key = normalizeTitle(task.title)
      const owner = taken.get(key)
      if (owner) {
        issues.push({
          index,
          title: task.title,
          messages: [
            owner === 'existing'
              ? t('domain.validation.importDuplicateExistingTitle')
              : t('domain.validation.importDuplicateFileTitle'),
          ],
        })
        continue
      }
      taken.set(key, 'file')
    }
    valid.push(task)
  }

  issues.sort((a, b) => a.index - b.index)
  const existingIds = new Set(existing.map((t) => t.id))
  const updates = mode === 'merge' ? valid.filter((t) => existingIds.has(t.id)).length : 0
  return { valid, issues, updates }
}

export function exportFileName(now: Date): string {
  return `task-board-${formatFileStamp(now)}.json`
}
