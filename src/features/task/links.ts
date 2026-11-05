export function taskHref(taskId: string, search: string): string {
  return `/tasks/${taskId}${search}`
}

export function newTaskHref(search: string): string {
  return `/tasks/new${search}`
}

export function boardHref(search: string): string {
  return `/${search}`
}
