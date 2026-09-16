import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requestJson } from '../../src/api/http'
import {
  createOperation,
  createOperationType,
  deleteOperation,
  deleteOperationType,
  getDailyReport,
  getPeriodReport,
  listOperations,
  listOperationTypes,
  updateOperation,
  updateOperationType,
} from '../../src/operations/api'

vi.mock('../../src/api/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/http')>()
  return {
    ...actual,
    requestJson: vi.fn(),
  }
})

const requestJsonMock = vi.mocked(requestJson)

function jsonResponse(status: number, body: unknown = null) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: body === null ? undefined : { 'Content-Type': 'application/json' },
  })
}

const token = 'token-1'

const operationType = {
  operationTypeId: 3,
  name: 'Salary',
  description: 'Monthly pay',
  isIncome: true,
}

const operation = {
  operationId: 12,
  date: '2026-09-16',
  amount: 150.5,
  note: 'September',
  operationTypeId: 3,
  operationType,
}

const writePayload = {
  date: '2026-09-16',
  amount: 150.5,
  note: 'September',
  operationTypeId: 3,
}

describe('operations api', () => {
  beforeEach(() => {
    requestJsonMock.mockReset()
  })

  it('lists operations from /api/Operations', async () => {
    requestJsonMock.mockResolvedValue(jsonResponse(200, [operation]))

    await expect(listOperations(token)).resolves.toEqual({
      ok: true,
      data: [operation],
    })
    expect(requestJsonMock).toHaveBeenCalledWith('/api/Operations', { token })
  })

  it('lists operation types from /api/OperationTypes', async () => {
    requestJsonMock.mockResolvedValue(jsonResponse(200, [operationType]))

    await expect(listOperationTypes(token)).resolves.toEqual({
      ok: true,
      data: [operationType],
    })
    expect(requestJsonMock).toHaveBeenCalledWith('/api/OperationTypes', {
      token,
    })
  })

  it('maps 401 responses to a session-expired message', async () => {
    requestJsonMock.mockResolvedValue(
      jsonResponse(401, { message: 'expired' }),
    )

    await expect(listOperations(token)).resolves.toEqual({
      ok: false,
      status: 401,
      message: 'Your session expired. Please log in again.',
    })
  })

  it('maps other API errors to the body message or fallback', async () => {
    requestJsonMock.mockResolvedValue(
      jsonResponse(400, { message: 'Too many results' }),
    )

    await expect(listOperations(token)).resolves.toEqual({
      ok: false,
      status: 400,
      message: 'Too many results',
    })

    requestJsonMock.mockResolvedValue(jsonResponse(500, {}))

    await expect(listOperationTypes(token)).resolves.toEqual({
      ok: false,
      status: 500,
      message: 'Failed to load operation types.',
    })
  })

  it('maps network failures to a reachability error', async () => {
    requestJsonMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(createOperation(token, writePayload)).resolves.toEqual({
      ok: false,
      status: 0,
      message: 'Unable to reach the server. Please try again.',
    })
  })

  it('creates an operation with POST', async () => {
    requestJsonMock.mockResolvedValue(jsonResponse(201, { id: 12 }))

    await expect(createOperation(token, writePayload)).resolves.toEqual({
      ok: true,
      data: { id: 12 },
    })
    expect(requestJsonMock).toHaveBeenCalledWith('/api/Operations', {
      method: 'POST',
      token,
      body: writePayload,
    })
  })

  it('updates an operation with PUT and includes the id', async () => {
    requestJsonMock.mockResolvedValue(jsonResponse(200, {}))

    await expect(updateOperation(token, 12, writePayload)).resolves.toEqual({
      ok: true,
      data: {},
    })
    expect(requestJsonMock).toHaveBeenCalledWith('/api/Operations/12', {
      method: 'PUT',
      token,
      body: { ...writePayload, operationId: 12 },
    })
  })

  it('deletes an operation with DELETE', async () => {
    requestJsonMock.mockResolvedValue(jsonResponse(204))

    await expect(deleteOperation(token, 12)).resolves.toEqual({
      ok: true,
      data: null,
    })
    expect(requestJsonMock).toHaveBeenCalledWith('/api/Operations/12', {
      method: 'DELETE',
      token,
    })
  })

  it('creates, updates, and deletes operation types', async () => {
    const typeWrite = {
      name: 'Salary',
      description: 'Monthly pay',
      isIncome: true,
    }

    requestJsonMock.mockResolvedValue(jsonResponse(201, { id: 3 }))
    await expect(createOperationType(token, typeWrite)).resolves.toEqual({
      ok: true,
      data: { id: 3 },
    })
    expect(requestJsonMock).toHaveBeenCalledWith('/api/OperationTypes', {
      method: 'POST',
      token,
      body: typeWrite,
    })

    requestJsonMock.mockResolvedValue(jsonResponse(200, {}))
    await expect(updateOperationType(token, 3, typeWrite)).resolves.toEqual({
      ok: true,
      data: {},
    })
    expect(requestJsonMock).toHaveBeenCalledWith('/api/OperationTypes/3', {
      method: 'PUT',
      token,
      body: { ...typeWrite, operationTypeId: 3 },
    })

    requestJsonMock.mockResolvedValue(jsonResponse(204))
    await expect(deleteOperationType(token, 3)).resolves.toEqual({
      ok: true,
      data: null,
    })
    expect(requestJsonMock).toHaveBeenCalledWith('/api/OperationTypes/3', {
      method: 'DELETE',
      token,
    })
  })

  it('loads a daily report for the requested date', async () => {
    requestJsonMock.mockResolvedValue(
      jsonResponse(200, {
        date: '2026-09-16',
        totalIncome: 150.5,
        totalExpenses: 0,
        operations: [operation],
      }),
    )

    await expect(getDailyReport(token, '2026-09-16')).resolves.toEqual({
      ok: true,
      data: {
        date: '2026-09-16',
        totalIncome: 150.5,
        totalExpenses: 0,
        operations: [operation],
      },
    })
    expect(requestJsonMock).toHaveBeenCalledWith(
      '/api/DailyReport/report/daily?date=2026-09-16',
      { token },
    )
  })

  it('rejects an invalid daily report payload', async () => {
    requestJsonMock.mockResolvedValue(jsonResponse(200, { totalIncome: 10 }))

    await expect(getDailyReport(token, '2026-09-16')).resolves.toEqual({
      ok: false,
      status: 200,
      message: 'The server returned an invalid daily report.',
    })
  })

  it('loads a period report for the requested range', async () => {
    requestJsonMock.mockResolvedValue(
      jsonResponse(200, {
        startDate: '2026-09-01',
        endDate: '2026-09-16',
        totalIncome: 150.5,
        totalExpenses: 20,
        operations: [operation],
      }),
    )

    await expect(
      getPeriodReport(token, '2026-09-01', '2026-09-16'),
    ).resolves.toEqual({
      ok: true,
      data: {
        startDate: '2026-09-01',
        endDate: '2026-09-16',
        totalIncome: 150.5,
        totalExpenses: 20,
        operations: [operation],
      },
    })
    expect(requestJsonMock).toHaveBeenCalledWith(
      '/api/PeriodReport/report/period?startDate=2026-09-01&endDate=2026-09-16',
      { token },
    )
  })

  it('rejects an invalid period report payload', async () => {
    requestJsonMock.mockResolvedValue(
      jsonResponse(200, { startDate: '2026-09-01' }),
    )

    await expect(
      getPeriodReport(token, '2026-09-01', '2026-09-16'),
    ).resolves.toEqual({
      ok: false,
      status: 200,
      message: 'The server returned an invalid period report.',
    })
  })
})
