import type { TaskPriority } from '@/domain/task'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/cn'

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  urgent: 'bg-danger-soft text-danger border-danger/30 font-semibold',
  high: 'bg-p-high-soft text-p-high border-p-high/25 font-medium',
  medium: 'bg-p-medium-soft text-p-medium border-p-medium/25 font-medium',
  low: 'bg-p-low-soft text-p-low border-line font-normal',
}

export function PriorityIcon({
  priority,
  className,
}: {
  priority: TaskPriority
  className?: string
}) {
  if (priority === 'urgent') {
    return (
      <svg viewBox="0 0 14 14" className={cn('size-3 shrink-0', className)} aria-hidden>
        <rect x="1.5" y="1.5" width="11" height="11" rx="2.5" className="fill-danger" />
        <path
          d="M7 4.2v3.4M7 9.8h.01"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="stroke-accent-ink"
        />
      </svg>
    )
  }
  const bars = priority === 'high' ? 3 : priority === 'medium' ? 2 : 1
  return (
    <svg viewBox="0 0 14 14" className={cn('size-3 shrink-0', className)} aria-hidden>
      <rect x="2" y="8.5" width="2.2" height="3.5" rx="0.6" className="fill-current" />
      <rect
        x="5.9"
        y="5.5"
        width="2.2"
        height="6.5"
        rx="0.6"
        className={bars >= 2 ? 'fill-current' : 'fill-current opacity-25'}
      />
      <rect
        x="9.8"
        y="2.5"
        width="2.2"
        height="9.5"
        rx="0.6"
        className={bars >= 3 ? 'fill-current' : 'fill-current opacity-25'}
      />
    </svg>
  )
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-chip border px-1.5 text-[11px] leading-none',
        PRIORITY_STYLE[priority],
      )}
    >
      <PriorityIcon priority={priority} />
      <span className="sr-only">Priority: </span>
      {t(`domain.priority.${priority}`)}
    </span>
  )
}
