import type { LucideIcon } from 'lucide-react'

interface AuthFieldProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon: LucideIcon
  autoComplete?: string
  error?: string
}

export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  autoComplete,
  error,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-brown">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brown-muted"
          aria-hidden="true"
        />
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          className="w-full rounded-md border border-brown/20 bg-white py-2.5 pr-3 pl-10 text-sm text-brown placeholder:text-brown-muted/60 focus:border-brown focus:ring-1 focus:ring-brown focus:outline-none"
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  )
}
