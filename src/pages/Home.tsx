import { Link } from 'react-router-dom'
import { CirclePlus } from 'lucide-react'

export function Home() {
  return (
    <div data-testid="home-page">
      <h1 data-testid="home-heading" className="mb-6 font-script text-5xl text-brown">
        Self Finance Manager
      </h1>
      <div
        data-testid="home-welcome-card"
        className="w-full max-w-4xl rounded-md border border-welcome-border bg-welcome-bg p-6"
      >
        <p data-testid="home-intro" className="text-base leading-relaxed">
          Take control of your everyday finances. Track your income and expenses, monitor your spending habits, and get clear daily and period-based reports to better understand where your money goes.
        </p>
        <p data-testid="home-tech-stack" className="mt-2 text-base leading-relaxed">
          Built with: React, TypeScript, Tailwind CSS, and .NET Core REST API.
        </p>

        <Link
          to="/operations"
          data-testid="home-operations-link"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <CirclePlus className="size-4" aria-hidden="true" />
          Go to Operations
        </Link>
      </div>
    </div>
  )
}
