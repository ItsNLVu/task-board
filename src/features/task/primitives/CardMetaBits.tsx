import { Tooltip } from 'antd'
import { splitByRanges, type Range } from '@/domain/text'
import type { Task } from '@/domain/task'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/cn'

export function Highlight({ text, ranges }: { text: string; ranges: readonly Range[] }) {
  if (ranges.length === 0) return <>{text}</>
  return (
    <>
      {splitByRanges(text, ranges).map((part, i) =>
        part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>,
      )}
    </>
  )
}

export function SubtaskProgress({ subtasks }: { subtasks: Task['subtasks'] }) {
  const { t } = useTranslation()
  if (subtasks.length === 0) return null
  const done = subtasks.filter((s) => s.done).length
  const pct = Math.round((done / subtasks.length) * 100)
  return (
    <span
      className="inline-flex h-5 items-center gap-1.5 rounded-chip border border-line bg-panel-2/70 px-1.5"
      title={t('taskCard.subtaskProgressTitle', { done, total: subtasks.length })}
    >
      <span className="h-1 w-6 overflow-hidden rounded-full bg-line" aria-hidden>
        <span
          className={cn('block h-full', pct === 100 ? 'bg-accent' : 'bg-ink-2')}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="tabular font-mono text-[11px] text-ink-2">
        {done}/{subtasks.length}
        <span className="sr-only">{t('taskCard.subtaskProgressSrOnly')}</span>
      </span>
    </span>
  )
}

export function TagList({ tags, max = 3 }: { tags: readonly string[]; max?: number }) {
  if (tags.length === 0) return null
  const shown = tags.slice(0, max)
  const hidden = tags.slice(max)
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-1">
      {shown.map((tag) => (
        <span
          key={tag}
          className="inline-flex h-5 max-w-28 items-center gap-1 truncate rounded-chip border border-line bg-panel-2/60 px-1.5 text-[11px] text-ink-2"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-ink-3/60" aria-hidden />
          <span className="truncate">{tag}</span>
        </span>
      ))}
      {hidden.length > 0 && (
        <Tooltip title={hidden.join(', ')}>
          <span className="relative z-10 rounded-chip bg-panel-2 px-1 font-mono text-[10.5px] text-ink-3">
            +{hidden.length}
          </span>
        </Tooltip>
      )}
    </span>
  )
}
