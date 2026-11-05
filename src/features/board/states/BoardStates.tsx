import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Empty, Skeleton } from 'antd'
import { useCallback, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { SEED_PRESETS } from '@/common'
import { useSeed } from '@/features/data/useSeed'
import { newTaskHref } from '@/features/task/links'
import { useTranslation } from '@/i18n'
import { useCardFocusReturn } from '../useCardFocusReturn'

export function NoCards({ children }: { children: ReactNode }) {
  useCardFocusReturn(useCallback(() => false, []))
  return <div className="flex justify-center px-4 py-16">{children}</div>
}

export function FirstRunState() {
  const { seed, isSeeding } = useSeed()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <NoCards>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="flex max-w-sm flex-col gap-1">
            <span className="text-[15px] font-semibold text-ink">
              {t('boardStates.emptyTitle')}
            </span>
            <span className="text-[13px] text-ink-2">{t('boardStates.emptyDescription')}</span>
          </div>
        }
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="primary"
            icon={<ThunderboltOutlined aria-hidden />}
            loading={isSeeding}
            onClick={() => void seed(SEED_PRESETS.sampleCount)}
          >
            {t('boardStates.seedButton')}
          </Button>
          <Button
            icon={<PlusOutlined aria-hidden />}
            onClick={() =>
              void navigate(newTaskHref(location.search), { state: { fromBoard: true } })
            }
          >
            {t('topBar.newTask')}
          </Button>
        </div>
      </Empty>
    </NoCards>
  )
}

export function LoadingCardsState() {
  const { t } = useTranslation()
  return (
    <div
      className="grid gap-3 px-4 pt-4 sm:grid-cols-2 md:px-5 lg:grid-cols-3"
      role="status"
      aria-label={t('boardStates.loadingAria')}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="rounded-panel border border-line bg-panel p-3.5">
          <Skeleton
            active
            title={{ width: '70%' }}
            paragraph={{ rows: 2, width: ['100%', '40%'] }}
          />
        </div>
      ))}
    </div>
  )
}

export function FilteredEmptyState({
  queryText,
  onClearFilters,
}: {
  queryText: string
  onClearFilters: () => void
}) {
  const { t } = useTranslation()
  return (
    <NoCards>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold text-ink">
              {t('boardStates.filteredEmptyTitle')}
            </span>
            <span className="text-[13px] text-ink-2">
              {queryText
                ? t('boardStates.filteredEmptyWithQuery', { query: queryText })
                : t('boardStates.filteredEmptyNoQuery')}
            </span>
          </div>
        }
      >
        <Button onClick={onClearFilters}>{t('boardStates.clearFiltersButton')}</Button>
      </Empty>
    </NoCards>
  )
}
