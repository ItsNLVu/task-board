import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { TASK_STATUSES, type Task, type TaskStatus } from '@/domain/task'
import { TaskCard } from '@/features/task/TaskCard'
import { useTranslation } from '@/i18n'
import { useMoveTaskMutation } from '@/store/api'
import { KanbanColumn } from './KanbanColumn'
import { useCardFocusReturn } from './useCardFocusReturn'

type Columns = Record<TaskStatus, string[]>

const COLUMN_PREFIX = 'column:'

function buildColumns(tasks: readonly Task[]): Columns {
  const columns: Columns = { todo: [], in_progress: [], done: [] }
  const sorted = [...tasks].sort((a, b) => a.order - b.order)
  for (const t of sorted) columns[t.status].push(t.id)
  return columns
}

function findColumn(columns: Columns, id: string): TaskStatus | null {
  if (id.startsWith(COLUMN_PREFIX)) return id.slice(COLUMN_PREFIX.length) as TaskStatus
  return TASK_STATUSES.find((s) => columns[s].includes(id)) ?? null
}

interface KanbanViewProps {
  tasks: Task[]
  now: number
  needle: string
}

export function KanbanView({ tasks, now, needle }: KanbanViewProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const [moveTask] = useMoveTaskMutation()
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])
  const derived = useMemo(() => buildColumns(tasks), [tasks])
  const [dragColumns, setDragColumns] = useState<Columns | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const columns = dragColumns ?? derived
  const scrollRefs = useRef(new Map<TaskStatus, (id: string) => boolean>())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      const targetList = derived[status]
      const prevId = targetList[targetList.length - 1] ?? null
      void moveTask({ id: taskId, target: { status, prevId, nextId: null } })
    },
    [derived, moveTask],
  )

  const scrollTo = useCallback(
    (taskId: string) => {
      const status = byId.get(taskId)?.status
      return status ? (scrollRefs.current.get(status)?.(taskId) ?? false) : false
    },
    [byId],
  )
  useCardFocusReturn(scrollTo)

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
    setDragColumns(derived)
  }

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const activeKey = String(active.id)
    const overKey = String(over.id)
    if (activeKey === overKey) return
    setDragColumns((current) => {
      const cols = current ?? derived
      const from = findColumn(cols, activeKey)
      const to = findColumn(cols, overKey)
      if (!from || !to) return cols
      if (from === to) {
        const list = cols[from]
        const fromIdx = list.indexOf(activeKey)
        const toIdx = list.indexOf(overKey)
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return cols
        return { ...cols, [from]: arrayMove(list, fromIdx, toIdx) }
      }
      const target = cols[to]
      const overIndex = target.indexOf(overKey)
      const insertAt = overIndex === -1 ? target.length : overIndex
      return {
        ...cols,
        [from]: cols[from].filter((id) => id !== activeKey),
        [to]: [...target.slice(0, insertAt), activeKey, ...target.slice(insertAt)],
      }
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id)
    const cols = dragColumns ?? derived
    setActiveId(null)
    setDragColumns(null)
    if (!over) return
    const status = findColumn(cols, id)
    if (!status) return
    let list = cols[status]
    const overIndex = list.indexOf(String(over.id))
    const fromIndex = list.indexOf(id)
    if (overIndex !== -1 && overIndex !== fromIndex) list = arrayMove(list, fromIndex, overIndex)

    const index = list.indexOf(id)
    const prevId = list[index - 1] ?? null
    const nextId = list[index + 1] ?? null
    const original = derived[byId.get(id)?.status ?? status]
    const originalIndex = original.indexOf(id)
    const unchanged =
      byId.get(id)?.status === status &&
      (original[originalIndex - 1] ?? null) === prevId &&
      (original[originalIndex + 1] ?? null) === nextId
    if (unchanged) return
    void moveTask({ id, target: { status, prevId, nextId } })
  }

  const title = (id: string | number) => byId.get(String(id))?.title ?? 'task'
  const statusOf = (id: string | number | undefined) => {
    if (id === undefined) return null
    const s = findColumn(columns, String(id))
    return s ? t(`domain.status.${s}`) : null
  }
  const announcements: Announcements = {
    onDragStart: ({ active }) => t('kanbanView.dragPickedUp', { title: title(active.id) }),
    onDragOver: ({ active, over }) =>
      over
        ? t('kanbanView.dragOverColumn', {
            title: title(active.id),
            status: statusOf(over.id) ?? '',
          })
        : t('kanbanView.dragNotOverColumn', { title: title(active.id) }),
    onDragEnd: ({ active, over }) =>
      over
        ? t('kanbanView.dragDroppedColumn', {
            title: title(active.id),
            status: statusOf(over.id) ?? '',
          })
        : t('kanbanView.dragCancelled', { title: title(active.id) }),
    onDragCancel: ({ active }) => t('kanbanView.dragCancelled', { title: title(active.id) }),
  }

  const activeTask = activeId ? byId.get(activeId) : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null)
        setDragColumns(null)
      }}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: t('kanbanView.screenReaderDraggable'),
        },
      }}
    >
      <div
        className="flex h-full min-h-0 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pt-3 pb-4 md:grid md:snap-none md:grid-cols-3 md:grid-rows-[minmax(0,1fr)] md:overflow-x-visible md:px-5"
        data-testid="kanban-view"
      >
        {TASK_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            ids={columns[status]}
            byId={byId}
            now={now}
            needle={needle}
            search={location.search}
            scrollRefs={scrollRefs}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="pointer-events-none scale-[1.02] rotate-[1.2deg]">
            <TaskCard task={activeTask} now={now} needle={needle} href="#" dragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
