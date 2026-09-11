import type { DailyReport, Operation, OperationType } from './types'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function readString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string') {
      return value
    }
  }

  return undefined
}

function readNumber(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return undefined
}

function readBoolean(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'boolean') {
      return value
    }
  }

  return undefined
}

function readDate(value: unknown) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }

  const record = asRecord(value)
  if (!record) {
    return undefined
  }

  const year = readNumber(record, 'year', 'Year')
  const month = readNumber(record, 'month', 'Month')
  const day = readNumber(record, 'day', 'Day')
  if (year === undefined || month === undefined || day === undefined) {
    return undefined
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseOperationType(value: unknown): OperationType | undefined {
  const record = asRecord(value)
  if (!record) {
    return undefined
  }

  const operationTypeId = readNumber(record, 'operationTypeId', 'OperationTypeId')
  if (operationTypeId === undefined) {
    return undefined
  }

  return {
    operationTypeId,
    name: readString(record, 'name', 'Name') ?? '',
    description: readString(record, 'description', 'Description') ?? '',
    isIncome: readBoolean(record, 'isIncome', 'IsIncome') ?? false,
  }
}

export function parseOperation(value: unknown): Operation | undefined {
  const record = asRecord(value)
  if (!record) {
    return undefined
  }

  const operationId = readNumber(record, 'operationId', 'OperationId')
  const amount = readNumber(record, 'amount', 'Amount')
  const operationTypeId = readNumber(record, 'operationTypeId', 'OperationTypeId')
  const date = readDate(record.date ?? record.Date)

  if (
    operationId === undefined ||
    amount === undefined ||
    operationTypeId === undefined ||
    !date
  ) {
    return undefined
  }

  return {
    operationId,
    date,
    amount,
    note: readString(record, 'note', 'Note') ?? '',
    operationTypeId,
    operationType: parseOperationType(record.operationType ?? record.OperationType),
  }
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }

  const record = asRecord(value)
  const nested = record?.$values ?? record?.items ?? record?.Items
  return Array.isArray(nested) ? nested : []
}

export function parseOperationList(value: unknown): Operation[] {
  return asArray(value).flatMap((item) => {
    const parsed = parseOperation(item)
    return parsed ? [parsed] : []
  })
}

export function parseOperationTypeList(value: unknown): OperationType[] {
  return asArray(value).flatMap((item) => {
    const parsed = parseOperationType(item)
    return parsed ? [parsed] : []
  })
}

export function parseDailyReport(value: unknown): DailyReport | undefined {
  const record = asRecord(value)
  if (!record) {
    return undefined
  }

  const date = readDate(record.date ?? record.Date)
  if (!date) {
    return undefined
  }

  return {
    date,
    totalIncome: readNumber(record, 'totalIncome', 'TotalIncome') ?? 0,
    totalExpenses: readNumber(record, 'totalExpenses', 'TotalExpenses') ?? 0,
    operations: parseOperationList(record.operations ?? record.Operations),
  }
}
