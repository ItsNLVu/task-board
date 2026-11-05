import { useMemo } from 'react'
import { computeStats, filterTasks, foldQuery, sortTasks } from '@/domain/query'
import type { Task } from '@/domain/task'
import { useNow } from '@/lib/clock'
import { useGetTasksQuery } from '@/store/api'
import { useBoardParams } from './useBoardParams'

const EMPTY: Task[] = []

export function useBoardTasks() {
  const query = useGetTasksQuery()
  const { params } = useBoardParams()
  const now = useNow()
  const tasks = query.data ?? EMPTY

  const filtered = useMemo(() => filterTasks(tasks, params, now), [tasks, params, now])
  const sorted = useMemo(() => sortTasks(filtered, params.sort), [filtered, params.sort])
  const stats = useMemo(() => computeStats(tasks, now), [tasks, now])
  const needle = useMemo(() => foldQuery(params.q), [params.q])

  return { query, tasks, filtered, sorted, stats, needle, now, params }
}
