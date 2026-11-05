import { Button, Result } from 'antd'
import { useEffect, type ReactNode } from 'react'
import { Outlet } from 'react-router'
import { useTranslation } from '@/i18n'
import { tabSync } from '@/services'
import { taskApi } from '@/store/api'
import { useAppDispatch } from '@/store/store'
import { FilterBar } from './FilterBar'
import { KanbanView } from './KanbanView'
import { ListView } from './ListView'
import { FilteredEmptyState, FirstRunState, LoadingCardsState, NoCards } from './states/BoardStates'
import { TopBar } from './TopBar'
import { useBoardParams, useViewPersistence } from './useBoardParams'
import { useBoardTasks } from './useBoardTasks'

export function BoardPage() {
  const { t } = useTranslation()
  useViewPersistence()
  const dispatch = useAppDispatch()
  const { clearFilters } = useBoardParams()
  const { query, tasks, filtered, sorted, stats, needle, now, params } = useBoardTasks()

  useEffect(
    () =>
      tabSync.subscribe(() => {
        dispatch(taskApi.util.invalidateTags(['Tasks']))
      }),
    [dispatch],
  )

  let content: ReactNode
  if (query.isLoading) {
    content = <LoadingCardsState />
  } else if (query.isError) {
    content = (
      <NoCards>
        <Result
          status="warning"
          title={t('boardStates.loadErrorTitle')}
          subTitle={t('boardStates.loadErrorSubtitle', { message: query.error.message ?? '' })}
          extra={
            <Button type="primary" onClick={() => void query.refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      </NoCards>
    )
  } else if (tasks.length === 0) {
    content = <FirstRunState />
  } else if (filtered.length === 0) {
    content = <FilteredEmptyState queryText={params.q} onClearFilters={clearFilters} />
  } else if (params.view === 'kanban') {
    content = <KanbanView tasks={filtered} now={now} needle={needle} />
  } else {
    content = <ListView tasks={sorted} now={now} needle={needle} sort={params.sort} />
  }

  return (
    <div className="flex h-dvh flex-col bg-bg md:p-2">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-panel md:rounded-[10px] md:border md:border-line md:shadow-card">
        <TopBar tasks={tasks} />
        {tasks.length > 0 && (
          <section
            aria-label={t('filterBar.sectionAria')}
            className="border-b border-line bg-panel px-4 py-2 md:px-5"
          >
            <FilterBar tasks={tasks} stats={stats} resultCount={filtered.length} />
          </section>
        )}
        <main className="min-h-0 flex-1 overflow-hidden bg-bg/50" id="board">
          {content}
        </main>
        <Outlet />
      </div>
    </div>
  )
}
