import { DataCell, dataRowClass } from '../ui/DataCell'
import type { Operation } from '../../operations/types'

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

export function ReportOperationsTable({ operations }: { operations: Operation[] }) {
  return (
    <div className="lg:overflow-x-auto">
      <table className="w-full text-left text-sm lg:min-w-full">
        <thead className="bg-white text-brown max-lg:hidden">
          <tr>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold">Note</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((operation) => {
            const income = isIncomeOperation(operation)
            return (
              <tr
                key={operation.operationId}
                className={dataRowClass(income ? 'bg-emerald-50/70' : 'bg-red-50/60')}
              >
                <DataCell label="Date">
                  <span className="whitespace-nowrap">{formatDate(operation.date)}</span>
                </DataCell>
                <DataCell label="Type">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold text-white ${income ? 'bg-emerald-700' : 'bg-red-700'}`}
                  >
                    {income ? 'Income' : 'Expense'}
                  </span>
                </DataCell>
                <DataCell label="Category" align="start">
                  <p className="font-medium text-brown">{operation.operationType?.name || '—'}</p>
                  {operation.operationType?.description ? (
                    <p className="text-xs text-brown-muted">{operation.operationType.description}</p>
                  ) : null}
                </DataCell>
                <DataCell label="Amount">
                  <span
                    className={`font-semibold whitespace-nowrap ${income ? 'text-emerald-800' : 'text-red-800'}`}
                  >
                    {formatSignedAmount(operation.amount, income)}
                  </span>
                </DataCell>
                <DataCell label="Note" align="start">
                  {operation.note ? (
                    <span title={operation.note}>{truncateNote(operation.note)}</span>
                  ) : (
                    <span className="text-brown-muted">No note</span>
                  )}
                </DataCell>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
