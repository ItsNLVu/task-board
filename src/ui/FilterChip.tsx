import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface FilterChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  icon?: ReactNode
  size?: 'small' | 'large'
}

export function FilterChip({
  pressed,
  onPressedChange,
  icon,
  size = 'small',
  className,
  children,
  ...props
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-chip border font-medium whitespace-nowrap transition-colors duration-100 select-none',
        size === 'large' ? 'h-9 px-3 text-[13px]' : 'h-[26px] px-2 text-[12px]',
        pressed
          ? 'border-accent/45 bg-accent-soft text-accent'
          : 'border-line bg-panel text-ink-2 hover:border-line-strong hover:bg-panel-2/60 hover:text-ink',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
