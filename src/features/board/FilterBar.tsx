import { CloseOutlined, FilterOutlined } from '@ant-design/icons'
import { Badge, Button, Drawer } from 'antd'
import { useState } from 'react'
import { hasActiveFilters, type TaskStats } from '@/domain/query'
import type { Task } from '@/domain/task'
import { useTranslation } from '@/i18n'
import {
  DueSelect,
  MobileFilterControls,
  PrioritySelect,
  SortSelect,
  TagFilter,
} from './filters/FilterControls'
import { SearchInput } from './SearchInput'
import { StatsBar } from './StatsBar'
import { useBoardParams } from './useBoardParams'

export { SortSelect }

interface FilterBarProps {
  tasks: readonly Task[]
  stats: TaskStats
  resultCount: number
}

export function FilterBar({ tasks, stats, resultCount }: FilterBarProps) {
  const { params, clearFilters } = useBoardParams()
  const { t } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const active = hasActiveFilters(params)
  const activeCount =
    params.status.length + params.priority.length + params.tags.length + (params.due ? 1 : 0)

  const summary = (
    <p
      className="rounded-chip border border-line bg-panel-2/60 px-2 py-0.5 text-[12px] whitespace-nowrap text-ink-2"
      aria-live="polite"
    >
      <span className="tabular font-mono font-medium text-ink">{resultCount}</span>
      {active && (
        <>
          {' / '}
          <span className="tabular font-mono">{tasks.length}</span>
        </>
      )}{' '}
      {t('common.taskUnit')}
    </p>
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatsBar stats={stats} />
        {active ? (
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              size="small"
              type="text"
              icon={<CloseOutlined aria-hidden />}
              onClick={clearFilters}
              className="text-[12px] text-ink-2 hover:text-ink"
            >
              {t('filterBar.clearFilters')}
            </Button>
            {summary}
          </div>
        ) : (
          <span className="sr-only" aria-live="polite">
            {resultCount} {t('common.taskUnit')}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="w-full sm:w-56 md:w-64">
          <SearchInput />
        </div>

        <div className="hidden items-center gap-1.5 md:flex">
          <PrioritySelect />
          <TagFilter tasks={tasks} />
          <DueSelect />
        </div>

        <Badge count={activeCount} size="small" className="md:hidden">
          <Button
            size="small"
            icon={<FilterOutlined aria-hidden />}
            onClick={() => setDrawerOpen(true)}
          >
            {t('filterBar.mobileDrawerButton')}
          </Button>
        </Badge>

        <div className="ml-auto flex items-center gap-1.5">
          {params.view === 'list' ? (
            <SortSelect />
          ) : (
            <span className="hidden text-[11.5px] text-ink-3 lg:inline">
              {t('filterBar.kanbanHint')}
            </span>
          )}
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="bottom"
        size="auto"
        title={t('filterBar.mobileDrawerTitle')}
        closable={{ 'aria-label': t('filterBar.mobileDrawerCloseAria') }}
        styles={{ body: { paddingBottom: 'max(16px, env(safe-area-inset-bottom))' } }}
        footer={
          <div className="flex items-center justify-between gap-2">
            {summary}
            <div className="flex gap-2">
              {active && <Button onClick={clearFilters}>{t('filterBar.clearFilters')}</Button>}
              <Button type="primary" onClick={() => setDrawerOpen(false)}>
                {t('filterBar.viewResults')}
              </Button>
            </div>
          </div>
        }
      >
        <MobileFilterControls tasks={tasks} />
      </Drawer>
    </div>
  )
}
