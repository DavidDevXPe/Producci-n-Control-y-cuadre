import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'

export type StatusBadgeTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral'

export interface StatusBadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  children: ReactNode
  tone?: StatusBadgeTone
  showIcon?: boolean
}

const toneClasses: Record<StatusBadgeTone, string> = {
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  danger: 'bg-rose-50 text-rose-800 ring-rose-600/20',
  warning: 'bg-amber-50 text-amber-900 ring-amber-600/25',
  info: 'bg-brand-50 text-brand-800 ring-brand-600/20',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
}

const toneIcons: Record<StatusBadgeTone, LucideIcon> = {
  success: CheckCircle2,
  danger: XCircle,
  warning: AlertTriangle,
  info: Info,
  neutral: Circle,
}

export function StatusBadge({
  children,
  tone = 'neutral',
  showIcon = true,
  className = '',
  ...props
}: StatusBadgeProps) {
  const Icon = toneIcons[tone]

  return (
    <span
      {...props}
      className={[
        'inline-flex min-h-6 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-extrabold leading-none tracking-[0.02em] ring-1 ring-inset',
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showIcon ? <Icon className="size-3.5 shrink-0" aria-hidden="true" /> : null}
      <span className="truncate">{children}</span>
    </span>
  )
}

export default StatusBadge
