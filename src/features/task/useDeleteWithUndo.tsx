import { DeleteOutlined } from '@ant-design/icons'
import { App, Button } from 'antd'
import { useCallback } from 'react'
import { TIME_MS, UI_TIMINGS } from '@/common'
import type { Task } from '@/domain/task'
import { t } from '@/i18n'
import { useDeleteTaskMutation, useRestoreTaskMutation } from '@/store/api'

const UNDO_WINDOW_MS = UI_TIMINGS.undoDeleteWindowMs

let pending: { task: Task; key: string } | null = null

function useRestorePending() {
  const [restoreTask] = useRestoreTaskMutation()
  const { notification, message } = App.useApp()
  return useCallback(async () => {
    const current = pending
    if (!current) return
    pending = null
    notification.destroy(current.key)
    const res = await restoreTask(current.task)
    if (!('error' in res)) {
      void message.success(t('taskModal.undoRestoredToast', { title: current.task.title }))
    }
  }, [restoreTask, notification, message])
}

export function useDeleteWithUndo() {
  const [deleteTask] = useDeleteTaskMutation()
  const { notification } = App.useApp()
  const restore = useRestorePending()

  return useCallback(
    async (task: Task): Promise<boolean> => {
      const result = await deleteTask(task.id)
      if ('error' in result) return false
      const key = `undo-${task.id}`
      if (pending) notification.destroy(pending.key)
      pending = { task, key }
      notification.open({
        key,
        icon: <DeleteOutlined className="text-ink-2" />,
        title: t('taskModal.undoDeletedTitle', { title: task.title }),
        description: t('taskModal.undoDeletedDescription'),
        duration: UNDO_WINDOW_MS / TIME_MS.second,
        showProgress: true,
        pauseOnHover: true,
        actions: (
          <Button type="primary" size="small" onClick={() => void restore()}>
            {t('common.undo')}
          </Button>
        ),
        onClose: () => {
          if (pending?.key === key) pending = null
        },
      })
      return true
    },
    [deleteTask, notification, restore],
  )
}
