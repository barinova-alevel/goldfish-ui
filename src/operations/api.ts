import { messageFromBody, readJsonBody, requestJson } from '../api/http'
import { parseDailyReport, parseOperationList, parseOperationTypeList } from './parse'
import type { ApiResult, DailyReport, Operation, OperationType, OperationTypeWrite, OperationWrite } from './types'

async function asResult<T>(
  response: Response,
  map: (body: unknown) => T,
  fallback: string,
): Promise<ApiResult<T>> {
  const body = await readJsonBody(response)

  if (response.status === 401) {
    return { ok: false, status: 401, message: 'Your session expired. Please log in again.' }
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: messageFromBody(body, fallback),
    }
  }

  return { ok: true, data: map(body) }
}

function networkFailure<T>(): ApiResult<T> {
  return {
    ok: false,
    status: 0,
    message: 'Unable to reach the server. Please try again.',
  }
}

export async function listOperations(token: string): Promise<ApiResult<Operation[]>> {
  try {
    const response = await requestJson('/api/Operations', { token })
    return await asResult(response, parseOperationList, 'Failed to load operations.')
  } catch {
    return networkFailure()
  }
}

export async function listOperationTypes(token: string): Promise<ApiResult<OperationType[]>> {
  try {
    const response = await requestJson('/api/OperationTypes', { token })
    return await asResult(response, parseOperationTypeList, 'Failed to load operation types.')
  } catch {
    return networkFailure()
  }
}

export async function createOperation(
  token: string,
  payload: OperationWrite,
): Promise<ApiResult<unknown>> {
  try {
    const response = await requestJson('/api/Operations', {
      method: 'POST',
      token,
      body: payload,
    })
    return await asResult(response, (body) => body, 'Failed to create operation.')
  } catch {
    return networkFailure()
  }
}

export async function updateOperation(
  token: string,
  id: number,
  payload: OperationWrite,
): Promise<ApiResult<unknown>> {
  try {
    const response = await requestJson(`/api/Operations/${id}`, {
      method: 'PUT',
      token,
      body: { ...payload, operationId: id },
    })
    return await asResult(response, (body) => body, 'Failed to update operation.')
  } catch {
    return networkFailure()
  }
}

export async function deleteOperation(token: string, id: number): Promise<ApiResult<unknown>> {
  try {
    const response = await requestJson(`/api/Operations/${id}`, {
      method: 'DELETE',
      token,
    })
    return await asResult(response, (body) => body, 'Failed to delete operation.')
  } catch {
    return networkFailure()
  }
}

export async function createOperationType(
  token: string,
  payload: OperationTypeWrite,
): Promise<ApiResult<unknown>> {
  try {
    const response = await requestJson('/api/OperationTypes', {
      method: 'POST',
      token,
      body: payload,
    })
    return await asResult(response, (body) => body, 'Failed to create operation type.')
  } catch {
    return networkFailure()
  }
}

export async function updateOperationType(
  token: string,
  id: number,
  payload: OperationTypeWrite,
): Promise<ApiResult<unknown>> {
  try {
    const response = await requestJson(`/api/OperationTypes/${id}`, {
      method: 'PUT',
      token,
      body: { ...payload, operationTypeId: id },
    })
    return await asResult(response, (body) => body, 'Failed to update operation type.')
  } catch {
    return networkFailure()
  }
}

export async function deleteOperationType(token: string, id: number): Promise<ApiResult<unknown>> {
  try {
    const response = await requestJson(`/api/OperationTypes/${id}`, {
      method: 'DELETE',
      token,
    })
    return await asResult(response, (body) => body, 'Failed to delete operation type.')
  } catch {
    return networkFailure()
  }
}

export async function getDailyReport(
  token: string,
  date: string,
): Promise<ApiResult<DailyReport>> {
  try {
    const response = await requestJson(
      `/api/DailyReport/report/daily?date=${encodeURIComponent(date)}`,
      { token },
    )
    const result = await asResult(response, (body) => body, 'Failed to generate daily report.')
    if (!result.ok) {
      return result
    }

    const report = parseDailyReport(result.data)
    if (!report) {
      return { ok: false, status: response.status, message: 'The server returned an invalid daily report.' }
    }

    return { ok: true, data: report }
  } catch {
    return networkFailure()
  }
}
