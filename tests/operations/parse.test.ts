import { describe, expect, it } from 'vitest'
import {
  parseDailyReport,
  parseOperation,
  parseOperationList,
  parseOperationType,
  parseOperationTypeList,
  parsePeriodReport,
} from '../../src/operations/parse'

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

describe('parseOperationType', () => {
  it('reads camelCase fields', () => {
    expect(parseOperationType(operationType)).toEqual(operationType)
  })

  it('reads PascalCase fields and defaults missing strings and flags', () => {
    expect(
      parseOperationType({
        OperationTypeId: '7',
        Name: 'Groceries',
      }),
    ).toEqual({
      operationTypeId: 7,
      name: 'Groceries',
      description: '',
      isIncome: false,
    })
  })

  it('returns undefined for non-objects and records without an id', () => {
    expect(parseOperationType(null)).toBeUndefined()
    expect(parseOperationType([])).toBeUndefined()
    expect(parseOperationType({ name: 'Salary' })).toBeUndefined()
  })
})

describe('parseOperation', () => {
  it('reads camelCase fields and a nested operation type', () => {
    expect(parseOperation(operation)).toEqual(operation)
  })

  it('reads PascalCase fields, string numbers, and a date-only ISO timestamp', () => {
    expect(
      parseOperation({
        OperationId: '4',
        Date: '2026-01-02T18:30:00Z',
        Amount: '25.00',
        Note: 'Coffee',
        OperationTypeId: '2',
        OperationType: {
          OperationTypeId: 2,
          Name: 'Food',
          IsIncome: false,
        },
      }),
    ).toEqual({
      operationId: 4,
      date: '2026-01-02',
      amount: 25,
      note: 'Coffee',
      operationTypeId: 2,
      operationType: {
        operationTypeId: 2,
        name: 'Food',
        description: '',
        isIncome: false,
      },
    })
  })

  it('reads a date object with year, month, and day', () => {
    expect(
      parseOperation({
        operationId: 1,
        amount: 10,
        operationTypeId: 2,
        date: { Year: 2026, Month: 3, Day: 9 },
      }),
    ).toEqual({
      operationId: 1,
      date: '2026-03-09',
      amount: 10,
      note: '',
      operationTypeId: 2,
      operationType: undefined,
    })
  })

  it('returns undefined when required fields are missing or invalid', () => {
    expect(parseOperation(null)).toBeUndefined()
    expect(
      parseOperation({
        operationId: 1,
        amount: 10,
        operationTypeId: 2,
        date: '16/09/2026',
      }),
    ).toBeUndefined()
    expect(
      parseOperation({
        amount: 10,
        operationTypeId: 2,
        date: '2026-09-16',
      }),
    ).toBeUndefined()
  })
})

describe('parseOperationList', () => {
  it('parses an array and skips invalid items', () => {
    expect(parseOperationList([operation, { name: 'bad' }, null])).toEqual([
      operation,
    ])
  })

  it('unwraps $values, items, and Items collections', () => {
    expect(parseOperationList({ $values: [operation] })).toEqual([operation])
    expect(parseOperationList({ items: [operation] })).toEqual([operation])
    expect(parseOperationList({ Items: [operation] })).toEqual([operation])
  })

  it('returns an empty array for unexpected values', () => {
    expect(parseOperationList(null)).toEqual([])
    expect(parseOperationList('operations')).toEqual([])
    expect(parseOperationList({})).toEqual([])
  })
})

describe('parseOperationTypeList', () => {
  it('parses nested collections and skips invalid items', () => {
    expect(
      parseOperationTypeList({
        $values: [operationType, { name: 'missing id' }],
      }),
    ).toEqual([operationType])
  })
})

describe('parseDailyReport', () => {
  it('reads totals and nested operations', () => {
    expect(
      parseDailyReport({
        date: '2026-09-16T00:00:00',
        totalIncome: '100',
        TotalExpenses: 40,
        operations: [operation],
      }),
    ).toEqual({
      date: '2026-09-16',
      totalIncome: 100,
      totalExpenses: 40,
      operations: [operation],
    })
  })

  it('defaults missing totals and operations', () => {
    expect(
      parseDailyReport({
        Date: { year: 2026, month: 9, day: 1 },
      }),
    ).toEqual({
      date: '2026-09-01',
      totalIncome: 0,
      totalExpenses: 0,
      operations: [],
    })
  })

  it('returns undefined without a usable date', () => {
    expect(parseDailyReport(null)).toBeUndefined()
    expect(parseDailyReport({ totalIncome: 1 })).toBeUndefined()
  })
})

describe('parsePeriodReport', () => {
  it('reads start and end dates plus nested operations', () => {
    expect(
      parsePeriodReport({
        StartDate: '2026-09-01',
        endDate: { year: 2026, month: 9, day: 16 },
        totalIncome: 200,
        totalExpenses: '50',
        Operations: [operation],
      }),
    ).toEqual({
      startDate: '2026-09-01',
      endDate: '2026-09-16',
      totalIncome: 200,
      totalExpenses: 50,
      operations: [operation],
    })
  })

  it('returns undefined when either bound is missing', () => {
    expect(
      parsePeriodReport({
        startDate: '2026-09-01',
        totalIncome: 1,
      }),
    ).toBeUndefined()
  })
})
