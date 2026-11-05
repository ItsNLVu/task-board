import { fireEvent, render, screen } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { describe, expect, it, vi } from 'vitest'
import type { TaskDraft } from '@/domain/task'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { makeTask, NOW } from '@/test/factories'
import { TaskForm } from './TaskForm'

function renderWithAntd(ui: React.ReactElement) {
  return render(<ConfigProvider locale={viVN}>{ui}</ConfigProvider>)
}

describe('TaskForm validation & submission', () => {
  it('blocks short titles and duplicate open titles', async () => {
    const onSubmit = vi.fn<(draft: TaskDraft) => Promise<boolean>>().mockResolvedValue(true)
    const existingOpen = makeTask({ title: 'Sửa lỗi thanh toán', status: 'in_progress' })
    const existingDone = makeTask({ title: 'Đã hoàn tất sprint cũ', status: 'done' })

    renderWithAntd(
      <TaskForm
        mode="create"
        tasks={[existingOpen, existingDone]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        onDirtyChange={vi.fn()}
      />,
    )

    const titleInput = screen.getByLabelText('Tiêu đề')
    fireEvent.change(titleInput, { target: { value: 'ab' } })
    fireEvent.blur(titleInput)

    expect(await screen.findByText('Tiêu đề cần ít nhất 3 ký tự')).toBeInTheDocument()

    fireEvent.change(titleInput, { target: { value: '  sửa LỖI   thanh toán ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo task' }))

    expect(
      await screen.findByText('Đã có một task chưa hoàn thành dùng tiêu đề này'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('allows saving an existing overdue task when deadline is unchanged', async () => {
    const onSubmit = vi.fn<(draft: TaskDraft) => Promise<boolean>>().mockResolvedValue(true)
    const overdueTask = makeTask({
      title: 'Báo cáo tài chính quý',
      deadline: new Date(NOW - 2 * 86_400_000).toISOString(),
      status: 'todo',
    })

    renderWithAntd(
      <TaskForm
        mode="edit"
        task={overdueTask}
        tasks={[overdueTask]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        onDirtyChange={vi.fn()}
      />,
    )

    const titleInput = screen.getByLabelText('Tiêu đề')
    fireEvent.change(titleInput, { target: { value: 'Báo cáo tài chính quý 4' } })

    const subtaskInput = screen.getByLabelText('Thêm việc con')
    fireEvent.change(subtaskInput, { target: { value: 'Kiểm tra bảng cân đối' } })
    fireEvent.keyDown(subtaskInput, { key: 'Enter' })

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
    const draft = onSubmit.mock.calls[0]?.[0]
    expect(draft).toMatchObject({
      title: 'Báo cáo tài chính quý 4',
      subtasks: [expect.objectContaining({ title: 'Kiểm tra bảng cân đối', done: false })],
    })
  })
})

describe('ConfirmDialog confirmation flow', () => {
  it('invokes onConfirm and onCancel handlers', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    renderWithAntd(
      <ConfirmDialog
        open
        title="Xóa task này?"
        description="Bạn có 5 giây để hoàn tác sau khi xóa."
        confirmLabel="Xóa task"
        cancelLabel="Giữ lại"
        tone="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByText('Xóa task này?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Giữ lại' }))
    expect(onCancel).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Xóa task' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
