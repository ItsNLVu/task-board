import { Dropdown, Tooltip } from 'antd'
import { memo, type ReactNode } from 'react'
import { Link } from 'react-router'
import { getDeadlineState } from '@/domain/deadline'
import { getSearchIndex } from '@/domain/query'
import { findMatches, type Range } from '@/domain/text'
import { TASK_STATUSES, type Task, type TaskStatus } from '@/domain/task'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/cn'
import {
  DeadlineLabel,
  Highlight,
  PriorityBadge,
  StatusIcon,
  SubtaskProgress,
  TagList,
} from './TaskBits'

const SNIPPET = 120

function snippet(task: Task, needle: string): { text: string; ranges: Range[] } | null {
  if (!task.description) return null
  const all = needle ? findMatches(getSearchIndex(task).description, needle) : []
  const first = all[0]
  const start = first && first[0] > 40 ? first[0] - 40 : 0
  const end = Math.min(task.description.length, start + SNIPPET)
  const raw = task.description.slice(start, end)
  const text = `${start > 0 ? '…' : ''}${raw}${end < task.description.length ? '…' : ''}`
  const offset = start > 0 ? 1 - start : 0
  const ranges = all
    .filter(([s, e]) => s >= start && e <= end)
    .map(([s, e]) => [s + offset, e + offset] as const)
  return { text, ranges }
}

interface TaskCardProps {
  task: Task
  now: number
  needle: string
  href: string
  onStatusChange?: (taskId: string, status: TaskStatus) => void
  handle?: ReactNode
  dragging?: boolean
  className?: string
}

export const TaskCard = memo(function TaskCard({
  task,
  now,
  needle,
  href,
  onStatusChange,
  handle,
  dragging,
  className,
}: TaskCardProps) {
  const { t } = useTranslation()
  const state = getDeadlineState(task, now)
  const titleRanges = needle ? findMatches(getSearchIndex(task).title, needle) : []
  const excerpt = snippet(task, needle)
  const statusLabel = t(`domain.status.${task.status}`)

  const statusNode = onStatusChange ? (
    <Dropdown
      trigger={['click']}
      menu={{
        selectedKeys: [task.status],
        items: TASK_STATUSES.map((s) => ({
          key: s,
          icon: <StatusIcon status={s} decorative />,
          label: t(`domain.status.${s}`),
          onClick: ({ domEvent }) => {
            domEvent.stopPropagation()
            if (s !== task.status) onStatusChange(task.id, s)
          },
        })),
      }}
    >
      <Tooltip title={t('taskCard.statusTooltip', { status: statusLabel })} mouseEnterDelay={0.3}>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={t('taskCard.changeStatusAria', { status: statusLabel })}
          className="relative z-10 -m-1 mt-0 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-chip transition-colors hover:bg-panel-2"
        >
          <StatusIcon status={task.status} decorative />
        </button>
      </Tooltip>
    </Dropdown>
  ) : (
    <StatusIcon status={task.status} className="mt-[3px]" />
  )

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col gap-1.5 rounded-panel border border-line bg-panel p-3 shadow-card transition-all duration-150 select-none hover:border-line-strong hover:shadow-[0_4px_12px_-2px_rgb(22_24_29/0.07)]',
        state === 'overdue' &&
          'border-danger/30 before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-full before:bg-danger',
        dragging && 'shadow-lift ring-2 ring-accent/40',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        {statusNode}
        <h3
          className={cn(
            'min-w-0 flex-1 text-[13.5px] leading-snug font-medium break-words transition-colors group-hover:text-accent',
            task.status === 'done' ? 'text-ink-3 line-through decoration-ink-3/50' : 'text-ink',
          )}
        >
          <Link
            to={href}
            draggable={false}
            state={{ fromBoard: true }}
            data-task-link={task.id}
            className="rounded-[2px] text-inherit outline-none after:absolute after:inset-0 after:rounded-panel hover:text-inherit focus-visible:after:outline-1 focus-visible:after:outline-offset-0 focus-visible:after:outline-accent"
          >
            <Highlight text={task.title} ranges={titleRanges} />
          </Link>
        </h3>
        <span
          aria-hidden
          className="mt-0.5 shrink-0 font-mono text-[10.5px] text-ink-3/70 opacity-0 transition-opacity select-none group-hover:opacity-100"
        >
          #{task.id.slice(0, 4).toUpperCase()}
        </span>
        {handle}
      </div>

      {excerpt && (
        <p
          className={cn(
            'pl-[22px] text-[12px] leading-relaxed text-ink-2',
            needle ? 'line-clamp-2' : 'line-clamp-1',
          )}
        >
          <Highlight text={excerpt.text} ranges={excerpt.ranges} />
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-1 pt-1 pl-[22px]">
        <PriorityBadge priority={task.priority} />
        <DeadlineLabel task={task} now={now} />
        <TagList tags={task.tags} max={2} />
        <span className="ml-auto">
          <SubtaskProgress subtasks={task.subtasks} />
        </span>
      </div>
    </article>
  )
})
