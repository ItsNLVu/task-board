import { App } from 'antd'
import { useCallback } from 'react'
import { generateSeedTasks } from '@/domain/seed'
import { localeStore, t } from '@/i18n'
import { useImportTasksMutation } from '@/store/api'

export function useSeed() {
  const [importTasks, { isLoading }] = useImportTasksMutation()
  const { message } = App.useApp()
  const seed = useCallback(
    async (count: number) => {
      const result = await importTasks({
        records: generateSeedTasks(count, Date.now()),
        mode: 'replace',
      })
      if ('error' in result) {
        void message.error(result.error?.message ?? t('common.actionFailedRetry'))
      } else {
        const numberLocale = localeStore.get() === 'en' ? 'en-US' : 'vi-VN'
        void message.success(
          t('dataMenu.seededToast', { count: result.data.imported.toLocaleString(numberLocale) }),
        )
      }
    },
    [importTasks, message],
  )
  return { seed, isSeeding: isLoading }
}
