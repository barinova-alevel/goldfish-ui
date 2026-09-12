import { useMemo, useState, type FormEvent } from 'react'
import { FileText } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { DatePicker } from '../components/ui/DatePicker'
import { getDailyReport } from '../operations/api'
import type { DailyReport, Operation } from '../operations/types'

type OperationFilter = 'all' | 'income' | 'expense'

function todayIsoDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) {
    return isoDate
  }

  return new Date(year, month - 1, day).toLocaleDateString()
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
}

function formatSignedAmount(amount: number, isIncome: boolean) {
  return `${isIncome ? '+' : '-'}${formatMoney(amount)}`
}

function truncateNote(note: string) {
  if (note.length <= 50) {
    return note
  }

  return `${note.slice(0, 50)}…`
}

function isIncomeOperation(operation: Operation) {
  return operation.operationType?.isIncome === true
}

export function DailyReport() {
  const { user } = useAuth()
  const token = user?.token ?? ''

  const [date, setDate] = useState(todayIsoDate)
  const [dateError, setDateError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<DailyReport | null>(null)
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

    if (!date) {
      setDateError('Date is required')
      return
    }

    setDateError('')
    setError('')
    setGenerating(true)

    const result = await getDailyReport(token, date)
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
        <h1 className="font-script text-4xl text-brown">Daily Report</h1>
        <p className="mt-1 text-sm text-brown-muted">Generate financial reports for a date</p>
      </div>

      <section className="mb-6 max-w-xl rounded-md border border-brown/10 bg-cream p-5">
        <h2 className="mb-4 text-base font-semibold text-brown">Select Date</h2>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="w-72">
            <label htmlFor="report-date" className="mb-1.5 block text-sm font-medium text-brown">
              Date *
            </label>
            <DatePicker
              id="report-date"
              value={date}
              required
              aria-invalid={dateError ? true : undefined}
              onChange={setDate}
            />
            {dateError ? <p className="mt-1 text-xs text-red-700">{dateError}</p> : null}
          </div>
          <button
            type="submit"
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-md bg-brown px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-brown-light disabled:opacity-60"
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
            <article className="rounded-md bg-emerald-700 p-4 text-white">
              <h3 className="text-sm font-medium">Total Income</h3>
              <p className="mt-1 text-2xl font-bold">{formatMoney(report.totalIncome)}</p>
            </article>
            <article className="rounded-md bg-red-700 p-4 text-white">
              <h3 className="text-sm font-medium">Total Expenses</h3>
              <p className="mt-1 text-2xl font-bold">{formatMoney(report.totalExpenses)}</p>
            </article>
          </div>

          <section className="overflow-hidden rounded-md border border-brown/10">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-cream px-4 py-3">
              <h2 className="text-sm font-semibold text-brown">
                Operations ({filteredOperations.length})
              </h2>
              <div className="flex gap-2">
                <FilterButton
                  active={filter === 'all'}
                  onClick={() => setFilter('all')}
                  label="All"
                />
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
                No operations found for the selected date.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white text-brown">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOperations.map((operation) => {
                      const income = isIncomeOperation(operation)
                      return (
                        <tr
                          key={operation.operationId}
                          className={`border-t border-brown/10 ${income ? 'bg-emerald-50/70' : 'bg-red-50/60'}`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(operation.date)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold text-white ${income ? 'bg-emerald-700' : 'bg-red-700'}`}
                            >
                              {income ? 'Income' : 'Expense'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-brown">
                              {operation.operationType?.name || '—'}
                            </p>
                            {operation.operationType?.description ? (
                              <p className="text-xs text-brown-muted">
                                {operation.operationType.description}
                              </p>
                            ) : null}
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold whitespace-nowrap ${income ? 'text-emerald-800' : 'text-red-800'}`}
                          >
                            {formatSignedAmount(operation.amount, income)}
                          </td>
                          <td className="px-4 py-3 text-brown">
                            {operation.note ? (
                              <span title={operation.note}>{truncateNote(operation.note)}</span>
                            ) : (
                              <span className="text-brown-muted">No note</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
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
        'rounded-md border px-3 py-1.5 text-xs font-semibold',
        active
          ? 'border-brown bg-brown text-cream'
          : 'border-brown/20 bg-white text-brown hover:bg-tan',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
