import type { ReactNode } from 'react'

export function dataRowClass(tone = '') {
  return [
    'max-lg:mb-3 max-lg:block max-lg:rounded-md max-lg:border max-lg:border-brown/10 max-lg:p-2',
    'lg:border-t lg:border-brown/10',
    tone,
  ]
    .filter(Boolean)
    .join(' ')
}

export function DataCell({
  label,
  align = 'end',
  className = '',
  children,
}: {
  label: string
  align?: 'start' | 'end'
  className?: string
  children: ReactNode
}) {
  return (
    <td
      className={[
        'max-lg:flex max-lg:items-start max-lg:justify-between max-lg:gap-3 max-lg:px-2 max-lg:py-2 lg:px-4 lg:py-3',
        className,
      ].join(' ')}
    >
      <span className="shrink-0 pt-0.5 text-xs font-semibold tracking-wide text-brown-muted uppercase lg:hidden">
        {label}
      </span>
      <div
        className={[
          'min-w-0 break-words',
          align === 'end' ? 'text-right lg:text-left' : 'text-left',
        ].join(' ')}
      >
        {children}
      </div>
    </td>
  )
}
