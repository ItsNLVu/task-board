import { describe, expect, it, vi } from 'vitest'
import { makeTask, NOW } from '@/test/factories'
import { createLocalStorageTaskService } from './localStorageTaskService'
import { TASKS_STORAGE_KEY } from './sync'
import { ServiceError } from './types'

const HOUR = 3_600_000

function setup(failureRate = 0) {
  const onWrite = vi.fn()
  const service = createLocalStorageTaskService({
    storage: window.localStorage,
    latency: [0, 0],
    failureRate: () => failureRate,
    random: () => 0.5,
    now: () => NOW,
    onWrite,
  })
  return { service, onWrite }
}

const draft = {
  title: 'Chuẩn bị demo',
  description: 'Dòng 1\nDòng 2',
  deadline: new Date(NOW + 24 * HOUR).toISOString(),
  status: 'todo' as const,
  priority: 'high' as const,
  tags: ['demo'],
  subtasks: [],
}

describe('LocalStorageTaskService', () => {
  it('creates a task with generated fields and persists it', async () => {
    const { service, onWrite } = setup()
    const task = await service.create(draft)
    expect(task.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(task.createdAt).toBe(new Date(NOW).toISOString())
    expect(task.completedAt).toBeNull()
    expect(await service.list()).toHaveLength(1)
    expect(onWrite).toHaveBeenCalledTimes(1)
  })

  it('rejects a duplicate open title', async () => {
    const { service } = setup()
    await service.create(draft)
    await expect(service.create({ ...draft, title: ' chuẩn bị DEMO ' })).rejects.toMatchObject({
      code: 'CONFLICT',
    })
  })

  it('rejects a past deadline on create', async () => {
    const { service } = setup()
    await expect(
      service.create({ ...draft, deadline: new Date(NOW - HOUR).toISOString() }),
    ).rejects.toBeInstanceOf(ServiceError)
  })

  it('sets completedAt when status becomes done and clears it when reverted', async () => {
    const { service } = setup()
    const task = await service.create(draft)
    const done = await service.update(task.id, { status: 'done' })
    expect(done.completedAt).toBe(new Date(NOW).toISOString())
    const back = await service.update(task.id, { status: 'in_progress' })
    expect(back.completedAt).toBeNull()
  })

  it('refuses to reopen a done task whose title is now taken', async () => {
    const { service } = setup()
    const first = await service.create({ ...draft, status: 'done' })
    await service.create(draft)
    await expect(service.move(first.id, { status: 'todo' })).rejects.toMatchObject({
      code: 'CONFLICT',
    })
  })

  it('reads the latest storage on every write (cross-tab safety)', async () => {
    const { service } = setup()
    await service.create(draft)
    const other = makeTask({ title: 'Từ tab khác' })
    const stored = JSON.parse(window.localStorage.getItem(TASKS_STORAGE_KEY)!) as {
      tasks: unknown[]
    }
    window.localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify({ version: 1, tasks: [...stored.tasks, other] }),
    )
    await service.create({ ...draft, title: 'Task thứ ba' })
    expect(await service.list()).toHaveLength(3)
  })

  it('fails writes when the failure simulation triggers', async () => {
    const { service } = setup(1)
    await expect(service.create(draft)).rejects.toMatchObject({ code: 'NETWORK' })
    expect(window.localStorage.getItem(TASKS_STORAGE_KEY)).toBeNull()
  })

  it('restores a deleted task unchanged', async () => {
    const { service } = setup()
    const task = await service.create(draft)
    const removed = await service.remove(task.id)
    expect(await service.list()).toHaveLength(0)
    expect(await service.restore(removed)).toEqual(task)
  })

  it('maps quota errors to QUOTA', async () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError')
      },
    } as unknown as Storage
    const service = createLocalStorageTaskService({ storage, latency: [0, 0], now: () => NOW })
    await expect(service.create(draft)).rejects.toMatchObject({ code: 'QUOTA' })
  })

  it('imports in merge mode and skips invalid records', async () => {
    const { service } = setup()
    const existing = await service.create(draft)
    const result = await service.importTasks(
      [{ ...existing, title: 'Đã đổi tên' }, makeTask(), { broken: true }],
      'merge',
    )
    expect(result).toEqual({ imported: 2, total: 3 })
    const list = await service.list()
    expect(list).toHaveLength(2)
    expect(list.find((t) => t.id === existing.id)?.title).toBe('Đã đổi tên')
  })
})
