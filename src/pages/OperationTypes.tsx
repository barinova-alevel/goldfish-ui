import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowDownCircle, ArrowUpCircle, CirclePlus, Pencil, Trash2, X } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import {
  createOperationType,
  deleteOperationType,
  listOperationTypes,
  updateOperationType,
} from '../operations/api'
import type { OperationType } from '../operations/types'

interface FormState {
  operationTypeId?: number
  name: string
  description: string
  isIncome: boolean
}

const emptyForm: FormState = {
  name: '',
  description: '',
  isIncome: false,
}

const nameMaxLength = 100
const descriptionMaxLength = 500

export function OperationTypes() {
  const { user } = useAuth()
  const token = user?.token ?? ''

  const [types, setTypes] = useState<OperationType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<'name' | 'description', string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<OperationType | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    setLoadError('')

    const result = await listOperationTypes(token)
    if (!result.ok) {
      setLoadError(result.message)
      setTypes([])
    } else {
      setTypes(result.data)
    }

    setLoading(false)
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const incomeTypes = useMemo(
    () => types.filter((type) => type.isIncome).sort((a, b) => a.name.localeCompare(b.name)),
    [types],
  )
  const expenseTypes = useMemo(
    () => types.filter((type) => !type.isIncome).sort((a, b) => a.name.localeCompare(b.name)),
    [types],
  )

  function openCreate() {
    setForm(emptyForm)
    setFormErrors({})
    setActionError('')
    setFormOpen(true)
  }

  function openEdit(type: OperationType) {
    setForm({
      operationTypeId: type.operationTypeId,
      name: type.name,
      description: type.description,
      isIncome: type.isIncome,
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

    const name = form.name.trim()
    const description = form.description.trim()
    const nextErrors: Partial<Record<'name' | 'description', string>> = {}

    if (!name) {
      nextErrors.name = 'Name is required'
    } else if (name.length > nameMaxLength) {
      nextErrors.name = `Name cannot exceed ${nameMaxLength} characters`
    }

    if (description.length > descriptionMaxLength) {
      nextErrors.description = `Description cannot exceed ${descriptionMaxLength} characters`
    }

    setFormErrors(nextErrors)
    setActionError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    const payload = {
      name,
      description,
      isIncome: form.isIncome,
    }

    const result = form.operationTypeId
      ? await updateOperationType(token, form.operationTypeId, payload)
      : await createOperationType(token, payload)

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
    const result = await deleteOperationType(token, deleteTarget.operationTypeId)
    setDeleting(false)

    if (!result.ok) {
      setActionError(result.message)
      return
    }

    setDeleteTarget(null)
    await load()
  }

  const isEditing = form.operationTypeId !== undefined

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-script text-4xl text-brown">Operation Types</h1>
          <p className="mt-1 text-sm text-brown-muted">Manage income and expense categories</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-brown px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-brown-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <CirclePlus className="size-4" aria-hidden="true" />
          Add New Type
        </button>
      </div>

      {actionError && !formOpen && !deleteTarget ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-md border border-welcome-border bg-welcome-bg px-3 py-2 text-sm text-brown">
          Loading operation types…
        </p>
      ) : loadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {loadError}
        </p>
      ) : types.length === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          No operation types found. Create your first type to get started.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <TypeColumn
            title="Income Types"
            emptyText="No income types defined"
            types={incomeTypes}
            income
            onEdit={openEdit}
            onDelete={(type) => {
              setActionError('')
              setDeleteTarget(type)
            }}
          />
          <TypeColumn
            title="Expense Types"
            emptyText="No expense types defined"
            types={expenseTypes}
            income={false}
            onEdit={openEdit}
            onDelete={(type) => {
              setActionError('')
              setDeleteTarget(type)
            }}
          />
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-brown/10 bg-cream p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brown">
                {isEditing ? 'Edit Operation Type' : 'Create Operation Type'}
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

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-brown">
                  Name *
                </label>
                <input
                  id="name"
                  value={form.name}
                  maxLength={nameMaxLength}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-md border border-brown/20 bg-white px-3 py-2.5 text-sm text-brown focus:border-brown focus:ring-1 focus:ring-brown focus:outline-none"
                />
                {formErrors.name ? <p className="mt-1 text-xs text-red-700">{formErrors.name}</p> : null}
              </div>

              <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brown">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  maxLength={descriptionMaxLength}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="w-full rounded-md border border-brown/20 bg-white px-3 py-2.5 text-sm text-brown focus:border-brown focus:ring-1 focus:ring-brown focus:outline-none"
                />
                {formErrors.description ? (
                  <p className="mt-1 text-xs text-red-700">{formErrors.description}</p>
                ) : null}
              </div>

              <label htmlFor="isIncome" className="flex items-center gap-2 text-sm text-brown">
                <input
                  id="isIncome"
                  type="checkbox"
                  checked={form.isIncome}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isIncome: event.target.checked }))
                  }
                  className="size-4 rounded border-brown/30"
                />
                This is an income type
              </label>

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
                  disabled={submitting}
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
            <p className="text-sm text-brown">
              Are you sure you want to delete the operation type{' '}
              <span className="font-semibold">{deleteTarget.name}</span>?
            </p>
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

function TypeColumn({
  title,
  emptyText,
  types,
  income,
  onEdit,
  onDelete,
}: {
  title: string
  emptyText: string
  types: OperationType[]
  income: boolean
  onEdit: (type: OperationType) => void
  onDelete: (type: OperationType) => void
}) {
  const Icon = income ? ArrowUpCircle : ArrowDownCircle

  return (
    <section className="overflow-hidden rounded-md border border-brown/10">
      <div
        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white ${income ? 'bg-emerald-700' : 'bg-red-700'}`}
      >
        <Icon className="size-4" aria-hidden="true" />
        {title}
      </div>
      <div className="bg-white">
        {types.length === 0 ? (
          <p className="px-4 py-4 text-sm text-brown-muted">{emptyText}</p>
        ) : (
          <ul>
            {types.map((type) => (
              <li
                key={type.operationTypeId}
                className="flex items-start justify-between gap-3 border-t border-brown/10 px-4 py-3 first:border-t-0"
              >
                <div>
                  <p className="font-medium text-brown">{type.name}</p>
                  {type.description ? (
                    <p className="mt-0.5 text-sm text-brown-muted">{type.description}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(type)}
                    className="inline-flex items-center rounded-md border border-brown/20 bg-white p-1.5 text-brown hover:bg-tan"
                    aria-label={`Edit ${type.name}`}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(type)}
                    className="inline-flex items-center rounded-md border border-red-200 bg-white p-1.5 text-red-700 hover:bg-red-50"
                    aria-label={`Delete ${type.name}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
