import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function parseIsoDate(iso: string): Date | null {
  if (!ISO_DATE.test(iso)) {
    return null
  }

  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return date
}

export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatDisplayDate(iso: string) {
  const date = parseIsoDate(iso)
  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function firstWeekday(): number {
  try {
    const locale = new Intl.Locale(navigator.language)
    const firstDay = (locale as Intl.Locale & { weekInfo?: { firstDay: number } }).weekInfo
      ?.firstDay
    if (firstDay == null) {
      return 1
    }

    return firstDay === 7 ? 0 : firstDay
  } catch {
    return 1
  }
}

function weekdayLabels(weekStart: number) {
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(2026, 5, 7 + weekStart + index)
    return formatter.format(day)
  })
}

function monthTitle(year: number, month: number) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  )
}

function buildCells(year: number, month: number, weekStart: number) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() - weekStart + 7) % 7
  const start = new Date(year, month, 1 - offset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function isDisabled(iso: string, min?: string, max?: string) {
  if (min && iso < min) {
    return true
  }

  if (max && iso > max) {
    return true
  }

  return false
}

interface DatePickerProps {
  id: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  required?: boolean
  disabled?: boolean
  'aria-invalid'?: boolean
}

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  'aria-invalid': invalid,
}: DatePickerProps) {
  const labelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = parseIsoDate(value)
  const [view, setView] = useState(() => startOfDay(selected ?? new Date()))
  const [position, setPosition] = useState({ top: 0, left: 0, width: 288 })

  const weekStart = useMemo(firstWeekday, [])
  const labels = useMemo(() => weekdayLabels(weekStart), [weekStart])
  const cells = useMemo(
    () => buildCells(view.getFullYear(), view.getMonth(), weekStart),
    [view, weekStart],
  )
  const todayIso = toIsoDate(new Date())

  function updatePosition() {
    const button = buttonRef.current
    if (!button) {
      return
    }

    const rect = button.getBoundingClientRect()
    const width = rect.width
    const estimatedHeight = 360
    const gap = 8
    const fitsBelow = rect.bottom + gap + estimatedHeight <= window.innerHeight
    const top = fitsBelow ? rect.bottom + gap : Math.max(8, rect.top - estimatedHeight - gap)
    const left = Math.min(rect.left, window.innerWidth - width - 8)

    setPosition({ top, left: Math.max(8, left), width })
  }

  useEffect(() => {
    if (!open) {
      return
    }

    setView(startOfDay(parseIsoDate(value) ?? new Date()))
    updatePosition()

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return
      }

      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    function onReposition() {
      updatePosition()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, value])

  function selectDate(date: Date) {
    const iso = toIsoDate(date)
    if (isDisabled(iso, min, max)) {
      return
    }

    onChange(iso)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function shiftMonth(delta: number) {
    setView((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  function shiftYear(delta: number) {
    setView((current) => new Date(current.getFullYear() + delta, current.getMonth(), 1))
  }

  const display = formatDisplayDate(value)

  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current)
          }
        }}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-brown/20 bg-white px-3 py-2.5 text-left text-sm text-brown focus:border-brown focus:ring-1 focus:ring-brown focus:outline-none disabled:opacity-60"
      >
        <span className={display ? 'text-brown' : 'text-brown-muted/70'}>
          {display || 'Select date'}
        </span>
        <CalendarDays className="size-4 shrink-0 text-brown-muted" aria-hidden="true" />
      </button>

      {open
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-modal="false"
              aria-labelledby={labelId}
              style={{ top: position.top, left: position.left, width: position.width }}
              className="fixed z-50 rounded-lg border border-brown/15 bg-cream p-3 shadow-xl"
            >
              <div className="mb-2 flex items-center justify-between gap-1">
                <div className="flex items-center">
                  <NavButton label="Previous year" onClick={() => shiftYear(-1)}>
                    <ChevronsLeft className="size-4" />
                  </NavButton>
                  <NavButton label="Previous month" onClick={() => shiftMonth(-1)}>
                    <ChevronLeft className="size-4" />
                  </NavButton>
                </div>
                <p id={labelId} className="px-1 text-center text-sm font-semibold text-brown">
                  {monthTitle(view.getFullYear(), view.getMonth())}
                </p>
                <div className="flex items-center">
                  <NavButton label="Next month" onClick={() => shiftMonth(1)}>
                    <ChevronRight className="size-4" />
                  </NavButton>
                  <NavButton label="Next year" onClick={() => shiftYear(1)}>
                    <ChevronsRight className="size-4" />
                  </NavButton>
                </div>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-0.5">
                {labels.map((label) => (
                  <div
                    key={label}
                    className="py-1 text-center text-[11px] font-semibold tracking-wide text-brown-muted uppercase"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((date) => {
                  const iso = toIsoDate(date)
                  const inMonth = date.getMonth() === view.getMonth()
                  const selectedDay = iso === value
                  const today = iso === todayIso
                  const disabledDay = isDisabled(iso, min, max)

                  return (
                    <button
                      key={iso + String(inMonth)}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => selectDate(date)}
                      className={[
                        'flex aspect-square items-center justify-center rounded-md text-sm transition-colors',
                        selectedDay
                          ? 'bg-brown font-semibold text-cream'
                          : today
                            ? 'bg-tan font-semibold text-brown ring-1 ring-brown/40'
                            : inMonth
                              ? 'text-brown hover:bg-tan'
                              : 'text-brown-muted/45 hover:bg-tan/60',
                        disabledDay ? 'cursor-not-allowed opacity-30 hover:bg-transparent' : '',
                      ].join(' ')}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-brown/10 pt-2">
                {required ? (
                  <span />
                ) : (
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-xs font-semibold text-brown-muted hover:bg-tan hover:text-brown"
                    onClick={() => {
                      onChange('')
                      setOpen(false)
                      buttonRef.current?.focus()
                    }}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  disabled={isDisabled(todayIso, min, max)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-brown hover:bg-tan disabled:opacity-40"
                  onClick={() => selectDate(startOfDay(new Date()))}
                >
                  Today
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-md p-1 text-brown-muted hover:bg-tan hover:text-brown"
    >
      {children}
    </button>
  )
}
