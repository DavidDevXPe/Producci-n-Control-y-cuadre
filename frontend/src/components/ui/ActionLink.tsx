import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type ActionLinkVariant = 'primary' | 'secondary' | 'ghost'
type ActionLinkSize = 'sm' | 'md'

interface ActionLinkProps extends LinkProps {
  children: ReactNode
  variant?: ActionLinkVariant
  size?: ActionLinkSize
}

const variantClasses: Record<ActionLinkVariant, string> = {
  primary:
    'bg-brand-800 text-white shadow-sm hover:bg-brand-900 active:bg-brand-950',
  secondary:
    'border border-slate-200 bg-white text-brand-800 shadow-sm hover:border-brand-200 hover:bg-brand-50',
  ghost: 'text-brand-700 hover:bg-brand-50 hover:text-brand-900',
}

const sizeClasses: Record<ActionLinkSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-xs',
  md: 'min-h-10 px-4 py-2 text-sm',
}

export function ActionLink({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ActionLinkProps) {
  return (
    <Link
      {...props}
      className={[
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-bold transition-colors',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Link>
  )
}

export default ActionLink
