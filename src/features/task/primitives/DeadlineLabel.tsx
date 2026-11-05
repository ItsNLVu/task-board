import { CalendarOutlined, FieldTimeOutlined, WarningOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import {
  formatExact,
  formatOverdueDuration,
  formatRelativeDeadline,
  formatShortDate,
  getDeadlineState,
} from '@/domain/deadline'
import type { Task } from '@/domain/task'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/cn'

export interface DeadlineLabelProps {
  task: Pick<Task, 'deadline' | 'status'>
  now: number
  size?: 'sm' | 'md'
}

export function DeadlineLabel({ task, now, size = 'sm' }: DeadlineLabelProps) {
  const { t } = useTranslation()
  const state = getDeadlineState(task, now)
  const exact = formatExact(task.deadline)
  const text = size === 'md' ? 'text-[12.5px]' : 'text-[11.5px]'

  let content
  if (state === 'overdue') {
    content = (
      <span
        className={cn(
          'inline-flex h-5 items-center gap-1 rounded-chip border border-danger/25 bg-danger-soft px-1.5 font-medium text-danger',
          text,
        )}
      >
        <WarningOutlined aria-hidden className="text-[10px]" />
        {t('domain.deadline.overdueChip')}
        <span className="tabular font-mono text-[11px] font-normal">
          {formatOverdueDuration(task.deadline, now)}
        </span>
      </span>
    )
  } else if (state === 'soon') {
    content = (
      <span
        className={cn(
          'inline-flex h-5 items-center gap-1 rounded-chip border border-warning/25 bg-warning-soft px-1.5 font-medium text-warning',
          text,
        )}
      >
        <FieldTimeOutlined aria-hidden className="text-[10px]" />
        {t('domain.deadline.soonChip')}
        <span className="tabular font-mono text-[11px] font-normal">
          {formatRelativeDeadline(task.deadline, now)}
        </span>
      </span>
    )
  } else {
    content = (
      <span className={cn('inline-flex h-5 items-center gap-1 text-ink-3', text)}>
        <CalendarOutlined aria-hidden className="text-[10px]" />
        <span className="tabular font-mono text-[11px]">
          {state === 'done'
            ? t('domain.deadline.doneShort', { date: formatShortDate(task.deadline) })
            : formatRelativeDeadline(task.deadline, now)}
        </span>
      </span>
    )
  }

  return (
    <Tooltip title={t('domain.deadline.exactTooltip', { date: exact })} mouseEnterDelay={0.2}>
      <time dateTime={task.deadline} className="relative z-10 inline-flex">
        {content}
        <span className="sr-only">{t('domain.deadline.exactSrOnly', { date: exact })}</span>
      </time>
    </Tooltip>
  )
}
