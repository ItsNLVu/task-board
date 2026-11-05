import { App } from 'antd'
import { t } from '@/i18n'

type AppApi = ReturnType<typeof App.useApp>

let api: AppApi | null = null

export function bindNotifier(next: AppApi | null): void {
  api = next
}

export function notifyError(message: string, title = t('common.saveFailedTitle')): void {
  api?.notification.error({
    title,
    description: message,
    placement: 'bottomRight',
    duration: 6,
  })
}
