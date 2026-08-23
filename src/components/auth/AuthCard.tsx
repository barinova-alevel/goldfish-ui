import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  icon: LucideIcon
  children: ReactNode
}

export function AuthCard({ title, icon: Icon, children }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-lg border border-brown/10 bg-cream p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Icon className="size-7 text-brown" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-brown">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
