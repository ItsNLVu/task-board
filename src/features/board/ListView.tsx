import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { nowDividerIndex, type SortKey } from '@/domain/query'
import { TASK_STATUSES, type Task, type TaskStatus } from '@/domain/task'
import { taskHref } from '@/features/task/links'
import { TaskCard } from '@/features/task/TaskCard'
import { useTranslation } from '@/i18n'
import { useMoveTaskMutation } from '@/store/api'
import { buildRows, columnsFor, STATUS_DROP_PREFIX } from './list/listLayout'
import { NowDivider, SortableListCard, StatusDropTarget } from './list/ListViewBits'
import { useBoardParams } from './useBoardParams'
import { useCardFocusReturn } from './useCardFocusReturn'

interface ListViewProps {
  tasks: Task[]
  now: number
  needle: string
  sort: SortKey
}

export function ListView({ tasks, now, needle, sort }: ListViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(() =>
    typeof window !== 'undefined' ? columnsFor(window.innerWidth - 48) : 1,
  )
  const location = useLocation()
  const { update } = useBoardParams()
  const { t } = useTranslation()
  const [moveTask] = useMoveTaskMutation()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setColumns(columnsFor(entry.contentRect.width))
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [])

  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  const handleStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      void moveTask({ id: taskId, target: { status, prevId: null, nextId: null } })
    },
    [moveTask],
  )

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id)
    setActiveId(null)
    if (!over) return
    const overId = String(over.id)
    const activeTask = byId.get(id)
    if (!activeTask) return

    if (overId.startsWith(STATUS_DROP_PREFIX)) {
      const nextStatus = overId.slice(STATUS_DROP_PREFIX.length) as TaskStatus
      if (nextStatus !== activeTask.status) {
        void moveTask({ id, target: { status: nextStatus, prevId: null, nextId: null } })
      }
      return
    }

    if (overId === id) return
    const fromIdx = tasks.findIndex((t) => t.id === id)
    const toIdx = tasks.findIndex((t) => t.id === overId)
    if (fromIdx === -1 || toIdx === -1) return

    const reordered = [...tasks]
    const [moved] = reordered.splice(fromIdx, 1)
    if (!moved) return
    reordered.splice(toIdx, 0, moved)

    const targetStatus = byId.get(overId)?.status ?? activeTask.status
    const sameStatusNeighbours = reordered.filter((t) => t.status === targetStatus || t.id === id)
    const pos = sameStatusNeighbours.findIndex((t) => t.id === id)
    const prevId = sameStatusNeighbours[pos - 1]?.id ?? null
    const nextId = sameStatusNeighbours[pos + 1]?.id ?? null

    if (sort !== 'order') update({ sort: 'order' })
    void moveTask({ id, target: { status: targetStatus, prevId, nextId } })
  }

  const divider = sort === 'deadline' && tasks.length > 0 ? nowDividerIndex(tasks, now) : null
  const rows = useMemo(() => buildRows(tasks, columns, divider), [tasks, columns, divider])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (rows[i]?.kind === 'now' ? 40 : 124),
    overscan: 6,
    getItemKey: (i) => {
      const row = rows[i]
      return !row || row.kind === 'now' ? 'now' : (row.tasks[0]?.id ?? i)
    },
  })

  const scrollTo = useCallback(
    (taskId: string) => {
      const index = rows.findIndex(
        (r) => r.kind === 'cards' && r.tasks.some((t) => t.id === taskId),
      )
      if (index === -1) return false
      virtualizer.scrollToIndex(index, { align: 'auto' })
      return true
    },
    [rows, virtualizer],
  )
  useCardFocusReturn(scrollTo)

  const activeTask = activeId ? byId.get(activeId) : undefined
  const virtualItems = virtualizer.getVirtualItems()
  const visibleTaskIds = virtualItems.flatMap((item) => {
    const row = rows[item.index]
    return row?.kind === 'cards' ? row.tasks.map((t) => t.id) : []
  })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto px-4 pt-3 pb-8 md:px-5"
        data-testid="list-view"
      >
        {activeTask && (
          <div
            className="sticky top-0 z-20 mb-3 flex gap-2 rounded-panel border border-accent/30 bg-panel/95 p-2 shadow-card backdrop-blur-xs"
            role="region"
            aria-label={t('listView.quickStatusAria')}
          >
            {TASK_STATUSES.map((s) => (
              <StatusDropTarget key={s} status={s} />
            ))}
          </div>
        )}

        <SortableContext items={visibleTaskIds} strategy={rectSortingStrategy}>
          <ul
            aria-label={t('listView.listAria')}
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualItems.map((item) => {
              const row = rows[item.index]
              if (!row) return null
              return (
                <li
                  key={item.key}
                  data-index={item.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full pb-2.5"
                  style={{ transform: `translateY(${item.start}px)` }}
                >
                  {row.kind === 'now' ? (
                    <NowDivider now={now} overdue={divider ?? 0} />
                  ) : (
                    <div
                      className="grid items-stretch gap-2.5"
                      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                      {row.tasks.map((task) => (
                        <SortableListCard
                          key={task.id}
                          task={task}
                          now={now}
                          needle={needle}
                          href={taskHref(task.id, location.search)}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </SortableContext>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="pointer-events-none scale-[1.02] rotate-[1deg]">
            <TaskCard task={activeTask} now={now} needle={needle} href="#" dragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
