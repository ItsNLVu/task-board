import { BROADCAST_CHANNELS, STORAGE_KEYS } from '@/common'

export const TASKS_STORAGE_KEY = STORAGE_KEYS.tasks
const CHANNEL_NAME = BROADCAST_CHANNELS.tasksSync

interface ChangeMessage {
  type: 'tasks-changed'
  tabId: string
}

export function createTabSync() {
  const tabId = crypto.randomUUID()
  const channel =
    typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME)

  return {
    notify() {
      channel?.postMessage({ type: 'tasks-changed', tabId } satisfies ChangeMessage)
    },
    subscribe(onChange: () => void): () => void {
      if (channel) {
        const handler = (event: MessageEvent<Partial<ChangeMessage> | null>) => {
          if (event.data?.type === 'tasks-changed' && event.data.tabId !== tabId) onChange()
        }
        channel.addEventListener('message', handler)
        return () => {
          channel.removeEventListener('message', handler)
        }
      }
      const handler = (event: StorageEvent) => {
        if (event.key === TASKS_STORAGE_KEY) onChange()
      }
      window.addEventListener('storage', handler)
      return () => {
        window.removeEventListener('storage', handler)
      }
    },
  }
}

export type TabSync = ReturnType<typeof createTabSync>
