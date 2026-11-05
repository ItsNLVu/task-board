import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PlusOutlined } from '@ant-design/icons'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Tooltip } from 'antd'
import { useRef, type RefObject } from 'react'
import { Link } from 'react-router'
import type { Task, TaskStatus } from '@/domain/task'
import { newTaskHref, taskHref } from '@/features/task/links'
import { StatusIcon } from '@/features/task/TaskBits'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/cn'
import { SortableKanbanCard } from './kanban/SortableKanbanCard'

const columnId = (status: TaskStatus) => `column:${status}`

export interface KanbanColumnProps {
  status: TaskStatus
  ids: string[]
  byId: Map<string, Task>
  now: number
  needle: string
  search: string
  scrollRefs: RefObject<Map<TaskStatus, (id: string) => boolean>>
  onStatusChange: (taskId: string, status: TaskStatus) => void
}

export function KanbanColumn({
  status,
  ids,
  byId,
  now,
  needle,
  search,
  scrollRefs,
  onStatusChange,
}: KanbanColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { setNodeRef, isOver } = useDroppable({ id: columnId(status) })
  const { t } = useTranslation()
  const statusLabel = t(`domain.status.${status}`)

  const virtualizer = useVirtualizer({
    count: ids.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 114,
    overscan: 3,
    getItemKey: (i) => ids[i] ?? i,
  })

  scrollRefs.current.set(status, (id) => {
    const index = ids.indexOf(id)
    if (index === -1) return false
    virtualizer.scrollToIndex(index, { align: 'auto' })
    return true
  })

  return (
    <section
      aria-labelledby={`col-${status}`}
      data-testid={`kanban-col-${status}`}
      className={cn(
        'flex h-full min-h-0 w-[min(85vw,340px)] shrink-0 snap-start flex-col rounded-panel border bg-panel-2/65 transition-all duration-150 md:w-auto md:min-w-0',
        isOver ? 'border-accent bg-accent-soft/35 ring-2 ring-accent/20' : 'border-line',
      )}
    >
      <header className="flex items-center gap-2 rounded-t-panel border-b border-line bg-panel/85 px-3 py-2">
        <StatusIcon status={status} decorative />
        <h2 id={`col-${status}`} className="text-[13px] font-semibold text-ink">
          {statusLabel}
        </h2>
        <span className="tabular rounded-chip border border-line bg-panel px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-2">
          {ids.length}
        </span>
        <Tooltip
          title={t('kanbanView.createInColumn', { status: statusLabel })}
          mouseEnterDelay={0.3}
        >
          <Link
            to={newTaskHref(search)}
            state={{ fromBoard: true, status }}
            aria-label={t('kanbanView.createInColumn', { status: statusLabel })}
            className="ml-auto flex size-8 items-center justify-center rounded-chip text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink md:size-6"
          >
            <PlusOutlined aria-hidden />
          </Link>
        </Tooltip>
      </header>
      <SortableContext id={columnId(status)} items={ids} strategy={verticalListSortingStrategy}>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-2.5">
          <div
            ref={setNodeRef}
            className="relative min-h-full"
            style={{ height: Math.max(virtualizer.getTotalSize(), 120) }}
          >
            {ids.length === 0 && (
              <p className="absolute inset-x-0 top-0 flex h-28 items-center justify-center rounded-panel border-2 border-dashed border-line bg-panel/45 px-3 text-center text-[12px] text-ink-3">
                {t('kanbanView.emptyColumnDrop', { status: statusLabel })}
              </p>
            )}
            {virtualizer.getVirtualItems().map((item) => {
              const task = byId.get(ids[item.index] ?? '')
              if (!task) return null
              return (
                <div
                  key={task.id}
                  data-index={item.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full pb-2.5"
                  style={{ transform: `translateY(${item.start}px)` }}
                >
                  <SortableKanbanCard
                    task={task}
                    now={now}
                    needle={needle}
                    href={taskHref(task.id, search)}
                    onStatusChange={onStatusChange}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </SortableContext>
    </section>
  )
}
