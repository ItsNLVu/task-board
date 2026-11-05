import { SwapOutlined } from '@ant-design/icons'
import { Segmented, Select, Tooltip } from 'antd'
import { useId, useMemo } from 'react'
import { UI_TIMINGS } from '@/common'
import { DUE_RANGES, type DueRange } from '@/domain/deadline'
import { collectTags, SORT_KEYS, type SortKey } from '@/domain/query'
import { PRIORITIES_DESC, TASK_STATUSES, type Task, type TaskPriority } from '@/domain/task'
import { PriorityIcon, StatusIcon } from '@/features/task/TaskBits'
import { useTranslation } from '@/i18n'
import { FilterChip } from '@/ui/FilterChip'
import { toggleIn } from '../boardParams'
import { useBoardParams } from '../useBoardParams'

const lower = (s: string) => s.toLocaleLowerCase('vi')

export type DueOption = DueRange | 'all'

export function PrioritySelect({ block }: { block?: boolean }) {
  const { params, update } = useBoardParams()
  const { t } = useTranslation()
  return (
    <Select<TaskPriority[]>
      mode="multiple"
      aria-label={t('filterBar.priorityAria')}
      placeholder={t('filterBar.priorityPlaceholder')}
      value={params.priority}
      onChange={(priority) => update({ priority })}
      options={PRIORITIES_DESC.map((p) => ({
        value: p,
        label: (
          <span className="inline-flex items-center gap-1.5">
            <PriorityIcon priority={p} />
            <span>{t(`domain.priority.${p}`)}</span>
          </span>
        ),
      }))}
      maxTagCount="responsive"
      allowClear
      popupMatchSelectWidth={168}
      size={block ? 'large' : 'small'}
      className={block ? 'w-full' : 'max-w-44 min-w-25'}
    />
  )
}

export function TagFilter({ tasks, block }: { tasks: readonly Task[]; block?: boolean }) {
  const { params, update } = useBoardParams()
  const { t } = useTranslation()
  const tags = useMemo(() => collectTags(tasks), [tasks])
  const value = params.tags.map((tag) => tags.find((x) => lower(x.tag) === lower(tag))?.tag ?? tag)

  return (
    <Select
      mode="multiple"
      aria-label={t('filterBar.tagAria')}
      placeholder={t('filterBar.tagPlaceholder')}
      value={value}
      onChange={(next: string[]) => update({ tags: next })}
      options={tags.map(({ tag, count }) => ({
        value: tag,
        label: (
          <span className="flex items-center justify-between gap-3">
            <span className="truncate">{tag}</span>
            <span className="tabular font-mono text-[11px] text-ink-3">{count}</span>
          </span>
        ),
        title: tag,
      }))}
      optionLabelProp="value"
      maxTagCount="responsive"
      allowClear
      showSearch={{ optionFilterProp: 'value' }}
      notFoundContent={<span className="text-[12px] text-ink-3">{t('filterBar.tagNotFound')}</span>}
      popupMatchSelectWidth={200}
      size={block ? 'large' : 'small'}
      className={block ? 'w-full' : 'max-w-44 min-w-22'}
    />
  )
}

export function DueSelect() {
  const { params, update } = useBoardParams()
  const { t } = useTranslation()
  return (
    <Select<DueOption>
      aria-label={t('filterBar.dueAria')}
      value={params.due ?? 'all'}
      onChange={(v) => update({ due: v === 'all' ? null : v })}
      options={[
        { value: 'all', label: t('filterBar.duePrefix', { label: t('domain.due.all') }) },
        ...DUE_RANGES.map((r) => ({
          value: r,
          label: t('filterBar.duePrefix', { label: t(`domain.due.${r}`) }),
        })),
      ]}
      popupMatchSelectWidth={160}
      size="small"
      className="w-30"
    />
  )
}

export function SortSelect() {
  const { params, update } = useBoardParams()
  const { t } = useTranslation()
  return (
    <Tooltip title={t('filterBar.sortPrefix')} mouseEnterDelay={UI_TIMINGS.tooltipDelay}>
      <Select<SortKey>
        aria-label={t('filterBar.sortAria')}
        prefix={<SwapOutlined rotate={90} aria-hidden className="text-[11px] text-ink-3" />}
        value={params.sort}
        onChange={(sort) => update({ sort })}
        options={SORT_KEYS.map((key) => ({ value: key, label: t(`domain.sort.${key}`) }))}
        popupMatchSelectWidth={false}
        size="small"
        className="min-w-44"
      />
    </Tooltip>
  )
}

export function MobileFilterControls({ tasks }: { tasks: readonly Task[] }) {
  const { params, update } = useBoardParams()
  const { t } = useTranslation()
  const uid = useId()
  const ids = { status: `${uid}-status`, priority: `${uid}-priority`, due: `${uid}-due` }
  const label = 'w-full text-[11.5px] font-medium text-ink-3 select-none'

  return (
    <div className="flex flex-col items-stretch gap-5">
      <div
        role="group"
        aria-labelledby={ids.status}
        className="flex flex-wrap items-center gap-1.5"
      >
        <span id={ids.status} className={label}>
          {t('filterBar.statusGroupLabel')}
        </span>
        {TASK_STATUSES.map((status) => (
          <FilterChip
            key={status}
            size="large"
            icon={<StatusIcon status={status} decorative />}
            pressed={params.status.includes(status)}
            onPressedChange={() => update({ status: toggleIn(params.status, status) })}
          >
            {t(`domain.status.${status}`)}
          </FilterChip>
        ))}
      </div>

      <div
        role="group"
        aria-labelledby={ids.priority}
        className="flex flex-wrap items-center gap-1.5"
      >
        <span id={ids.priority} className={label}>
          {t('filterBar.priorityGroupLabel')}
        </span>
        {PRIORITIES_DESC.map((priority) => (
          <FilterChip
            key={priority}
            size="large"
            icon={<PriorityIcon priority={priority} />}
            pressed={params.priority.includes(priority)}
            onPressedChange={() => update({ priority: toggleIn(params.priority, priority) })}
          >
            {t(`domain.priority.${priority}`)}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={label}>{t('filterBar.tagGroupLabel')}</span>
        <TagFilter tasks={tasks} block />
      </div>

      <div className="flex flex-col gap-1.5">
        <span id={ids.due} className={label}>
          {t('filterBar.dueGroupLabel')}
        </span>
        <Segmented<DueOption>
          aria-labelledby={ids.due}
          size="middle"
          block
          value={params.due ?? 'all'}
          onChange={(v) => update({ due: v === 'all' ? null : v })}
          options={[
            { value: 'all', label: t('domain.due.all') },
            ...DUE_RANGES.map((r) => ({ value: r, label: t(`domain.due.${r}`) })),
          ]}
        />
      </div>
    </div>
  )
}
