import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useLocation, useNavigate } from 'react-router'
import type { Task } from '@/domain/task'
import { DataMenu } from '@/features/data/DataMenu'
import { newTaskHref } from '@/features/task/links'
import { useTranslation } from '@/i18n'
import {
  BrandMark,
  LanguageSwitchButton,
  SimulationBadge,
  ThemeToggleButton,
  ViewSwitch,
} from './header/TopBarBits'

export function TopBar({ tasks }: { tasks: readonly Task[] }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <header className="border-b border-line bg-panel">
      <div className="flex items-center justify-between gap-2 px-4 py-2 md:px-5">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="hidden h-4 w-px bg-line sm:inline-block" aria-hidden />
          <ViewSwitch />
        </div>
        <div className="flex items-center gap-1.5">
          <SimulationBadge />
          <div className="flex items-center gap-0.5">
            <LanguageSwitchButton />
            <ThemeToggleButton />
          </div>
          <span className="hidden h-4 w-px bg-line sm:inline-block" aria-hidden />
          <DataMenu tasks={tasks} />
          <Button
            type="primary"
            icon={<PlusOutlined aria-hidden />}
            onClick={() =>
              void navigate(newTaskHref(location.search), { state: { fromBoard: true } })
            }
          >
            <span className="max-sm:sr-only">{t('topBar.newTask')}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
