import { StyleProvider } from '@ant-design/cssinjs'
import { App as AntApp, ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import viVN from 'antd/locale/vi_VN'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/vi'
import { useEffect, useMemo, useState } from 'react'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router'
import { useLocale } from '@/i18n'
import { bindNotifier } from '@/lib/notify'
import { createAppStore } from '@/store/store'
import { buildAntdTheme } from './antdTheme'
import { createRouter } from './router'
import { usePrefersReducedMotion, useThemeMode } from './theme'

dayjs.locale('vi')

function NotifyBridge() {
  const api = AntApp.useApp()
  useEffect(() => {
    bindNotifier(api)
    return () => {
      bindNotifier(null)
    }
  }, [api])
  return null
}

export function App() {
  const [store] = useState(createAppStore)
  const [router] = useState(createRouter)
  const locale = useLocale()
  const themeMode = useThemeMode()
  const reducedMotion = usePrefersReducedMotion()
  const themeConfig = useMemo(
    () => buildAntdTheme(themeMode, reducedMotion),
    [themeMode, reducedMotion],
  )

  useEffect(() => {
    dayjs.locale(locale)
  }, [locale])

  return (
    <StyleProvider layer>
      <ConfigProvider locale={locale === 'en' ? enUS : viVN} theme={themeConfig}>
        <AntApp
          message={{ maxCount: 3, top: 12 }}
          notification={{ placement: 'bottomRight', maxCount: 4, stack: { threshold: 3 } }}
        >
          <NotifyBridge />
          <Provider store={store}>
            <RouterProvider router={router} />
          </Provider>
        </AntApp>
      </ConfigProvider>
    </StyleProvider>
  )
}
