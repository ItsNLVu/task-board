export const STORAGE_KEYS = {
  tasks: 'taskboard:v1:tasks',
  theme: 'taskboard:v1:theme',
  locale: 'taskboard:v1:locale',
  view: 'taskboard:v1:view',
  simulation: 'taskboard:v1:sim',
} as const

export const BROADCAST_CHANNELS = {
  tasksSync: 'taskboard:v1:sync',
} as const
