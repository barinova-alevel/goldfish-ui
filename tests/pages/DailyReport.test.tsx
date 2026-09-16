import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DailyReport } from '../../src/pages/DailyReport'
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
  getDailyReport: vi.fn(),
}))

const getDailyReportMock = vi.mocked(operationsApi.getDailyReport)

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
  date: '2026-09-16',
  amount: 20,
  note: '',
  operationTypeId: 2,
  operationType: groceries,
}

const untypedOperation: Operation = {
  operationId: 14,
  date: '2026-09-16',
  amount: 8,
  note: 'A'.repeat(51),
  operationTypeId: 9,
}

function todayIsoDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
}

function renderDailyReport() {
  return render(<DailyReport />)
}

async function generateReport() {
  await userEvent.click(screen.getByRole('button', { name: 'Generate Report' }))
}

describe('DailyReport', () => {
  beforeEach(() => {
    authState.user = user
    getDailyReportMock.mockReset()
    getDailyReportMock.mockResolvedValue({
      ok: true,
      data: {
        date: '2026-09-16',
        totalIncome: 150.5,
        totalExpenses: 20,
        operations: [incomeOperation, expenseOperation],
      },
    })
  })

  it('renders the date form and does not load a report until generate is clicked', () => {
    renderDailyReport()

    expect(screen.getByRole('heading', { name: 'Daily Report' })).toBeInTheDocument()
    expect(screen.getByText('Generate financial reports for a date')).toBeInTheDocument()
    expect(screen.getByLabelText('Date *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate Report' })).toBeInTheDocument()
    expect(screen.queryByText('Total Income')).not.toBeInTheDocument()
    expect(getDailyReportMock).not.toHaveBeenCalled()
  })

  it('generates a report for today with the signed-in token', async () => {
    renderDailyReport()
    await generateReport()

    await waitFor(() => {
      expect(getDailyReportMock).toHaveBeenCalledWith('token-1', todayIsoDate())
    })

    expect(screen.getByRole('heading', { name: 'Total Income' })).toBeInTheDocument()
    expect(screen.getByText(formatMoney(150.5))).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Total Expenses' })).toBeInTheDocument()
    expect(screen.getByText(formatMoney(20))).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Operations (2)' })).toBeInTheDocument()

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText(formatDate('2026-09-16'))).toBeInTheDocument()
    expect(within(rows[1]).getByText('Income')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Salary')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Monthly pay')).toBeInTheDocument()
    expect(within(rows[1]).getByText('+150.50')).toBeInTheDocument()
    expect(within(rows[1]).getByText('September')).toBeInTheDocument()

    expect(within(rows[2]).getByText('Expense')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Groceries')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Food')).toBeInTheDocument()
    expect(within(rows[2]).getByText('-20.00')).toBeInTheDocument()
    expect(within(rows[2]).getByText('No note')).toBeInTheDocument()
  })

  it('requests the selected calendar date', async () => {
    renderDailyReport()

    await userEvent.click(screen.getByLabelText('Date *'))
    const dialog = await screen.findByRole('dialog')
    const today = new Date()
    const otherDay = today.getDate() === 15 ? 16 : 15
    await userEvent.click(within(dialog).getByRole('button', { name: String(otherDay) }))

    await generateReport()

    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(otherDay).padStart(2, '0')}`
    await waitFor(() => {
      expect(getDailyReportMock).toHaveBeenCalledWith('token-1', expectedDate)
    })
  })

  it('shows an empty operations state when the report has no rows', async () => {
    getDailyReportMock.mockResolvedValue({
      ok: true,
      data: {
        date: todayIsoDate(),
        totalIncome: 0,
        totalExpenses: 0,
        operations: [],
      },
    })

    renderDailyReport()
    await generateReport()

    expect(
      await screen.findByText('No operations found for the selected date.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Operations (0)' })).toBeInTheDocument()
  })

  it('filters operations by income and expenses, then restores all', async () => {
    renderDailyReport()
    await generateReport()

    expect(await screen.findByRole('heading', { name: 'Operations (2)' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Income' }))
    expect(screen.getByRole('heading', { name: 'Operations (1)' })).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Expenses' }))
    expect(screen.getByRole('heading', { name: 'Operations (1)' })).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.queryByText('Salary')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByRole('heading', { name: 'Operations (2)' })).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('resets the filter to all when a new report is generated', async () => {
    renderDailyReport()
    await generateReport()
    expect(await screen.findByRole('heading', { name: 'Operations (2)' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Income' }))
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()

    await generateReport()
    expect(await screen.findByRole('heading', { name: 'Operations (2)' })).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('treats operations without a type as expenses, truncates long notes, and shows a dash for category', async () => {
    getDailyReportMock.mockResolvedValue({
      ok: true,
      data: {
        date: '2026-09-16',
        totalIncome: 0,
        totalExpenses: 8,
        operations: [untypedOperation],
      },
    })

    renderDailyReport()
    await generateReport()

    expect(await screen.findByText('Expense')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('-8.00')).toBeInTheDocument()

    const truncated = `${'A'.repeat(50)}…`
    const note = screen.getByText(truncated)
    expect(note).toHaveAttribute('title', 'A'.repeat(51))

    await userEvent.click(screen.getByRole('button', { name: 'Expenses' }))
    expect(screen.getByRole('heading', { name: 'Operations (1)' })).toBeInTheDocument()
  })

  it('shows the API message and clears a previous report when generate fails', async () => {
    getDailyReportMock
      .mockResolvedValueOnce({
        ok: true,
        data: {
          date: '2026-09-16',
          totalIncome: 150.5,
          totalExpenses: 20,
          operations: [incomeOperation],
        },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        message: 'Failed to generate daily report.',
      })

    renderDailyReport()
    await generateReport()
    expect(await screen.findByText('Salary')).toBeInTheDocument()

    await generateReport()
    expect(await screen.findByText('Failed to generate daily report.')).toBeInTheDocument()
    expect(screen.queryByText('Total Income')).not.toBeInTheDocument()
    expect(screen.queryByText('Salary')).not.toBeInTheDocument()
  })

  it('shows generating state while the report request is pending', async () => {
    let resolveReport: ((value: Awaited<ReturnType<typeof operationsApi.getDailyReport>>) => void) | undefined
    getDailyReportMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReport = resolve
        }),
    )

    renderDailyReport()
    await generateReport()

    expect(screen.getByRole('button', { name: 'Generating Report…' })).toBeDisabled()

    resolveReport?.({
      ok: true,
      data: {
        date: todayIsoDate(),
        totalIncome: 0,
        totalExpenses: 0,
        operations: [],
      },
    })

    expect(await screen.findByRole('button', { name: 'Generate Report' })).toBeEnabled()
  })

  it('sends an empty token when the user is not signed in', async () => {
    authState.user = null
    renderDailyReport()
    await generateReport()

    await waitFor(() => {
      expect(getDailyReportMock).toHaveBeenCalledWith('', todayIsoDate())
    })
  })
})
