import { useSortable } from '@dnd-kit/sortable'
import { HolderOutlined } from '@ant-design/icons'
import type { Task, TaskStatus } from '@/domain/task'
import { TaskCard } from '@/features/task/TaskCard'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/cn'

export interface CardSlotProps {
  task: Task
  now: number
  needle: string
  href: string
  onStatusChange: (taskId: string, status: TaskStatus) => void
}

export function SortableKanbanCard({ task, now, needle, href, onStatusChange }: CardSlotProps) {
  const { t } = useTranslation()
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } = useSortable({
    id: task.id,
  })
  const { onKeyDown, ...pointerListeners } = (listeners ?? {}) as Record<
    string,
    (e: unknown) => void
  >

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'cursor-grab touch-manipulation active:cursor-grabbing',
        isDragging &&
          'rounded-panel border-2 border-dashed border-accent/60 bg-accent-soft/45 [&>*]:invisible',
      )}
      {...pointerListeners}
    >
      <TaskCard
        task={task}
        now={now}
        needle={needle}
        href={href}
        onStatusChange={onStatusChange}
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            onKeyDown={onKeyDown}
            aria-label={t('kanbanView.moveCardAria', { title: task.title })}
            className="relative z-10 -mt-1 -mr-1 flex size-8 shrink-0 cursor-grab items-center justify-center rounded-chip text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink active:cursor-grabbing md:size-6"
          >
            <HolderOutlined aria-hidden />
          </button>
        }
      />
    </div>
  )
}
