import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PeriodReport } from '../../src/pages/PeriodReport'
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
  getPeriodReport: vi.fn(),
}))

vi.mock('../../src/components/ui/DatePicker', () => ({
  DatePicker: ({
    id,
    value,
    onChange,
    required,
    'aria-invalid': invalid,
  }: {
    id?: string
    value: string
    onChange: (value: string) => void
    required?: boolean
    'aria-invalid'?: boolean
  }) => (
    <input
      id={id}
      value={value}
      required={required}
      aria-invalid={invalid}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

const getPeriodReportMock = vi.mocked(operationsApi.getPeriodReport)

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
  operationType: groceries,
}

const untypedOperation: Operation = {
  operationId: 14,
  date: '2026-09-10',
  amount: 8,
  note: 'A'.repeat(51),
  operationTypeId: 9,
}

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

function formatDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
}

function renderPeriodReport() {
  return render(<PeriodReport />)
}

async function generateReport() {
  await userEvent.click(screen.getByRole('button', { name: 'Generate Report' }))
}

function setDate(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('PeriodReport', () => {
  beforeEach(() => {
    authState.user = user
    getPeriodReportMock.mockReset()
    getPeriodReportMock.mockResolvedValue({
      ok: true,
      data: {
        startDate: '2026-09-01',
        endDate: '2026-09-16',
        totalIncome: 150.5,
        totalExpenses: 20,
        operations: [incomeOperation, expenseOperation],
      },
    })
  })

  it('renders the period form and does not load a report until generate is clicked', () => {
    renderPeriodReport()

    expect(screen.getByRole('heading', { name: 'Period Report' })).toBeInTheDocument()
    expect(screen.getByText('Generate financial reports for any date period')).toBeInTheDocument()
    expect(screen.getByLabelText('Start Date *')).toHaveValue(firstOfMonthIsoDate())
    expect(screen.getByLabelText('End Date *')).toHaveValue(todayIsoDate())
    expect(screen.getByRole('button', { name: 'Generate Report' })).toBeInTheDocument()
    expect(screen.queryByText('Total Income')).not.toBeInTheDocument()
    expect(getPeriodReportMock).not.toHaveBeenCalled()
  })

  it('generates a report for the default month-to-date range with the signed-in token', async () => {
    renderPeriodReport()
    await generateReport()

    await waitFor(() => {
      expect(getPeriodReportMock).toHaveBeenCalledWith(
        'token-1',
        firstOfMonthIsoDate(),
        todayIsoDate(),
      )
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

    expect(within(rows[2]).getByText(formatDate('2026-09-15'))).toBeInTheDocument()
    expect(within(rows[2]).getByText('Expense')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Groceries')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Food')).toBeInTheDocument()
    expect(within(rows[2]).getByText('-20.00')).toBeInTheDocument()
    expect(within(rows[2]).getByText('No note')).toBeInTheDocument()
  })

  it('requests the selected start and end dates', async () => {
    renderPeriodReport()
    setDate('Start Date *', '2026-09-01')
    setDate('End Date *', '2026-09-16')
    await generateReport()

    await waitFor(() => {
      expect(getPeriodReportMock).toHaveBeenCalledWith('token-1', '2026-09-01', '2026-09-16')
    })
  })

  it('requires start and end dates before calling the API', async () => {
    renderPeriodReport()
    setDate('Start Date *', '')
    setDate('End Date *', '')
    await generateReport()

    expect(screen.getByText('Start date is required')).toBeInTheDocument()
    expect(screen.getByText('End date is required')).toBeInTheDocument()
    expect(getPeriodReportMock).not.toHaveBeenCalled()
  })

  it('rejects an end date before the start date', async () => {
    renderPeriodReport()
    setDate('Start Date *', '2026-09-16')
    setDate('End Date *', '2026-09-01')
    await generateReport()

    expect(screen.getByText('End date must be on or after the start date')).toBeInTheDocument()
    expect(getPeriodReportMock).not.toHaveBeenCalled()
  })

  it('allows the same day for start and end', async () => {
    renderPeriodReport()
    setDate('Start Date *', '2026-09-16')
    setDate('End Date *', '2026-09-16')
    await generateReport()

    await waitFor(() => {
      expect(getPeriodReportMock).toHaveBeenCalledWith('token-1', '2026-09-16', '2026-09-16')
    })
  })

  it('shows an empty operations state when the report has no rows', async () => {
    getPeriodReportMock.mockResolvedValue({
      ok: true,
      data: {
        startDate: firstOfMonthIsoDate(),
        endDate: todayIsoDate(),
        totalIncome: 0,
        totalExpenses: 0,
        operations: [],
      },
    })

    renderPeriodReport()
    await generateReport()

    expect(
      await screen.findByText('No operations found for the selected period.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Operations (0)' })).toBeInTheDocument()
  })

  it('filters operations by income and expenses, then restores all', async () => {
    renderPeriodReport()
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
    renderPeriodReport()
    await generateReport()
    expect(await screen.findByRole('heading', { name: 'Operations (2)' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Income' }))
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()

    await generateReport()
    expect(await screen.findByRole('heading', { name: 'Operations (2)' })).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('treats operations without a type as expenses, truncates long notes, and shows a dash for category', async () => {
    getPeriodReportMock.mockResolvedValue({
      ok: true,
      data: {
        startDate: '2026-09-01',
        endDate: '2026-09-16',
        totalIncome: 0,
        totalExpenses: 8,
        operations: [untypedOperation],
      },
    })

    renderPeriodReport()
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
    getPeriodReportMock
      .mockResolvedValueOnce({
        ok: true,
        data: {
          startDate: '2026-09-01',
          endDate: '2026-09-16',
          totalIncome: 150.5,
          totalExpenses: 20,
          operations: [incomeOperation],
        },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        message: 'Failed to generate period report.',
      })

    renderPeriodReport()
    await generateReport()
    expect(await screen.findByText('Salary')).toBeInTheDocument()

    await generateReport()
    expect(await screen.findByText('Failed to generate period report.')).toBeInTheDocument()
    expect(screen.queryByText('Total Income')).not.toBeInTheDocument()
    expect(screen.queryByText('Salary')).not.toBeInTheDocument()
  })

  it('shows generating state while the report request is pending', async () => {
    let resolveReport:
      | ((value: Awaited<ReturnType<typeof operationsApi.getPeriodReport>>) => void)
      | undefined
    getPeriodReportMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReport = resolve
        }),
    )

    renderPeriodReport()
    await generateReport()

    expect(screen.getByRole('button', { name: 'Generating Report…' })).toBeDisabled()

    resolveReport?.({
      ok: true,
      data: {
        startDate: firstOfMonthIsoDate(),
        endDate: todayIsoDate(),
        totalIncome: 0,
        totalExpenses: 0,
        operations: [],
      },
    })

    expect(await screen.findByRole('button', { name: 'Generate Report' })).toBeEnabled()
  })

  it('sends an empty token when the user is not signed in', async () => {
    authState.user = null
    renderPeriodReport()
    await generateReport()

    await waitFor(() => {
      expect(getPeriodReportMock).toHaveBeenCalledWith('', firstOfMonthIsoDate(), todayIsoDate())
    })
  })
})
