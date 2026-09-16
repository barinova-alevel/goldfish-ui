import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OperationTypes } from '../../src/pages/OperationTypes'
import type { AuthContextValue } from '../../src/auth/context'
import type { UserInfo } from '../../src/auth/types'
import * as operationsApi from '../../src/operations/api'
import type { OperationType } from '../../src/operations/types'

vi.mock('../../src/auth/useAuth', () => ({
  useAuth: (): Pick<AuthContextValue, 'user'> => ({
    user: authState.user,
  }),
}))

vi.mock('../../src/operations/api', () => ({
  listOperationTypes: vi.fn(),
  createOperationType: vi.fn(),
  updateOperationType: vi.fn(),
  deleteOperationType: vi.fn(),
}))

const listOperationTypesMock = vi.mocked(operationsApi.listOperationTypes)
const createOperationTypeMock = vi.mocked(operationsApi.createOperationType)
const updateOperationTypeMock = vi.mocked(operationsApi.updateOperationType)
const deleteOperationTypeMock = vi.mocked(operationsApi.deleteOperationType)

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

const bonus: OperationType = {
  operationTypeId: 4,
  name: 'Bonus',
  description: 'Yearly bonus',
  isIncome: true,
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

const rent: OperationType = {
  operationTypeId: 1,
  name: 'Rent',
  description: '',
  isIncome: false,
}

function renderOperationTypes() {
  return render(<OperationTypes />)
}

async function waitForColumns() {
  expect(await screen.findByText('Income Types')).toBeInTheDocument()
  expect(screen.getByText('Expense Types')).toBeInTheDocument()
}

function column(title: string) {
  const heading = screen.getByText(title)
  const section = heading.closest('section')
  if (!section) {
    throw new Error(`Could not find section for ${title}`)
  }
  return within(section)
}

describe('OperationTypes', () => {
  beforeEach(() => {
    authState.user = user
    listOperationTypesMock.mockReset()
    createOperationTypeMock.mockReset()
    updateOperationTypeMock.mockReset()
    deleteOperationTypeMock.mockReset()

    listOperationTypesMock.mockResolvedValue({
      ok: true,
      data: [salary, groceries, bonus, rent],
    })
  })

  it('loads types into income and expense columns sorted by name', async () => {
    renderOperationTypes()

    expect(screen.getByText('Loading operation types…')).toBeInTheDocument()
    await waitForColumns()

    expect(listOperationTypesMock).toHaveBeenCalledWith('token-1')

    const incomeNames = column('Income Types')
      .getAllByRole('listitem')
      .map((item) => item.querySelector('.font-medium')?.textContent)
    expect(incomeNames).toEqual(['Bonus', 'Salary'])
    expect(column('Income Types').getByText('Yearly bonus')).toBeInTheDocument()
    expect(column('Income Types').getByText('Monthly pay')).toBeInTheDocument()

    const expenseNames = column('Expense Types')
      .getAllByRole('listitem')
      .map((item) => item.querySelector('.font-medium')?.textContent)
    expect(expenseNames).toEqual(['Groceries', 'Rent'])
    expect(column('Expense Types').getByText('Food')).toBeInTheDocument()
  })

  it('shows an empty state when there are no types', async () => {
    listOperationTypesMock.mockResolvedValue({ ok: true, data: [] })

    renderOperationTypes()

    expect(
      await screen.findByText(
        'No operation types found. Create your first type to get started.',
      ),
    ).toBeInTheDocument()
  })

  it('shows empty column copy when only one kind of type exists', async () => {
    listOperationTypesMock.mockResolvedValue({ ok: true, data: [salary] })

    renderOperationTypes()
    await waitForColumns()

    expect(column('Income Types').getByText('Salary')).toBeInTheDocument()
    expect(column('Expense Types').getByText('No expense types defined')).toBeInTheDocument()
  })

  it('shows the load error', async () => {
    listOperationTypesMock.mockResolvedValue({
      ok: false,
      status: 500,
      message: 'Failed to load operation types.',
    })

    renderOperationTypes()

    expect(await screen.findByText('Failed to load operation types.')).toBeInTheDocument()
  })

  it('requires a name before calling create', async () => {
    renderOperationTypes()
    await waitForColumns()

    await userEvent.click(screen.getByRole('button', { name: 'Add New Type' }))

    expect(screen.getByRole('heading', { name: 'Create Operation Type' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(createOperationTypeMock).not.toHaveBeenCalled()
  })

  it('creates an income type, trims fields, and reloads the list', async () => {
    createOperationTypeMock.mockResolvedValue({ ok: true, data: {} })
    listOperationTypesMock
      .mockResolvedValueOnce({ ok: true, data: [] })
      .mockResolvedValueOnce({ ok: true, data: [salary] })

    renderOperationTypes()

    expect(
      await screen.findByText(
        'No operation types found. Create your first type to get started.',
      ),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Add New Type' }))
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: '  Salary  ' } })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: '  Monthly pay  ' },
    })
    await userEvent.click(screen.getByLabelText('This is an income type'))
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(createOperationTypeMock).toHaveBeenCalledWith('token-1', {
        name: 'Salary',
        description: 'Monthly pay',
        isIncome: true,
      })
    })

    expect(await screen.findByText('Salary')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Create Operation Type' }),
    ).not.toBeInTheDocument()
  })

  it('shows the API message when create is rejected', async () => {
    createOperationTypeMock.mockResolvedValue({
      ok: false,
      status: 400,
      message: 'Type already exists',
    })

    renderOperationTypes()
    await waitForColumns()

    await userEvent.click(screen.getByRole('button', { name: 'Add New Type' }))
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Salary' } })
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Type already exists')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create Operation Type' })).toBeInTheDocument()
  })

  it('edits an existing type', async () => {
    updateOperationTypeMock.mockResolvedValue({ ok: true, data: {} })

    renderOperationTypes()
    await waitForColumns()

    await userEvent.click(screen.getByRole('button', { name: 'Edit Salary' }))

    expect(screen.getByRole('heading', { name: 'Edit Operation Type' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name *')).toHaveValue('Salary')
    expect(screen.getByLabelText('Description')).toHaveValue('Monthly pay')
    expect(screen.getByLabelText('This is an income type')).toBeChecked()

    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Base salary' } })
    await userEvent.click(screen.getByRole('button', { name: 'Update' }))

    await waitFor(() => {
      expect(updateOperationTypeMock).toHaveBeenCalledWith('token-1', 3, {
        name: 'Base salary',
        description: 'Monthly pay',
        isIncome: true,
      })
    })
  })

  it('deletes a type after confirmation', async () => {
    deleteOperationTypeMock.mockResolvedValue({ ok: true, data: {} })
    listOperationTypesMock
      .mockResolvedValueOnce({ ok: true, data: [salary] })
      .mockResolvedValueOnce({ ok: true, data: [] })

    renderOperationTypes()
    await waitForColumns()

    await userEvent.click(screen.getByRole('button', { name: 'Delete Salary' }))

    expect(screen.getByRole('heading', { name: 'Confirm Delete' })).toBeInTheDocument()
    expect(screen.getByText(/delete the operation type/)).toHaveTextContent(
      'Are you sure you want to delete the operation type Salary?',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(deleteOperationTypeMock).toHaveBeenCalledWith('token-1', 3)
    })
    expect(
      await screen.findByText(
        'No operation types found. Create your first type to get started.',
      ),
    ).toBeInTheDocument()
  })

  it('keeps the delete dialog open when delete fails', async () => {
    deleteOperationTypeMock.mockResolvedValue({
      ok: false,
      status: 500,
      message: 'Failed to delete operation type.',
    })

    renderOperationTypes()
    await waitForColumns()

    await userEvent.click(screen.getByRole('button', { name: 'Delete Groceries' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Failed to delete operation type.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Confirm Delete' })).toBeInTheDocument()
  })
})
