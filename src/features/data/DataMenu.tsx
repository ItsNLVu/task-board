import {
  BugOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownOutlined,
  ExportOutlined,
  ImportOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { App, Button, Dropdown, Switch, type MenuProps } from 'antd'
import { useState, useSyncExternalStore } from 'react'
import { SEED_PRESETS } from '@/common'
import { buildExport, exportFileName } from '@/domain/importExport'
import type { Task } from '@/domain/task'
import { useTranslation } from '@/i18n'
import { downloadJson } from '@/lib/download'
import { failureSimulation, SIMULATED_FAILURE_RATE } from '@/services/simulation'
import { useClearTasksMutation } from '@/store/api'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { ImportDialog } from './ImportDialog'
import { useSeed } from './useSeed'

type Pending = { kind: 'seed'; count: number } | { kind: 'clear' } | null

const RATE = Math.round(SIMULATED_FAILURE_RATE * 100)

export function DataMenu({ tasks }: { tasks: readonly Task[] }) {
  const [pending, setPending] = useState<Pending>(null)
  const [importOpen, setImportOpen] = useState(false)
  const { seed } = useSeed()
  const { message } = App.useApp()
  const { locale, t } = useTranslation()
  const [clearTasks] = useClearTasksMutation()
  const simulate = useSyncExternalStore(failureSimulation.subscribe, failureSimulation.isEnabled)
  const empty = tasks.length === 0
  const numberLocale = locale === 'en' ? 'en-US' : 'vi-VN'

  const askSeed = (count: number) => {
    if (empty) void seed(count)
    else setPending({ kind: 'seed', count })
  }

  const items: MenuProps['items'] = [
    {
      type: 'group',
      label: t('dataMenu.groupSample'),
      children: [
        { key: 'seed-50', icon: <ThunderboltOutlined />, label: t('dataMenu.seed50') },
        { key: 'seed-1000', icon: <DatabaseOutlined />, label: t('dataMenu.seed1000') },
      ],
    },
    { type: 'divider' },
    {
      type: 'group',
      label: t('dataMenu.groupJson'),
      children: [
        {
          key: 'export',
          icon: <ExportOutlined />,
          label: t('dataMenu.exportAll'),
          disabled: empty,
        },
        { key: 'import', icon: <ImportOutlined />, label: t('dataMenu.importFromFile') },
      ],
    },
    { type: 'divider' },
    {
      type: 'group',
      label: t('dataMenu.groupRollback'),
      children: [
        {
          key: 'simulate',
          icon: <BugOutlined />,
          label: (
            <span className="flex items-center justify-between gap-4">
              <span>
                {t('dataMenu.simulateLabel', { rate: RATE })}
                <span className="sr-only">
                  {simulate ? t('dataMenu.simulateOnSr') : t('dataMenu.simulateOffSr')}
                </span>
              </span>
              <Switch size="small" checked={simulate} tabIndex={-1} aria-hidden />
            </span>
          ),
        },
      ],
    },
    { type: 'divider' },
    {
      key: 'clear',
      icon: <DeleteOutlined />,
      label: t('dataMenu.clearAll'),
      danger: true,
      disabled: empty,
    },
  ]

  const onClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'seed-50':
        askSeed(SEED_PRESETS.sampleCount)
        break
      case 'seed-1000':
        askSeed(SEED_PRESETS.stressTestCount)
        break
      case 'export': {
        const now = new Date()
        downloadJson(exportFileName(now), buildExport(tasks, now))
        void message.success(
          t('dataMenu.exportedToast', { count: tasks.length.toLocaleString(numberLocale) }),
        )
        break
      }
      case 'import':
        setImportOpen(true)
        break
      case 'simulate': {
        const next = !simulate
        failureSimulation.setEnabled(next)
        void message.info(
          next
            ? t('dataMenu.simulateEnabledToast', { rate: RATE })
            : t('dataMenu.simulateDisabledToast'),
        )
        break
      }
      case 'clear':
        setPending({ kind: 'clear' })
        break
    }
  }

  return (
    <>
      <Dropdown trigger={['click']} placement="bottomRight" menu={{ items, onClick }}>
        <Button icon={<DatabaseOutlined aria-hidden />}>
          <span className="max-sm:sr-only">{t('dataMenu.buttonLabel')}</span>
          <DownOutlined aria-hidden className="text-[10px]" />
        </Button>
      </Dropdown>

      <ImportDialog open={importOpen} existing={tasks} onClose={() => setImportOpen(false)} />

      <ConfirmDialog
        open={pending?.kind === 'seed'}
        title={t('dataMenu.replaceConfirmTitle')}
        description={t('dataMenu.replaceConfirmDesc', {
          existing: tasks.length.toLocaleString(numberLocale),
          next: pending?.kind === 'seed' ? pending.count.toLocaleString(numberLocale) : '',
        })}
        confirmLabel={t('dataMenu.replaceConfirmBtn')}
        tone="danger"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending?.kind === 'seed') void seed(pending.count)
          setPending(null)
        }}
      />

      <ConfirmDialog
        open={pending?.kind === 'clear'}
        title={t('dataMenu.clearConfirmTitle')}
        description={t('dataMenu.clearConfirmDesc', {
          count: tasks.length.toLocaleString(numberLocale),
        })}
        confirmLabel={t('dataMenu.clearConfirmBtn')}
        tone="danger"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          setPending(null)
          void clearTasks().then((res) => {
            if ('error' in res && res.error) void message.error(res.error.message)
            else void message.success(t('dataMenu.clearedToast'))
          })
        }}
      />
    </>
  )
}
