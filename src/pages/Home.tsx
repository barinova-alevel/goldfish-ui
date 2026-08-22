import { Link } from 'react-router-dom'
import { CirclePlus } from 'lucide-react'

export function Home() {
  return (
    <div>
      <h1 className="mb-6 font-script text-5xl text-brown">Self Finance Manager</h1>
      <div className="w-full max-w-4xl rounded-md border border-welcome-border bg-welcome-bg p-6">
        <p className="text-base leading-relaxed">
          Application of managing self finance with daily and date periodical report
          features.
        </p>
        <p className="mt-2 text-base leading-relaxed">
          React UI with a .NET Core REST API backend.
        </p>

        <Link
          to="/operations"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <CirclePlus className="size-4" aria-hidden="true" />
          Go to Operations
        </Link>
      </div>
    </div>
  )
}
