import { Form } from 'antd'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Field({
  id,
  label,
  required,
  error,
  extra,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <Form.Item
      label={
        <span
          className={cn(
            'text-[12px] font-medium text-ink-2',
            required && "after:ml-0.5 after:font-semibold after:text-danger after:content-['*']",
          )}
        >
          {label}
        </span>
      }
      htmlFor={id}
      validateStatus={error ? 'error' : undefined}
      help={
        error ? (
          <span id={`${id}-error`} role="alert" className="text-[12px]">
            {error}
          </span>
        ) : undefined
      }
      extra={extra ? <span className="text-[11.5px] text-ink-3">{extra}</span> : undefined}
      className="mb-0"
    >
      {children}
    </Form.Item>
  )
}
