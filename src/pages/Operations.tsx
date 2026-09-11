import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CirclePlus, Pencil, Trash2, X } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import {
  createOperation,
  deleteOperation,
  listOperations,
  listOperationTypes,
  updateOperation,
} from '../operations/api'
import type { Operation, OperationType } from '../operations/types'

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

function formatAmount(amount: number, isIncome: boolean) {
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  return `${isIncome ? '+' : '-'}${formatted}`
}

function categoryFor(operation: Operation, types: OperationType[]) {
  return (
    operation.operationType ??
    types.find((type) => type.operationTypeId === operation.operationTypeId)
  )
}

interface FormState {
  operationId?: number
  date: string
  amount: string
  note: string
  operationTypeId: string
}

const emptyForm: FormState = {
  date: todayIsoDate(),
  amount: '',
  note: '',
  operationTypeId: '',
}

export function Operations() {
  const { user } = useAuth()
  const token = user?.token ?? ''

  const [operations, setOperations] = useState<Operation[]>([])
  const [types, setTypes] = useState<OperationType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Operation | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    setLoadError('')

    const [operationsResult, typesResult] = await Promise.all([
      listOperations(token),
      listOperationTypes(token),
    ])

    if (!operationsResult.ok) {
      setLoadError(operationsResult.message)
      setOperations([])
    } else {
      setOperations(operationsResult.data)
    }

    if (typesResult.ok) {
      setTypes(typesResult.data)
    } else if (operationsResult.ok) {
      setLoadError(typesResult.message)
    }

    setLoading(false)
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const typeOptions = useMemo(
    () => [...types].sort((a, b) => a.name.localeCompare(b.name)),
    [types],
  )

  function openCreate() {
    setForm({ ...emptyForm, date: todayIsoDate() })
    setFormErrors({})
    setActionError('')
    setFormOpen(true)
  }

  function openEdit(operation: Operation) {
    setForm({
      operationId: operation.operationId,
      date: operation.date,
      amount: String(operation.amount),
      note: operation.note,
      operationTypeId: String(operation.operationTypeId),
    })
    setFormErrors({})
    setActionError('')
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setForm(emptyForm)
    setFormErrors({})
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = Number(form.amount)
    const operationTypeId = Number(form.operationTypeId)
    const nextErrors: Partial<Record<keyof FormState, string>> = {}

    if (!form.date) {
      nextErrors.date = 'Date is required'
    }
    if (!form.amount.trim() || !Number.isFinite(amount) || amount === 0) {
      nextErrors.amount = 'Enter a non-zero amount'
    }
    if (!form.operationTypeId || !Number.isFinite(operationTypeId) || operationTypeId <= 0) {
      nextErrors.operationTypeId = 'Please select an operation type'
    }

    setFormErrors(nextErrors)
    setActionError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    const payload = {
      date: form.date,
      amount,
      note: form.note.trim(),
      operationTypeId,
    }

    const result = form.operationId
      ? await updateOperation(token, form.operationId, payload)
      : await createOperation(token, payload)

    setSubmitting(false)

    if (!result.ok) {
      setActionError(result.message)
      return
    }

    closeForm()
    await load()
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)
    setActionError('')
    const result = await deleteOperation(token, deleteTarget.operationId)
    setDeleting(false)

    if (!result.ok) {
      setActionError(result.message)
      return
    }

    setDeleteTarget(null)
    await load()
  }

  const isEditing = form.operationId !== undefined

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-script text-4xl text-brown">Operations</h1>
          <p className="mt-1 text-sm text-brown-muted">List of operations</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-brown px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-brown-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <CirclePlus className="size-4" aria-hidden="true" />
          Add New Operation
        </button>
      </div>

      {actionError && !formOpen && !deleteTarget ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-md border border-welcome-border bg-welcome-bg px-3 py-2 text-sm text-brown">
          Loading operations…
        </p>
      ) : loadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {loadError}
        </p>
      ) : operations.length === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          No operations found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-brown/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-cream text-brown">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Note</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((operation) => {
                const category = categoryFor(operation, types)
                const isIncome = category?.isIncome === true
                return (
                  <tr
                    key={operation.operationId}
                    className={`border-t border-brown/10 ${isIncome ? 'bg-emerald-50/70' : 'bg-red-50/60'}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(operation.date)}</td>
                    <td
                      className={`px-4 py-3 font-semibold whitespace-nowrap ${isIncome ? 'text-emerald-800' : 'text-red-800'}`}
                    >
                      {formatAmount(operation.amount, isIncome)}
                    </td>
                    <td className="px-4 py-3">{category?.name || '—'}</td>
                    <td className="px-4 py-3">{operation.note || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(operation)}
                          className="inline-flex items-center rounded-md border border-brown/20 bg-white p-1.5 text-brown hover:bg-tan"
                          aria-label={`Edit operation ${operation.operationId}`}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionError('')
                            setDeleteTarget(operation)
                          }}
                          className="inline-flex items-center rounded-md border border-red-200 bg-white p-1.5 text-red-700 hover:bg-red-50"
                          aria-label={`Delete operation ${operation.operationId}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-brown/10 bg-cream p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brown">
                {isEditing ? 'Edit Operation' : 'Create Operation'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md p-1 text-brown-muted hover:bg-tan"
                aria-label="Close"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {actionError ? (
              <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {actionError}
              </p>
            ) : null}

            {typeOptions.length === 0 ? (
              <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                No operation types found.{' '}
                <Link to="/operation-types" className="font-semibold underline">
                  Create one first
                </Link>
                .
              </p>
            ) : null}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="operationTypeId" className="mb-1.5 block text-sm font-medium text-brown">
                  Operation Type *
                </label>
                <select
                  id="operationTypeId"
                  value={form.operationTypeId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, operationTypeId: event.target.value }))
                  }
                  className="w-full rounded-md border border-brown/20 bg-white px-3 py-2.5 text-sm text-brown focus:border-brown focus:ring-1 focus:ring-brown focus:outline-none"
                >
                  <option value="">-- Select operation type --</option>
                  {typeOptions.map((type) => (
                    <option key={type.operationTypeId} value={type.operationTypeId}>
                      {type.name}
                      {type.isIncome ? ' (income)' : ''}
                    </option>
                  ))}
                </select>
                {formErrors.operationTypeId ? (
                  <p className="mt-1 text-xs text-red-700">{formErrors.operationTypeId}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-brown">
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  className="w-full rounded-md border border-brown/20 bg-white px-3 py-2.5 text-sm text-brown focus:border-brown focus:ring-1 focus:ring-brown focus:outline-none"
                />
                {formErrors.date ? <p className="mt-1 text-xs text-red-700">{formErrors.date}</p> : null}
              </div>

              <div>
                <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-brown">
                  Amount *
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  className="w-full rounded-md border border-brown/20 bg-white px-3 py-2.5 text-sm text-brown focus:border-brown focus:ring-1 focus:ring-brown focus:outline-none"
                />
                {formErrors.amount ? (
                  <p className="mt-1 text-xs text-red-700">{formErrors.amount}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-brown">
                  Note
                </label>
                <textarea
                  id="note"
                  rows={3}
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  className="w-full rounded-md border border-brown/20 bg-white px-3 py-2.5 text-sm text-brown focus:border-brown focus:ring-1 focus:ring-brown focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-brown/20 bg-white px-4 py-2 text-sm font-semibold text-brown hover:bg-tan"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || typeOptions.length === 0}
                  className="rounded-md bg-brown px-4 py-2 text-sm font-semibold text-cream hover:bg-brown-light disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : isEditing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-brown/10 bg-cream p-6 shadow-lg">
            <h2 className="mb-3 text-xl font-bold text-brown">Confirm Delete</h2>
            <p className="text-sm text-brown">Are you sure you want to delete this operation?</p>
            <p className="mt-2 text-sm text-red-700">This action cannot be undone.</p>
            {actionError ? (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {actionError}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-brown/20 bg-white px-4 py-2 text-sm font-semibold text-brown hover:bg-tan"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
