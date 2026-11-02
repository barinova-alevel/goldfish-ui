import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  icon: LucideIcon
  children: ReactNode
  testId?: string
  headingTestId?: string
}

export function AuthCard({ title, icon: Icon, children, testId, headingTestId }: AuthCardProps) {
  return (
    <div data-testid={testId} className="mx-auto w-full max-w-md">
      <div className="rounded-lg border border-brown/10 bg-cream p-4 shadow-lg sm:p-8">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Icon className="size-7 shrink-0 text-brown" aria-hidden="true" />
          <h1 data-testid={headingTestId} className="text-2xl font-bold text-brown sm:text-3xl">
            {title}
          </h1>
        </div>
        {children}
      </div>
    </div>
  )
}
