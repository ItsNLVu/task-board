import { theme as antTheme, type ThemeConfig } from 'antd'
import { DARK_TOKENS, FONT_MONO, FONT_SANS, LIGHT_TOKENS, type ThemeMode } from './tokens'

const LIGHT_FLOAT_SHADOW = '0 16px 36px -8px rgb(22 24 29 / 0.16), 0 2px 6px rgb(22 24 29 / 0.06)'
const DARK_FLOAT_SHADOW = '0 18px 40px -8px rgb(0 0 0 / 0.56), 0 2px 8px rgb(0 0 0 / 0.36)'

export function buildAntdTheme(mode: ThemeMode, reducedMotion: boolean): ThemeConfig {
  const c = mode === 'dark' ? DARK_TOKENS : LIGHT_TOKENS
  const floatShadow = mode === 'dark' ? DARK_FLOAT_SHADOW : LIGHT_FLOAT_SHADOW
  const focusShadow =
    mode === 'dark' ? '0 0 0 2px rgb(110 120 255 / 0.24)' : '0 0 0 2px rgb(94 106 210 / 0.16)'

  return {
    algorithm: mode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    hashed: false,
    token: {
      colorPrimary: c.accent,
      colorInfo: c.accent,
      colorLink: c.ink,
      colorLinkHover: c.accent,
      colorSuccess: c.accent,
      colorError: c.danger,
      colorWarning: c.warning,
      colorText: c.ink,
      colorTextHeading: c.ink,
      colorTextSecondary: c['ink-2'],
      colorTextTertiary: c['ink-3'],
      colorTextDescription: c['ink-3'],
      colorTextPlaceholder: c['ink-3'],
      colorTextLightSolid: c['accent-ink'],
      colorBgLayout: c.bg,
      colorBgContainer: c.panel,
      colorBgElevated: c.panel,
      colorBorder: c.line,
      colorBorderSecondary: c.line,
      colorSplit: c.line,
      fontFamily: FONT_SANS,
      fontFamilyCode: FONT_MONO,
      fontSize: 13,
      borderRadius: 6,
      borderRadiusLG: 8,
      borderRadiusSM: 4,
      borderRadiusXS: 3,
      controlHeight: 32,
      controlHeightSM: 26,
      controlHeightLG: 38,
      boxShadow: floatShadow,
      boxShadowSecondary: floatShadow,
      wireframe: false,
      motion: !reducedMotion,
      motionDurationFast: '0.08s',
      motionDurationMid: '0.12s',
      motionDurationSlow: '0.16s',
    },
    components: {
      Button: {
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
        primaryColor: c['accent-ink'],
        defaultBorderColor: c.line,
        defaultHoverBorderColor: c['line-strong'],
        defaultHoverColor: c.ink,
        defaultHoverBg: c['panel-2'],
        fontWeight: 500,
      },
      Input: {
        activeShadow: focusShadow,
        hoverBorderColor: c['line-strong'],
      },
      Select: {
        optionSelectedBg: c['accent-soft'],
        optionSelectedColor: c.ink,
        hoverBorderColor: c['line-strong'],
      },
      DatePicker: {
        activeShadow: focusShadow,
        hoverBorderColor: c['line-strong'],
      },
      Tooltip: {
        colorBgSpotlight: mode === 'dark' ? c['panel-2'] : c.ink,
        colorTextLightSolid: mode === 'dark' ? c.ink : c['accent-ink'],
        fontFamily: FONT_MONO,
        fontSize: 11,
      },
      Segmented: {
        trackBg: c['panel-2'],
        trackPadding: 2,
        itemSelectedBg: c.panel,
        itemSelectedColor: c.ink,
        itemColor: c['ink-2'],
        itemHoverColor: c.ink,
        itemHoverBg: 'transparent',
      },
      Modal: {
        contentBg: c.panel,
        headerBg: c.panel,
        footerBg: c.panel,
        titleFontSize: 14,
      },
      Notification: {
        width: 360,
      },
      Tag: {
        defaultBg: c['panel-2'],
        defaultColor: c['ink-2'],
      },
      Empty: {
        colorTextDescription: c['ink-2'],
      },
      Progress: {
        defaultColor: c.accent,
        remainingColor: c['panel-2'],
      },
    },
  }
}
