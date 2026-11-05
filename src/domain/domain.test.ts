import { describe, expect, it } from 'vitest'
import { makeTask, NOW } from '@/test/factories'
import { formatRelativeDeadline, getDeadlineState, isInDueRange, isoToLocalInput } from './deadline'
import { previewImport } from './importExport'
import { applyMove, applyUpdate } from './mutations'
import { orderBetween, planMove } from './order'
import { computeStats, filterTasks, sortTasks, type TaskQuery } from './query'
import { findTitleConflict } from './rules'
import { makeTaskFormSchema, taskSchema } from './schema'
import { generateSeedTasks } from './seed'
import { findMatches, fold, foldWithMap, normalizeTitle } from './text'

const HOUR = 3_600_000
const emptyQuery: TaskQuery = { q: '', status: [], priority: [], tags: [], due: null }

describe('text folding', () => {
  it('ignores case and Vietnamese diacritics', () => {
    expect(fold('Công Việc Đầu Tiên')).toBe('cong viec dau tien')
  })

  it('maps matches back to the original string', () => {
    const source = 'Sửa lỗi Đăng nhập'
    const [range] = findMatches(foldWithMap(source), fold('dang'))
    expect(range).toBeDefined()
    expect(source.slice(range![0], range![1])).toBe('Đăng')
  })

  it('handles decomposed input', () => {
    const decomposed = 'Việc'.normalize('NFD')
    const [range] = findMatches(foldWithMap(decomposed), 'viec')
    expect(decomposed.slice(range![0], range![1])).toBe(decomposed)
  })

  it('normalizes titles for uniqueness', () => {
    expect(normalizeTitle('  Viết   TEST ')).toBe(normalizeTitle('viết test'))
  })
})

describe('deadline', () => {
  it('classifies overdue, soon, normal and done', () => {
    expect(getDeadlineState(makeTask({ deadline: new Date(NOW - HOUR).toISOString() }), NOW)).toBe(
      'overdue',
    )
    expect(
      getDeadlineState(makeTask({ deadline: new Date(NOW + 2 * HOUR).toISOString() }), NOW),
    ).toBe('soon')
    expect(
      getDeadlineState(makeTask({ deadline: new Date(NOW + 48 * HOUR).toISOString() }), NOW),
    ).toBe('normal')
    expect(
      getDeadlineState(
        makeTask({ status: 'done', deadline: new Date(NOW - HOUR).toISOString() }),
        NOW,
      ),
    ).toBe('done')
  })

  it('formats relative time in Vietnamese', () => {
    expect(formatRelativeDeadline(new Date(NOW + 2 * HOUR + 5_000).toISOString(), NOW)).toBe(
      'còn 2 giờ',
    )
    expect(formatRelativeDeadline(new Date(NOW - 3 * 24 * HOUR).toISOString(), NOW)).toBe(
      'quá hạn 3 ngày',
    )
    expect(formatRelativeDeadline(new Date(NOW + 10 * 60_000).toISOString(), NOW)).toBe(
      'còn 10 phút',
    )
  })

  it('overdue range excludes done tasks', () => {
    const past = new Date(NOW - HOUR).toISOString()
    expect(isInDueRange(makeTask({ deadline: past }), 'overdue', NOW)).toBe(true)
    expect(
      isInDueRange(makeTask({ deadline: past, status: 'done', completedAt: past }), 'overdue', NOW),
    ).toBe(false)
  })
})

describe('order', () => {
  it('takes the midpoint between neighbours', () => {
    expect(orderBetween(1024, 2048)).toBe(1536)
    expect(orderBetween(undefined, 1024)).toBe(0)
    expect(orderBetween(1024, undefined)).toBe(2048)
  })

  it('renumbers the column when the gap runs out', () => {
    const a = makeTask({ order: 1 })
    const b = makeTask({ order: 1 + 1e-7 })
    const moving = makeTask({ order: 5000, status: 'in_progress' })
    const plan = planMove([a, b, moving], moving.id, { status: 'todo', prevId: a.id, nextId: b.id })
    expect(plan.renumbered).toHaveLength(2)
    expect(plan.order).toBeGreaterThan(plan.renumbered[0]!.order)
    expect(plan.order).toBeLessThan(plan.renumbered[1]!.order)
  })

  it('sets and clears completedAt when moving across columns', () => {
    const task = makeTask()
    const iso = new Date(NOW).toISOString()
    const [done] = applyMove([task], task.id, { status: 'done' }, iso)
    expect(done!.completedAt).toBe(iso)
    const [back] = applyMove([done!], task.id, { status: 'todo' }, iso)
    expect(back!.completedAt).toBeNull()
  })

  it('keeps completedAt when reordering inside done', () => {
    const doneAt = new Date(NOW - HOUR).toISOString()
    const task = makeTask({ status: 'done', completedAt: doneAt })
    const updated = applyUpdate(task, { title: 'Đổi tên' }, [task], new Date(NOW).toISOString())
    expect(updated.completedAt).toBe(doneAt)
  })
})

describe('query', () => {
  const tasks = [
    makeTask({ title: 'Sửa lỗi đăng nhập', priority: 'urgent', tags: ['bug'] }),
    makeTask({ title: 'Viết tài liệu', priority: 'low', status: 'in_progress' }),
    makeTask({
      title: 'Phát hành',
      priority: 'high',
      status: 'done',
      completedAt: new Date(NOW).toISOString(),
      description: 'Nhớ đăng changelog',
    }),
  ]

  it('searches title and description without accents', () => {
    expect(filterTasks(tasks, { ...emptyQuery, q: 'dang' }, NOW).map((t) => t.title)).toEqual([
      'Sửa lỗi đăng nhập',
      'Phát hành',
    ])
  })

  it('ORs inside a group and ANDs across groups', () => {
    const result = filterTasks(
      tasks,
      { ...emptyQuery, status: ['todo', 'done'], priority: ['urgent'] },
      NOW,
    )
    expect(result.map((t) => t.title)).toEqual(['Sửa lỗi đăng nhập'])
  })

  it('sorts by priority urgent first', () => {
    expect(sortTasks(tasks, 'priority').map((t) => t.priority)).toEqual(['urgent', 'high', 'low'])
  })

  it('computes stats over all tasks', () => {
    const stats = computeStats(tasks, NOW)
    expect(stats.total).toBe(3)
    expect(stats.byStatus.done).toBe(1)
    expect(stats.completionRate).toBe(33)
  })
})

describe('schema', () => {
  const base = {
    title: 'Viết test',
    description: '',
    deadline: isoToLocalInput(new Date(NOW + 48 * HOUR).toISOString()),
    status: 'todo' as const,
    priority: 'medium' as const,
    tags: [],
    subtasks: [],
  }

  it('rejects a past deadline when creating', () => {
    const schema = makeTaskFormSchema({ mode: 'create', now: () => NOW, tasks: [] })
    const result = schema.safeParse({
      ...base,
      deadline: isoToLocalInput(new Date(NOW - 48 * HOUR).toISOString()),
    })
    expect(result.success).toBe(false)
  })

  it('allows keeping an old past deadline when editing', () => {
    const past = isoToLocalInput(new Date(NOW - 48 * HOUR).toISOString())
    const schema = makeTaskFormSchema({
      mode: 'edit',
      now: () => NOW,
      tasks: [],
      originalDeadline: past,
    })
    expect(schema.safeParse({ ...base, deadline: past }).success).toBe(true)
  })

  it('rejects a duplicate title among unfinished tasks', () => {
    const other = makeTask({ title: 'viết TEST' })
    const schema = makeTaskFormSchema({ mode: 'create', now: () => NOW, tasks: [other] })
    expect(schema.safeParse(base).success).toBe(false)
    expect(schema.safeParse({ ...base, status: 'done' }).success).toBe(true)
  })

  it('enforces title length and tag limits', () => {
    const schema = makeTaskFormSchema({ mode: 'create', now: () => NOW, tasks: [] })
    expect(schema.safeParse({ ...base, title: '  ab ' }).success).toBe(false)
    expect(schema.safeParse({ ...base, tags: ['a', 'b', 'c', 'd', 'e', 'f'] }).success).toBe(false)
    expect(schema.safeParse({ ...base, tags: ['x'.repeat(21)] }).success).toBe(false)
  })

  it('checks completedAt consistency on full records', () => {
    expect(taskSchema.safeParse(makeTask({ status: 'done', completedAt: null })).success).toBe(
      false,
    )
  })
})

describe('seed and import', () => {
  it('generates 50 valid tasks with unique open titles', () => {
    const tasks = generateSeedTasks(50, NOW)
    expect(tasks).toHaveLength(50)
    expect(tasks.every((t) => taskSchema.safeParse(t).success)).toBe(true)
    for (const t of tasks) expect(findTitleConflict(tasks, t.title, t.id)).toBeUndefined()
    expect(tasks.some((t) => getDeadlineState(t, NOW) === 'overdue')).toBe(true)
    expect(tasks.some((t) => getDeadlineState(t, NOW) === 'soon')).toBe(true)
  })

  it('reports invalid records by index and keeps the valid ones', () => {
    const good = makeTask()
    const preview = previewImport(
      [good, { ...makeTask(), title: 'x' }, { ...good }, { foo: 1 }],
      [],
      'replace',
    )
    expect(preview.valid).toHaveLength(1)
    expect(preview.issues.map((i) => i.index)).toEqual([1, 2, 3])
  })

  it('detects title clashes with existing tasks when merging', () => {
    const existing = makeTask({ title: 'Họp sprint' })
    const incoming = makeTask({ title: 'họp SPRINT' })
    expect(previewImport([incoming], [existing], 'merge').issues).toHaveLength(1)
    expect(previewImport([incoming], [existing], 'replace').issues).toHaveLength(0)
  })
})
