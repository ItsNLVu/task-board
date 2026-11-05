import { ExclamationCircleFilled, QuestionCircleFilled } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel')
  const Icon = tone === 'danger' ? ExclamationCircleFilled : QuestionCircleFilled
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      centered
      width={420}
      destroyOnHidden
      zIndex={1100}
      title={
        <span className="flex items-center gap-2">
          <Icon aria-hidden className={tone === 'danger' ? 'text-danger' : 'text-accent'} />
          {title}
        </span>
      }
      footer={[
        <Button key="cancel" onClick={onCancel} autoFocus>
          {resolvedCancelLabel}
        </Button>,
        <Button key="confirm" type="primary" danger={tone === 'danger'} onClick={onConfirm}>
          {confirmLabel}
        </Button>,
      ]}
    >
      <div className="text-[13px] leading-relaxed text-ink-2">{description}</div>
    </Modal>
  )
}
