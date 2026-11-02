import { useMemo, useState, type FormEvent } from 'react'
import { FileText } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { ReportOperationsTable } from '../components/reports/ReportOperationsTable'
import { DatePicker } from '../components/ui/DatePicker'
import { getPeriodReport } from '../operations/api'
import type { Operation, PeriodReport as PeriodReportData } from '../operations/types'

type OperationFilter = 'all' | 'income' | 'expense'

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayIsoDate() {
  const now = new Date()
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

function firstOfMonthIsoDate() {
  const now = new Date()
  return isoDate(now.getFullYear(), now.getMonth() + 1, 1)
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
}

function isIncomeOperation(operation: Operation) {
  return operation.operationType?.isIncome === true
}

export function PeriodReport() {
  const { user } = useAuth()
  const token = user?.token ?? ''

  const [startDate, setStartDate] = useState(firstOfMonthIsoDate)
  const [endDate, setEndDate] = useState(todayIsoDate)
  const [startError, setStartError] = useState('')
  const [endError, setEndError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<PeriodReportData | null>(null)
  const [filter, setFilter] = useState<OperationFilter>('all')

  const filteredOperations = useMemo(() => {
    if (!report) {
      return []
    }

    if (filter === 'income') {
      return report.operations.filter(isIncomeOperation)
    }

    if (filter === 'expense') {
      return report.operations.filter((operation) => !isIncomeOperation(operation))
    }

    return report.operations
  }, [filter, report])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextStartError = startDate ? '' : 'Start date is required'
    const nextEndError = !endDate
      ? 'End date is required'
      : startDate && endDate < startDate
        ? 'End date must be on or after the start date'
        : ''

    setStartError(nextStartError)
    setEndError(nextEndError)
    setError('')

    if (nextStartError || nextEndError) {
      return
    }

    setGenerating(true)
    const result = await getPeriodReport(token, startDate, endDate)
    setGenerating(false)

    if (!result.ok) {
      setReport(null)
      setError(result.message)
      return
    }

    setFilter('all')
    setReport(result.data)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-script text-3xl leading-tight break-words text-brown sm:text-4xl">Period Report</h1>
        <p className="mt-1 text-sm text-brown-muted">Generate financial reports for any date period</p>
      </div>

      <section className="mb-6 max-w-3xl rounded-md border border-brown/10 bg-cream p-4 sm:p-5">
        <h2 className="mb-4 text-base font-semibold text-brown">Select Period</h2>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label htmlFor="start-date" className="mb-1.5 block text-sm font-medium text-brown">
                Start Date *
              </label>
              <DatePicker
                id="start-date"
                value={startDate}
                max={endDate || undefined}
                required
                aria-invalid={startError ? true : undefined}
                onChange={setStartDate}
              />
              {startError ? <p className="mt-1 text-xs text-red-700">{startError}</p> : null}
            </div>
            <div>
              <label htmlFor="end-date" className="mb-1.5 block text-sm font-medium text-brown">
                End Date *
              </label>
              <DatePicker
                id="end-date"
                value={endDate}
                min={startDate || undefined}
                required
                aria-invalid={endError ? true : undefined}
                onChange={setEndDate}
              />
              {endError ? <p className="mt-1 text-xs text-red-700">{endError}</p> : null}
            </div>
          </div>
          <button
            type="submit"
            disabled={generating}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brown px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-brown-light disabled:opacity-60 sm:min-h-0 sm:w-auto"
          >
            <FileText className="size-4" aria-hidden="true" />
            {generating ? 'Generating Report…' : 'Generate Report'}
          </button>
        </form>
      </section>

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      {report ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <article className="min-w-0 rounded-md bg-emerald-700 p-4 text-white">
              <h3 className="text-sm font-medium">Total Income</h3>
              <p className="mt-1 text-xl font-bold break-words sm:text-2xl">{formatMoney(report.totalIncome)}</p>
            </article>
            <article className="min-w-0 rounded-md bg-red-700 p-4 text-white">
              <h3 className="text-sm font-medium">Total Expenses</h3>
              <p className="mt-1 text-xl font-bold break-words sm:text-2xl">{formatMoney(report.totalExpenses)}</p>
            </article>
          </div>

          <section className="overflow-hidden rounded-md border border-brown/10">
            <div className="flex flex-col gap-3 bg-cream px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-brown">
                Operations ({filteredOperations.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
                <FilterButton
                  active={filter === 'income'}
                  onClick={() => setFilter('income')}
                  label="Income"
                />
                <FilterButton
                  active={filter === 'expense'}
                  onClick={() => setFilter('expense')}
                  label="Expenses"
                />
              </div>
            </div>

            {filteredOperations.length === 0 ? (
              <p className="px-4 py-4 text-sm text-brown-muted">
                No operations found for the selected period.
              </p>
            ) : (
              <div className="max-lg:p-3">
                <ReportOperationsTable operations={filteredOperations} />
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'min-h-11 rounded-md border px-3 py-2 text-sm font-semibold sm:min-h-0 sm:py-1.5 sm:text-xs',
        active
          ? 'border-brown bg-brown text-cream'
          : 'border-brown/20 bg-white text-brown hover:bg-tan',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
