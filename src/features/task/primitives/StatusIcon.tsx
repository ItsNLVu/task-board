import type { TaskStatus } from '@/domain/task'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/cn'

export function StatusIcon({
  status,
  decorative = false,
  className,
}: {
  status: TaskStatus
  decorative?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <span className={cn('inline-flex shrink-0 items-center', className)}>
      <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
        {status === 'done' ? (
          <>
            <circle cx="7" cy="7" r="6.2" className="fill-accent" />
            <path
              d="M4.2 7.2 6.1 9l3.7-4"
              fill="none"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-accent-ink"
            />
          </>
        ) : status === 'in_progress' ? (
          <>
            <circle
              cx="7"
              cy="7"
              r="5.8"
              fill="none"
              strokeWidth="1.4"
              className="stroke-warning"
            />
            <path d="M7 2.8a4.2 4.2 0 0 1 0 8.4Z" className="fill-warning" />
          </>
        ) : (
          <circle
            cx="7"
            cy="7"
            r="5.8"
            fill="none"
            strokeWidth="1.4"
            strokeDasharray="2.2 1.8"
            className="stroke-line-strong"
          />
        )}
      </svg>
      {!decorative && <span className="sr-only">{t(`domain.status.${status}`)}</span>}
    </span>
  )
}
