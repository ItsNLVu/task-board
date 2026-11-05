import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HolderOutlined } from '@ant-design/icons'
import { formatTime24h } from '@/common'
import type { Task, TaskStatus } from '@/domain/task'
import { StatusIcon } from '@/features/task/TaskBits'
import { TaskCard } from '@/features/task/TaskCard'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/cn'
import { statusDropId } from './listLayout'

export function NowDivider({ now, overdue }: { now: number; overdue: number }) {
  const { t } = useTranslation()
  const time = formatTime24h(now)
  return (
    <div
      className="flex items-center gap-2.5 py-1.5"
      role="separator"
      aria-label={t('listView.nowAria', { time })}
    >
      <span className="tabular inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 font-mono text-[11px] font-medium text-accent">
        <span className="size-1.5 rounded-full bg-accent" aria-hidden />
        {t('listView.nowBadge', { time })}
      </span>
      <span className="h-px flex-1 bg-accent/35" aria-hidden />
      {overdue > 0 && (
        <span className="tabular rounded-full border border-danger/25 bg-danger-soft px-2 py-0.5 font-mono text-[11px] text-danger">
          {t('listView.overdueAbove', { count: overdue })}
        </span>
      )}
    </div>
  )
}

export function StatusDropTarget({ status }: { status: TaskStatus }) {
  const { setNodeRef, isOver } = useDroppable({ id: statusDropId(status) })
  const { t } = useTranslation()
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-control border-2 border-dashed px-3 py-1.5 text-[12px] font-medium transition-all duration-150',
        isOver
          ? 'border-accent bg-accent-soft text-accent shadow-xs'
          : 'border-line-strong/50 bg-panel text-ink-2',
      )}
    >
      <StatusIcon status={status} decorative />
      <span>{t('listView.dropStatusPrefix', { status: t(`domain.status.${status}`) })}</span>
    </div>
  )
}

export function SortableListCard({
  task,
  now,
  needle,
  href,
  onStatusChange,
}: {
  task: Task
  now: number
  needle: string
  href: string
  onStatusChange: (taskId: string, status: TaskStatus) => void
}) {
  const { t } = useTranslation()
  const {
    setNodeRef,
    setActivatorNodeRef,
    listeners,
    attributes,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })
  const { onKeyDown, ...pointerListeners } = (listeners ?? {}) as Record<
    string,
    (e: unknown) => void
  >

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'h-full cursor-grab touch-manipulation active:cursor-grabbing',
        isDragging &&
          'rounded-panel border-2 border-dashed border-accent/60 bg-accent-soft/45 [&>*]:invisible',
      )}
      {...pointerListeners}
    >
      <TaskCard
        task={task}
        now={now}
        needle={needle}
        href={href}
        onStatusChange={onStatusChange}
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            onKeyDown={onKeyDown}
            aria-label={t('listView.moveTaskAria', { title: task.title })}
            className="relative z-10 -mt-1 -mr-1 flex size-7 shrink-0 cursor-grab items-center justify-center rounded-chip text-ink-3 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-panel-2 hover:text-ink active:cursor-grabbing max-md:opacity-100 md:size-6"
          >
            <HolderOutlined aria-hidden />
          </button>
        }
      />
    </div>
  )
}
