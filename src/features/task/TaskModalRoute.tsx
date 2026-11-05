import { DeleteOutlined, LinkOutlined } from '@ant-design/icons'
import { App, Button, Modal, Result, Skeleton, Tooltip } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router'
import type { TaskDraft, TaskStatus } from '@/domain/task'
import { useTranslation } from '@/i18n'
import { useCreateTaskMutation, useGetTasksQuery, useUpdateTaskMutation } from '@/store/api'
import { useAppDispatch } from '@/store/store'
import { requestCardFocus } from '@/store/uiSlice'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { boardHref } from './links'
import { TaskForm } from './TaskForm'
import { TaskMeta } from './TaskMeta'
import { useDeleteWithUndo } from './useDeleteWithUndo'

interface LocationState {
  fromBoard?: boolean
  status?: TaskStatus
}

export function TaskModalRoute({ mode }: { mode: 'create' | 'edit' }) {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const dispatch = useAppDispatch()
  const { message } = App.useApp()
  const { t } = useTranslation()
  const { data: tasks, isLoading, isError } = useGetTasksQuery()
  const [createTask] = useCreateTaskMutation()
  const [updateTask] = useUpdateTaskMutation()
  const deleteWithUndo = useDeleteWithUndo()

  const task = mode === 'edit' ? tasks?.find((t) => t.id === taskId) : undefined
  const [dirty, setDirty] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const skipGuard = useRef(false)
  const focusTarget = useRef<string | null>(taskId ?? null)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !skipGuard.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [dirty])

  useEffect(
    () => () => {
      dispatch(requestCardFocus(focusTarget.current ?? '__none__'))
    },
    [dispatch],
  )

  const close = useCallback(
    (force = false) => {
      skipGuard.current = force
      if (state.fromBoard) void navigate(-1)
      else void navigate(boardHref(location.search), { replace: true })
    },
    [navigate, location.search, state.fromBoard],
  )

  const onDirtyChange = useCallback((value: boolean) => {
    setDirty(value)
  }, [])

  const submit = async (draft: TaskDraft): Promise<boolean> => {
    if (mode === 'create') {
      const id = crypto.randomUUID()
      focusTarget.current = id
      const result = await createTask({ ...draft, id })
      if ('error' in result) return false
      void message.success(t('taskModal.createdToast'))
      close(true)
      return true
    }
    if (!task) return false
    const result = await updateTask({ id: task.id, patch: draft })
    if ('error' in result) return false
    void message.success(t('taskModal.savedToast'))
    return true
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      void message.success(t('taskModal.copiedLinkToast'))
    } catch {
      void message.error(t('taskModal.copyBlockedToast'))
    }
  }

  const notFound = mode === 'edit' && !isLoading && !isError && !task
  const heading =
    mode === 'create'
      ? t('taskModal.createHeading')
      : notFound
        ? t('taskModal.notFoundHeading')
        : t('taskModal.editHeading')

  return (
    <>
      <Modal
        open
        onCancel={() => close()}
        footer={null}
        title={
          <span className="flex items-center gap-2 pr-8">
            <span className="rounded-chip border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-2">
              {task ? `TB-${task.id.slice(0, 4).toUpperCase()}` : t('taskModal.newBadge')}
            </span>
            <span className="text-[13px] font-medium text-ink-2">{heading}</span>
            {task && (
              <Tooltip title={t('taskModal.copyLinkTooltip')}>
                <Button
                  type="text"
                  size="small"
                  icon={<LinkOutlined aria-hidden />}
                  onClick={() => void copyLink()}
                  className="text-ink-3 hover:text-ink"
                >
                  {t('taskModal.copyLinkButton')}
                </Button>
              </Tooltip>
            )}
          </span>
        }
        width={{ xs: '100%', sm: 680 }}
        style={{ top: '3.5vh', paddingBottom: 0 }}
        closable={{ 'aria-label': t('common.closeEsc') }}
        focusable={{ focusTriggerAfterClose: false }}
        destroyOnHidden
        classNames={{
          container: 'flex max-h-[93dvh] flex-col overflow-hidden p-0',
          header: 'mb-0 border-b border-line px-5 py-2.5 sm:px-6',
          body: 'flex min-h-0 flex-1 flex-col pt-2.5',
        }}
      >
        {mode === 'edit' && isLoading && (
          <div className="px-6 pb-8" role="status" aria-label={t('taskModal.loadingAria')}>
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        )}
        {mode === 'edit' && isError && (
          <Result
            status="warning"
            title={t('taskModal.loadErrorTitle')}
            subTitle={t('taskModal.loadErrorSubtitle')}
          />
        )}

        {notFound && (
          <Result
            status="404"
            title={t('taskModal.notFoundTitle')}
            subTitle={
              <>
                {t('taskModal.notFoundDescription')}
                <br />
                {t('taskModal.notFoundIdLabel')}{' '}
                <code className="font-mono text-[12px] text-ink">{taskId}</code>
              </>
            }
            extra={
              <Button type="primary" onClick={() => close(true)}>
                {t('common.backToBoard')}
              </Button>
            }
          />
        )}

        {(mode === 'create' || task) && tasks && (
          <TaskForm
            key={mode === 'create' ? 'new' : task?.id}
            mode={mode}
            task={task}
            tasks={tasks}
            initialStatus={state.status}
            onSubmit={submit}
            onCancel={() => close()}
            onDirtyChange={onDirtyChange}
            footerStart={
              task && (
                <Button
                  danger
                  icon={<DeleteOutlined aria-hidden />}
                  onClick={() => setConfirmDelete(true)}
                >
                  {t('taskModal.deleteButton')}
                </Button>
              )
            }
          >
            {task && <TaskMeta task={task} />}
          </TaskForm>
        )}
      </Modal>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title={t('taskModal.discardTitle')}
        description={t('taskModal.discardDescription')}
        confirmLabel={t('taskModal.discardConfirm')}
        cancelLabel={t('taskModal.discardCancel')}
        tone="danger"
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed()
        }}
        onCancel={() => {
          if (blocker.state === 'blocked') blocker.reset()
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={t('taskModal.deleteConfirmTitle')}
        description={
          <>
            <span className="font-medium text-ink">{task?.title}</span>{' '}
            {t('taskModal.deleteConfirmSuffix')}
          </>
        }
        confirmLabel={t('taskModal.deleteButton')}
        tone="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          if (!task) return
          focusTarget.current = null
          void deleteWithUndo(task)
          close(true)
        }}
      />
    </>
  )
}
