import { addDays, nextFriday, nextMonday, setHours, startOfHour } from 'date-fns'
import { t } from '@/i18n'

export interface DeadlinePreset {
  label: string
  ms: number
}

const at = (base: Date | number, hour: number) => startOfHour(setHours(base, hour)).getTime()

export function deadlinePresets(now: number): DeadlinePreset[] {
  const todayEnd = at(now, 17) > now ? at(now, 17) : at(now, 23) + 59 * 60_000
  const friday = new Date(now).getDay() === 5 && at(now, 17) > now ? now : nextFriday(now)
  return [
    { label: t('domain.deadline.presetTodayEnd'), ms: todayEnd },
    { label: t('domain.deadline.presetTomorrowMorning'), ms: at(addDays(now, 1), 9) },
    { label: t('domain.deadline.presetFridayEnd'), ms: at(friday, 17) },
    { label: t('domain.deadline.presetNextMonday'), ms: at(nextMonday(now), 9) },
  ].filter((p) => p.ms > now)
}
