import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Operations } from '../../src/pages/Operations'
import type { AuthContextValue } from '../../src/auth/context'
import type { UserInfo } from '../../src/auth/types'
import * as operationsApi from '../../src/operations/api'
import type { Operation, OperationType } from '../../src/operations/types'

vi.mock('../../src/auth/useAuth', () => ({
  useAuth: (): Pick<AuthContextValue, 'user'> => ({
    user: authState.user,
  }),
}))

vi.mock('../../src/operations/api', () => ({
  listOperations: vi.fn(),
  listOperationTypes: vi.fn(),
  createOperation: vi.fn(),
  updateOperation: vi.fn(),
  deleteOperation: vi.fn(),
}))

const listOperationsMock = vi.mocked(operationsApi.listOperations)
const listOperationTypesMock = vi.mocked(operationsApi.listOperationTypes)
const createOperationMock = vi.mocked(operationsApi.createOperation)
const updateOperationMock = vi.mocked(operationsApi.updateOperation)
const deleteOperationMock = vi.mocked(operationsApi.deleteOperation)

const user: UserInfo = {
  userId: 'user-1',
  email: 'user@example.com',
  name: 'Gold Fish',
  role: 'User',
  token: 'token-1',
}

const authState: { user: UserInfo | null } = {
  user,
}

const salary: OperationType = {
  operationTypeId: 3,
  name: 'Salary',
  description: 'Monthly pay',
  isIncome: true,
}

const groceries: OperationType = {
  operationTypeId: 2,
  name: 'Groceries',
  description: 'Food',
  isIncome: false,
}

const incomeOperation: Operation = {
  operationId: 12,
  date: '2026-09-16',
  amount: 150.5,
  note: 'September',
  operationTypeId: 3,
  operationType: salary,
}

const expenseOperation: Operation = {
  operationId: 13,
  date: '2026-09-15',
  amount: 20,
  note: '',
  operationTypeId: 2,
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

function renderOperations() {
  return render(
    <MemoryRouter>
      <Operations />
    </MemoryRouter>,
  )
}

async function waitForList() {
  expect(await screen.findByRole('columnheader', { name: 'Date' })).toBeInTheDocument()
}

describe('Operations', () => {
  beforeEach(() => {
    authState.user = user
    listOperationsMock.mockReset()
    listOperationTypesMock.mockReset()
    createOperationMock.mockReset()
    updateOperationMock.mockReset()
    deleteOperationMock.mockReset()

    listOperationsMock.mockResolvedValue({ ok: true, data: [incomeOperation, expenseOperation] })
    listOperationTypesMock.mockResolvedValue({ ok: true, data: [salary, groceries] })
  })

  it('loads operations and shows income and expense rows', async () => {
    renderOperations()

    expect(screen.getByText('Loading operations…')).toBeInTheDocument()
    await waitForList()

    expect(listOperationsMock).toHaveBeenCalledWith('token-1')
    expect(listOperationTypesMock).toHaveBeenCalledWith('token-1')
    expect(screen.getByText(formatDate('2026-09-16'))).toBeInTheDocument()
    expect(screen.getByText('+150.50')).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('September')).toBeInTheDocument()
    expect(screen.getByText(formatDate('2026-09-15'))).toBeInTheDocument()
    expect(screen.getByText('-20.00')).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('shows an empty state when there are no operations', async () => {
    listOperationsMock.mockResolvedValue({ ok: true, data: [] })

    renderOperations()

    expect(await screen.findByText('No operations found.')).toBeInTheDocument()
  })

  it('shows the operations load error', async () => {
    listOperationsMock.mockResolvedValue({
      ok: false,
      status: 500,
      message: 'Failed to load operations.',
    })

    renderOperations()

    expect(await screen.findByText('Failed to load operations.')).toBeInTheDocument()
  })

  it('shows the types load error when operations succeed', async () => {
    listOperationTypesMock.mockResolvedValue({
      ok: false,
      status: 500,
      message: 'Failed to load operation types.',
    })

    renderOperations()

    expect(await screen.findByText('Failed to load operation types.')).toBeInTheDocument()
  })

  it('validates create form fields before calling the API', async () => {
    renderOperations()
    await waitForList()

    await userEvent.click(screen.getByRole('button', { name: 'Add New Operation' }))

    expect(screen.getByRole('heading', { name: 'Create Operation' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '0' } })
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(screen.getByText('Enter a non-zero amount')).toBeInTheDocument()
    expect(screen.getByText('Please select an operation type')).toBeInTheDocument()
    expect(createOperationMock).not.toHaveBeenCalled()
  })

  it('creates an operation and reloads the list', async () => {
    createOperationMock.mockResolvedValue({ ok: true, data: {} })
    listOperationsMock
      .mockResolvedValueOnce({ ok: true, data: [] })
      .mockResolvedValueOnce({ ok: true, data: [incomeOperation] })
    listOperationTypesMock.mockResolvedValue({ ok: true, data: [salary] })

    renderOperations()

    expect(await screen.findByText('No operations found.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add New Operation' }))

    await userEvent.selectOptions(screen.getByLabelText('Operation Type *'), '3')
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '150.5' } })
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: '  September  ' } })
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(createOperationMock).toHaveBeenCalledWith('token-1', {
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        amount: 150.5,
        note: 'September',
        operationTypeId: 3,
      })
    })

    expect(await screen.findByText('Salary')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Create Operation' })).not.toBeInTheDocument()
  })

  it('shows the API message when create is rejected', async () => {
    createOperationMock.mockResolvedValue({
      ok: false,
      status: 400,
      message: 'Amount is invalid',
    })

    renderOperations()
    await waitForList()

    await userEvent.click(screen.getByRole('button', { name: 'Add New Operation' }))
    await userEvent.selectOptions(screen.getByLabelText('Operation Type *'), '3')
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '10' } })
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Amount is invalid')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create Operation' })).toBeInTheDocument()
  })

  it('edits an existing operation', async () => {
    updateOperationMock.mockResolvedValue({ ok: true, data: {} })

    renderOperations()
    await waitForList()

    await userEvent.click(screen.getByRole('button', { name: 'Edit operation 12' }))

    expect(screen.getByRole('heading', { name: 'Edit Operation' })).toBeInTheDocument()
    expect(screen.getByLabelText('Amount *')).toHaveValue(150.5)
    expect(screen.getByLabelText('Note')).toHaveValue('September')

    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '200' } })
    await userEvent.click(screen.getByRole('button', { name: 'Update' }))

    await waitFor(() => {
      expect(updateOperationMock).toHaveBeenCalledWith('token-1', 12, {
        date: '2026-09-16',
        amount: 200,
        note: 'September',
        operationTypeId: 3,
      })
    })
  })

  it('deletes an operation after confirmation', async () => {
    deleteOperationMock.mockResolvedValue({ ok: true, data: {} })
    listOperationsMock
      .mockResolvedValueOnce({ ok: true, data: [incomeOperation] })
      .mockResolvedValueOnce({ ok: true, data: [] })
    listOperationTypesMock.mockResolvedValue({ ok: true, data: [salary] })

    renderOperations()
    await waitForList()

    await userEvent.click(screen.getByRole('button', { name: 'Delete operation 12' }))

    const dialog = screen.getByRole('heading', { name: 'Confirm Delete' }).closest('div')
    expect(dialog).not.toBeNull()
    expect(
      within(dialog as HTMLElement).getByText(
        'Are you sure you want to delete this operation?',
      ),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(deleteOperationMock).toHaveBeenCalledWith('token-1', 12)
    })
    expect(await screen.findByText('No operations found.')).toBeInTheDocument()
  })

  it('keeps the delete dialog open when delete fails', async () => {
    deleteOperationMock.mockResolvedValue({
      ok: false,
      status: 500,
      message: 'Failed to delete operation.',
    })

    renderOperations()
    await waitForList()

    await userEvent.click(screen.getByRole('button', { name: 'Delete operation 12' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Failed to delete operation.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Confirm Delete' })).toBeInTheDocument()
  })
})
