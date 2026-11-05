import { expect, test } from '@playwright/test'

test.describe('Task Board E2E', () => {
  test('seeds sample data, searches without diacritics, filters, and persists across reload', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page.getByText('Chưa có task nào')).toBeVisible()
    await page.getByRole('button', { name: 'Nạp dữ liệu mẫu' }).click()

    await expect(page.getByRole('button', { name: /Tổng\s+50/ })).toBeVisible()

    const search = page.locator('#board-search')
    await search.fill('dang nhap')
    await expect(page).toHaveURL(/\?q=dang\+nhap/)
    await expect(page.locator('mark').first()).toBeVisible()

    await search.fill('')
    await expect(page).not.toHaveURL(/q=/)

    const stats = page.getByRole('list', { name: 'Thống kê nhanh' })
    await stats.getByRole('button', { name: /^Đang làm/ }).click()
    await expect(page).toHaveURL(/status=in_progress/)

    await page.reload()
    await expect(stats.getByRole('button', { name: /^Đang làm/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await page.getByRole('button', { name: 'Xóa bộ lọc' }).click()
    await expect(page).not.toHaveURL(/status=/)
  })

  test('validates form, guards dirty close, creates task with subtasks, and undoes delete', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Nạp dữ liệu mẫu' }).click()
    await expect(page.getByRole('button', { name: /Tổng\s+50/ })).toBeVisible()

    await page.getByRole('button', { name: /Tạo task/ }).click()
    await expect(page).toHaveURL('/tasks/new')

    const title = page.locator('#task-title')
    await title.fill('ab')
    await title.blur()
    await expect(page.locator('#task-title-error')).toContainText('Tiêu đề cần ít nhất 3 ký tự')

    await page.keyboard.press('Escape')
    await expect(page.getByText('Bỏ các thay đổi chưa lưu?')).toBeVisible()
    await page.getByRole('button', { name: 'Tiếp tục sửa' }).click()

    const taskTitle = 'Kiểm thử luồng E2E hoàn chỉnh'
    await title.fill(taskTitle)
    const subtaskInput = page.getByLabel('Thêm việc con')
    await subtaskInput.fill('Bước chuẩn bị dữ liệu')
    await subtaskInput.press('Enter')

    await page.locator('form button[type="submit"]').click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: /Tổng\s+51/ })).toBeVisible()

    const search = page.locator('#board-search')
    await search.fill('luong E2E hoan chinh')
    await expect(page.getByRole('link', { name: taskTitle })).toBeVisible()

    await page.getByRole('link', { name: taskTitle }).click()
    await page.getByRole('button', { name: 'Xóa task' }).click()
    await page.locator('.ant-modal-root').getByRole('button', { name: 'Xóa task' }).last().click()

    await expect(page.getByRole('button', { name: 'Hoàn tác' })).toBeVisible()
    await page.getByRole('button', { name: 'Hoàn tác' }).click()
    await expect(page.getByText(/Đã khôi phục/)).toBeVisible()
    await expect(page.getByRole('link', { name: taskTitle })).toBeVisible()
  })

  test('switches to Kanban and moves task across columns via drag-and-drop', async ({ page }) => {
    await page.goto('/?view=kanban')
    await page.getByRole('button', { name: 'Nạp dữ liệu mẫu' }).click()

    const todoCol = page.getByTestId('kanban-col-todo')
    const inProgressCol = page.getByTestId('kanban-col-in_progress')

    const firstCard = todoCol.locator('article').first()
    const cardTitle = await firstCard.locator('h3').innerText()
    const fromBox = await firstCard.boundingBox()
    const toBox = await inProgressCol.boundingBox()
    expect(fromBox).not.toBeNull()
    expect(toBox).not.toBeNull()

    await page.mouse.move(fromBox!.x + fromBox!.width / 2, fromBox!.y + fromBox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(
      fromBox!.x + fromBox!.width / 2 + 12,
      fromBox!.y + fromBox!.height / 2 + 6,
      { steps: 4 },
    )
    await page.mouse.move(toBox!.x + toBox!.width / 2, toBox!.y + 160, { steps: 12 })
    await page.mouse.up()

    await expect(inProgressCol).toContainText(cardTitle)
  })

  test('previews JSON import with valid and invalid records and imports valid tasks', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Dữ liệu/ }).click()
    await page.getByRole('menuitem', { name: /Nhập từ file/ }).click()

    const payload = [
      {
        id: '11111111-2222-4333-8444-555555555555',
        title: 'Task nhập từ file JSON hợp lệ',
        description: 'Mô tả hợp lệ',
        deadline: new Date(Date.now() + 86_400_000).toISOString(),
        status: 'todo',
        priority: 'high',
        tags: ['import'],
        subtasks: [],
        order: 1024,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      },
      {
        id: 'invalid-id',
        title: 'x',
      },
    ]

    await page.locator('input[type="file"]').setInputFiles({
      name: 'tasks.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(payload), 'utf-8'),
    })

    await expect(page.getByText('Bản ghi lỗi (không được nhập)')).toBeVisible()
    await page.getByRole('button', { name: 'Nhập 1 task' }).click()
    await expect(page.getByRole('link', { name: 'Task nhập từ file JSON hợp lệ' })).toBeVisible()
  })

  test('toggles Dark Mode and Language (VI / EN) with persistence across reload', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Nạp dữ liệu mẫu' }).click()
    await expect(page.getByRole('button', { name: /Tổng\s+50/ })).toBeVisible()

    await page.getByRole('button', { name: 'Chuyển sang giao diện Tối' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.getByRole('button', { name: 'Chuyển sang giao diện Sáng' }).click()
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark')

    await page.getByRole('button', { name: 'Đổi ngôn ngữ hiển thị' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('button', { name: /Total\s+50/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /New task/ })).toBeVisible()

    await page.getByRole('button', { name: 'Switch display language' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
    await expect(page.getByRole('button', { name: /Tổng\s+50/ })).toBeVisible()
  })
})
