import {
  MoonOutlined,
  ProjectOutlined,
  SunOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { Button, Segmented, Tag, Tooltip } from 'antd'
import { useSyncExternalStore } from 'react'
import { themeStore, useThemeMode } from '@/app/theme'
import { UI_TIMINGS } from '@/common'
import { useTranslation } from '@/i18n'
import { failureSimulation } from '@/services/simulation'
import type { ViewMode } from '../boardParams'
import { useBoardParams } from '../useBoardParams'

export function BrandMark() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 select-none">
      <svg viewBox="0 0 24 24" aria-hidden className="size-6 shrink-0 rounded-[6px] shadow-2xs">
        <rect width="24" height="24" rx="6" className="fill-accent" />
        <rect x="5" y="5.5" width="4" height="13" rx="1.2" className="fill-accent-ink" />
        <rect
          x="10.5"
          y="5.5"
          width="4"
          height="9"
          rx="1.2"
          className="fill-accent-ink opacity-85"
        />
        <rect x="16" y="5.5" width="3" height="6" rx="1.2" className="fill-accent-ink opacity-65" />
      </svg>
      <span className="hidden text-[14px] font-semibold tracking-[-0.01em] text-ink sm:inline">
        {t('common.appName')}
      </span>
    </div>
  )
}

export function ViewSwitch() {
  const { params, update } = useBoardParams()
  const { t } = useTranslation()
  return (
    <Segmented<ViewMode>
      aria-label={t('topBar.viewSwitchAria')}
      size="small"
      value={params.view}
      onChange={(view) => update({ view })}
      options={[
        {
          value: 'list',
          label: (
            <span className="inline-flex items-center gap-1.5 px-0.5">
              <UnorderedListOutlined aria-hidden />
              <span>{t('topBar.viewList')}</span>
            </span>
          ),
        },
        {
          value: 'kanban',
          label: (
            <span className="inline-flex items-center gap-1.5 px-0.5">
              <ProjectOutlined aria-hidden />
              <span>{t('topBar.viewKanban')}</span>
            </span>
          ),
        },
      ]}
    />
  )
}

export function SimulationBadge() {
  const enabled = useSyncExternalStore(failureSimulation.subscribe, failureSimulation.isEnabled)
  const { t } = useTranslation()
  if (!enabled) return null
  return (
    <Tag
      color="warning"
      closable
      closeIcon={<span aria-label={t('topBar.simulationCloseAria')}>×</span>}
      onClose={(e) => {
        e.preventDefault()
        failureSimulation.setEnabled(false)
      }}
      className="m-0 hidden lg:inline-flex"
    >
      {t('topBar.simulationActive')}
    </Tag>
  )
}

export function LanguageSwitchButton() {
  const { locale, toggleLocale, t } = useTranslation()
  const isVi = locale === 'vi'
  return (
    <Tooltip
      title={isVi ? t('topBar.languageToEnTooltip') : t('topBar.languageToViTooltip')}
      mouseEnterDelay={UI_TIMINGS.tooltipDelay}
    >
      <Button
        type="text"
        aria-label={t('topBar.languageSwitchAria')}
        onClick={toggleLocale}
        className="w-8 px-0 font-mono text-[11.5px] font-semibold text-ink-2 uppercase hover:text-ink"
      >
        {locale.toUpperCase()}
      </Button>
    </Tooltip>
  )
}

export function ThemeToggleButton() {
  const themeMode = useThemeMode()
  const { t } = useTranslation()
  const isDark = themeMode === 'dark'
  return (
    <Tooltip
      title={isDark ? t('topBar.themeToLightTooltip') : t('topBar.themeToDarkTooltip')}
      mouseEnterDelay={UI_TIMINGS.tooltipDelay}
    >
      <Button
        type="text"
        aria-label={isDark ? t('topBar.themeToLightAria') : t('topBar.themeToDarkAria')}
        icon={isDark ? <SunOutlined aria-hidden /> : <MoonOutlined aria-hidden />}
        onClick={() => themeStore.toggle()}
        className="text-ink-2 hover:text-ink"
      />
    </Tooltip>
  )
}
