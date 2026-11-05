import { ORDER_STEP } from './order'
import type { Subtask, Task, TaskPriority, TaskStatus } from './task'

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function uuidFrom(rand: () => number): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(rand() * 256))
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const TITLES = [
  'Thiết kế lại trang đăng nhập',
  'Sửa lỗi lệch giờ khi lưu deadline',
  'Viết test cho bộ lọc theo tag',
  'Tối ưu ảnh sản phẩm trên trang chủ',
  'Chuẩn bị demo sprint 14 cho khách hàng',
  'Rà soát quyền truy cập trang quản trị',
  'Cập nhật tài liệu API thanh toán',
  'Thêm phân trang cho lịch sử đơn hàng',
  'Đổi thư viện biểu đồ sang bản nhẹ hơn',
  'Kiểm tra hiển thị trên Safari iOS',
  'Gửi báo cáo lỗi tuần cho đội QA',
  'Viết hướng dẫn cài đặt môi trường dev',
  'Sửa nút Thanh toán bị mờ ở theme tối',
  'Thêm xác nhận trước khi xóa địa chỉ',
  'Chuyển log lỗi sang hệ thống tập trung',
  'Phỏng vấn ứng viên frontend vòng 2',
  'Họp chốt phạm vi tính năng thông báo',
  'Đo thời gian tải trang danh mục',
  'Bổ sung bản dịch tiếng Anh cho email',
  'Làm mới chứng chỉ SSL cho staging',
  'Gom các component nút về một chỗ',
  'Sửa lỗi tìm kiếm không khớp chữ có dấu',
  'Thiết kế trạng thái rỗng cho giỏ hàng',
  'Viết kịch bản kiểm thử luồng hoàn tiền',
  'Nâng cấp React Router lên bản mới',
  'Thêm phím tắt mở nhanh ô tìm kiếm',
  'Rà soát độ tương phản màu theo WCAG',
  'Chuẩn hóa định dạng số tiền VND',
  'Xử lý lỗi mất mạng khi gửi biểu mẫu',
  'Lên kế hoạch release tháng 12',
  'Tách cấu hình môi trường ra file riêng',
  'Sửa lỗi kéo thả trên màn hình cảm ứng',
  'Viết changelog cho bản 2.3',
  'Thêm bộ lọc theo khoảng ngày cho báo cáo',
  'Kiểm tra rò rỉ bộ nhớ ở trang bảng tin',
  'Thiết kế icon cho ứng dụng di động',
  'Thu thập phản hồi từ 5 khách hàng thử nghiệm',
  'Cấu hình CI chạy test song song',
  'Viết tài liệu quy ước đặt tên nhánh git',
  'Sửa lỗi trùng email khi đăng ký',
  'Thêm skeleton cho danh sách sản phẩm',
  'Đánh giá chi phí hạ tầng quý 4',
  'Dọn các feature flag đã hết hạn',
  'Thêm kiểm tra định dạng số điện thoại',
  'Cải thiện thông báo lỗi khi tải file lớn',
  'Đồng bộ màu thương hiệu với bộ nhận diện mới',
  'Kiểm thử khả năng dùng bằng bàn phím',
  'Sao lưu cơ sở dữ liệu trước khi migrate',
  'Chuẩn bị slide cho buổi chia sẻ nội bộ',
  'Rà soát hợp đồng với nhà cung cấp SMS',
] as const

const DESCRIPTIONS = [
  'Ghi chú từ buổi họp:\n- Ưu tiên bản mobile trước\n- Cần ảnh chụp màn hình trước và sau khi sửa',
  'Lỗi do khách hàng báo qua email. Tái hiện được trên Chrome 130, chưa thấy trên Firefox.',
  'Phạm vi: chỉ làm phần giao diện, API đã có sẵn.\nNgười duyệt: trưởng nhóm frontend.',
  'Tham khảo tài liệu nội bộ mục 4.2. Nếu vướng thì hỏi đội backend trong kênh chung.',
  '',
  'Cần xong trước buổi demo để kịp gửi bản ghi hình cho khách.',
  'Đo trước khi sửa để có số liệu so sánh. Ghi kết quả vào trang wiki của dự án.',
]

const TAG_POOL = [
  'frontend',
  'backend',
  'thiết kế',
  'bug',
  'tài liệu',
  'test',
  'release',
  'khách hàng',
  'hiệu năng',
  'bảo mật',
]

const SUBTASK_POOL = [
  'Viết đặc tả ngắn',
  'Làm bản nháp',
  'Nhờ đồng nghiệp review',
  'Sửa theo góp ý',
  'Cập nhật tài liệu',
  'Kiểm tra trên staging',
  'Báo lại cho người yêu cầu',
]

const HOUR = 3_600_000
const DAY = 24 * HOUR

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)] as T
}

function weighted<T>(rand: () => number, entries: readonly [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [value, w] of entries) {
    r -= w
    if (r <= 0) return value
  }
  return (entries[entries.length - 1] as [T, number])[0]
}

export function generateSeedTasks(count: number, now: number, seed = 20261105): Task[] {
  const rand = mulberry32(seed + count)
  const orderByStatus: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0 }
  const tasks: Task[] = []

  for (let i = 0; i < count; i++) {
    const base = TITLES[i % TITLES.length] as string
    const round = Math.floor(i / TITLES.length)
    const title = round === 0 ? base : `${base} (đợt ${round + 1})`

    const status = weighted<TaskStatus>(rand, [
      ['todo', 45],
      ['in_progress', 30],
      ['done', 25],
    ])
    const priority = weighted<TaskPriority>(rand, [
      ['low', 25],
      ['medium', 40],
      ['high', 25],
      ['urgent', 10],
    ])

    const createdAt = now - Math.floor((1 + rand() * 29) * DAY)
    const bucket = weighted(rand, [
      ['overdue', 15],
      ['soon', 15],
      ['later', 70],
    ] as const)
    const deadline =
      bucket === 'overdue'
        ? now - Math.floor((1 + rand() * 140) * HOUR)
        : bucket === 'soon'
          ? now + Math.floor((0.5 + rand() * 22) * HOUR)
          : now + Math.floor((1 + rand() * 20) * DAY)

    const updatedAt = createdAt + Math.floor(rand() * (now - createdAt))
    const completedAt = status === 'done' ? updatedAt : null

    const tagCount = Math.floor(rand() * 4)
    const tags = [...new Set(Array.from({ length: tagCount }, () => pick(rand, TAG_POOL)))]

    const subtaskCount = rand() < 0.55 ? 2 + Math.floor(rand() * 4) : 0
    const subtasks: Subtask[] = Array.from({ length: subtaskCount }, (_, k) => ({
      id: uuidFrom(rand),
      title: SUBTASK_POOL[k % SUBTASK_POOL.length] as string,
      done: status === 'done' ? true : rand() < 0.4,
    }))

    orderByStatus[status] += ORDER_STEP
    tasks.push({
      id: uuidFrom(rand),
      title,
      description: pick(rand, DESCRIPTIONS),
      deadline: new Date(Math.round(deadline / 60_000) * 60_000).toISOString(),
      status,
      priority,
      tags,
      subtasks,
      order: orderByStatus[status],
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: new Date(updatedAt).toISOString(),
      completedAt: completedAt === null ? null : new Date(completedAt).toISOString(),
    })
  }
  return tasks
}
