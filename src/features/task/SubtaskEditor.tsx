import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DeleteOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Checkbox, Input } from 'antd'
import { useState } from 'react'
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
} from 'react-hook-form'
import type { TaskFormInput } from '@/domain/schema'
import { LIMITS } from '@/domain/task'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/cn'

interface SubtaskRowProps {
  id: string
  index: number
  control: Control<TaskFormInput>
  titleFallback: string
  done: boolean
  error?: string
  onRemove: () => void
}

function SortableSubtaskRow({
  id,
  index,
  control,
  titleFallback,
  done,
  error,
  onRemove,
}: SubtaskRowProps) {
  const { t } = useTranslation()
  const {
    setNodeRef,
    setActivatorNodeRef,
    listeners,
    attributes,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'group flex items-start gap-1.5 border-b border-line bg-panel px-2 py-0.5 last:border-b-0',
        isDragging && 'z-10 rounded-control bg-accent-soft/60 shadow-card ring-1 ring-accent/40',
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t('taskForm.subtaskReorderAria', { index: index + 1 })}
        className="mt-1 flex size-5 shrink-0 cursor-grab items-center justify-center rounded-chip text-ink-3 hover:bg-panel-2 hover:text-ink active:cursor-grabbing"
      >
        <HolderOutlined aria-hidden className="text-[11px]" />
      </button>
      <Controller
        control={control}
        name={`subtasks.${index}.done`}
        render={({ field: f }) => (
          <Checkbox
            checked={f.value}
            onChange={(e) => f.onChange(e.target.checked)}
            aria-label={t('taskForm.subtaskMarkDoneAria', { title: titleFallback })}
            className="mt-1"
          />
        )}
      />
      <div className="min-w-0 flex-1">
        <Controller
          control={control}
          name={`subtasks.${index}.title`}
          render={({ field: f }) => (
            <Input
              {...f}
              variant="borderless"
              size="small"
              status={error ? 'error' : undefined}
              aria-label={t('taskForm.subtaskTitleAria', { index: index + 1 })}
              aria-invalid={Boolean(error)}
              className={cn('px-1 py-0.5', done && 'text-ink-3 line-through')}
            />
          )}
        />
        {error && <p className="px-1 text-[12px] text-danger">{error}</p>}
      </div>
      <Button
        type="text"
        size="small"
        icon={<DeleteOutlined aria-hidden />}
        aria-label={t('taskForm.subtaskDeleteAria', { title: titleFallback })}
        title={t('taskForm.subtaskDeleteTitle')}
        onClick={onRemove}
        className="mt-0.5 text-ink-3 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
      />
    </li>
  )
}

interface SubtaskEditorProps {
  control: Control<TaskFormInput>
  errors: FieldErrors<TaskFormInput>['subtasks']
}

export function SubtaskEditor({ control, errors }: SubtaskEditorProps) {
  const { t } = useTranslation()
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'subtasks',
    keyName: 'key',
  })
  const live = useWatch({ control, name: 'subtasks' })
  const [draft, setDraft] = useState('')
  const doneCount = live.filter((s) => s.done).length
  const pct = fields.length ? Math.round((doneCount / fields.length) * 100) : 0
  const full = fields.length >= LIMITS.subtasksMax

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const add = () => {
    const title = draft.trim()
    if (!title || full) return
    append({ id: crypto.randomUUID(), title, done: false })
    setDraft('')
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = fields.findIndex((f) => f.key === active.id)
    const to = fields.findIndex((f) => f.key === over.id)
    if (from !== -1 && to !== -1) move(from, to)
  }

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{t('taskForm.subtasksLegend')}</legend>
      <div className="mb-1.5 flex items-center gap-2.5 text-[12px] font-medium text-ink-2">
        <span className="shrink-0 whitespace-nowrap">{t('taskForm.subtasksLegend')}</span>
        {fields.length > 0 && (
          <div className="inline-flex items-center gap-2">
            <span
              role="progressbar"
              aria-label={t('taskForm.subtasksProgressAria')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-panel-2"
            >
              <span
                className="block h-full rounded-full bg-accent transition-all duration-150"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="tabular shrink-0 font-mono text-[11px] font-normal whitespace-nowrap text-ink-3">
              {doneCount}/{fields.length}
            </span>
          </div>
        )}
      </div>

      {fields.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.key)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col overflow-hidden rounded-control border border-line">
              {fields.map((field, index) => (
                <SortableSubtaskRow
                  key={field.key}
                  id={field.key}
                  index={index}
                  control={control}
                  titleFallback={live[index]?.title ?? field.title}
                  done={live[index]?.done ?? false}
                  error={errors?.[index]?.title?.message}
                  onRemove={() => remove(index)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-1.5 flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          onBlur={add}
          disabled={full}
          prefix={<PlusOutlined aria-hidden className="text-ink-3" />}
          placeholder={
            full
              ? t('taskForm.subtaskFullPlaceholder', { max: LIMITS.subtasksMax })
              : t('taskForm.subtaskNewPlaceholder')
          }
          aria-label={t('taskForm.subtaskNewAria')}
          maxLength={LIMITS.subtaskTitleMax}
        />
        <Button onClick={add} disabled={!draft.trim() || full}>
          {t('taskForm.subtaskAddButton')}
        </Button>
      </div>
      {errors?.root?.message && (
        <p className="mt-1 text-[12px] text-danger">{errors.root.message}</p>
      )}
    </fieldset>
  )
}
