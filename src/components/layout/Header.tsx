import { LogIn } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-end border-b border-brown/10 bg-white px-6">
      <div className="mr-auto">
      <h1 className="font-script text-2xl leading-tight text-brown">
          Self Finance Manager
      </h1>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md bg-brown px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-brown-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
      >
        <LogIn className="size-4" aria-hidden="true" />
        Login
      </button>
    </header>
  )
}
