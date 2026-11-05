import type { TaskStats } from '@/domain/query'
import { TASK_STATUSES } from '@/domain/task'
import { StatusIcon } from '@/features/task/TaskBits'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/cn'
import { toggleIn } from './boardParams'
import { useBoardParams } from './useBoardParams'

export function StatsBar({ stats }: { stats: TaskStats }) {
  const { params, update } = useBoardParams()
  const { t } = useTranslation()
  const allActive = params.status.length === 0 && params.due === null
  const overdueOn = params.due === 'overdue'

  return (
    <ul
      className="flex flex-wrap items-center gap-1 text-[12px]"
      aria-label={t('statsBar.ariaLabel')}
    >
      <li>
        <button
          type="button"
          aria-pressed={allActive}
          title={t('statsBar.allTitle')}
          onClick={() => update({ status: [], due: null })}
          className={cn(
            'inline-flex h-[26px] cursor-pointer items-center gap-1.5 rounded-chip border px-2 whitespace-nowrap transition-colors',
            allActive
              ? 'border-accent/45 bg-accent-soft font-medium text-accent'
              : 'border-line bg-panel text-ink-2 hover:border-line-strong hover:text-ink',
          )}
        >
          <span>{t('statsBar.allLabel')}</span>
          <span className="tabular font-mono font-semibold text-ink">{stats.total}</span>
        </button>
      </li>

      {TASK_STATUSES.map((status) => {
        const active = params.status.includes(status)
        const statusLabel = t(`domain.status.${status}`)
        return (
          <li key={status}>
            <button
              type="button"
              aria-pressed={active}
              title={
                active
                  ? t('statsBar.unfilterStatusTitle', { status: statusLabel })
                  : t('statsBar.filterStatusTitle', { status: statusLabel })
              }
              onClick={() => update({ status: toggleIn(params.status, status) })}
              className={cn(
                'inline-flex h-[26px] cursor-pointer items-center gap-1.5 rounded-chip border px-2 whitespace-nowrap transition-colors',
                active
                  ? 'border-accent/45 bg-accent-soft font-medium text-accent'
                  : 'border-line bg-panel text-ink-2 hover:border-line-strong hover:text-ink',
              )}
            >
              <StatusIcon status={status} decorative />
              <span>{statusLabel}</span>
              <span className="tabular font-mono font-semibold text-ink">
                {stats.byStatus[status]}
              </span>
              {status === 'done' && stats.total > 0 && (
                <span className="tabular font-mono text-[11px] text-ink-3">
                  · {stats.completionRate}%
                </span>
              )}
            </button>
          </li>
        )
      })}

      <li>
        <button
          type="button"
          aria-pressed={overdueOn}
          title={overdueOn ? t('statsBar.unfilterOverdueTitle') : t('statsBar.filterOverdueTitle')}
          onClick={() => update({ due: overdueOn ? null : 'overdue' })}
          className={cn(
            'inline-flex h-[26px] cursor-pointer items-center gap-1.5 rounded-chip border px-2 whitespace-nowrap transition-colors',
            overdueOn
              ? 'border-danger/45 bg-danger-soft font-medium text-danger'
              : stats.overdue > 0
                ? 'border-danger/25 bg-danger-soft/60 text-danger hover:border-danger/50'
                : 'border-line bg-panel text-ink-2 hover:border-line-strong hover:text-ink',
          )}
        >
          <span
            aria-hidden
            className={cn('size-1.5 rounded-full', stats.overdue > 0 ? 'bg-danger' : 'bg-ink-3')}
          />
          <span>{t('statsBar.overdueLabel')}</span>
          <span className="tabular font-mono font-semibold">{stats.overdue}</span>
        </button>
      </li>
    </ul>
  )
}
