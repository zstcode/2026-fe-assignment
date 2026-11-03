import type { ReactNode } from 'react'

export function DashboardText({
  as: Component = 'span',
  className,
  showSkeleton,
  skeletonClassName = 'skeleton-text',
  children,
}: {
  as?: 'span' | 'p'
  className: string
  showSkeleton: boolean
  skeletonClassName?: string
  children: ReactNode
}) {
  return (
    <Component className={`${className}${showSkeleton ? ` skeleton ${skeletonClassName}` : ''}`}>
      {showSkeleton ? '\u00a0' : children}
    </Component>
  )
}
