import { formatExact } from '@/domain/deadline'
import type { Task } from '@/domain/task'
import { useTranslation } from '@/i18n'

export function TaskMeta({ task }: { task: Task }) {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('taskForm.metaSectionAria')}
      className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-line pt-2.5 text-[11.5px] text-ink-3"
    >
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <span>{t('taskForm.metaCreated')}:</span>
        <time dateTime={task.createdAt} className="tabular font-mono text-ink-2">
          {formatExact(task.createdAt)}
        </time>
      </span>

      <span aria-hidden className="text-line-strong">
        ·
      </span>

      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <span>{t('taskForm.metaUpdated')}:</span>
        <time dateTime={task.updatedAt} className="tabular font-mono text-ink-2">
          {formatExact(task.updatedAt)}
        </time>
      </span>

      <span aria-hidden className="text-line-strong">
        ·
      </span>

      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <span>{t('taskForm.metaCompleted')}:</span>
        {task.completedAt ? (
          <time dateTime={task.completedAt} className="tabular font-mono text-accent">
            {formatExact(task.completedAt)}
          </time>
        ) : (
          <span className="font-mono text-ink-3">{t('taskForm.metaNotCompleted')}</span>
        )}
      </span>
    </section>
  )
}
