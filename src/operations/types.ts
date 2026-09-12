export interface OperationType {
  operationTypeId: number
  name: string
  description: string
  isIncome: boolean
}

export interface Operation {
  operationId: number
  date: string
  amount: number
  note: string
  operationTypeId: number
  operationType?: OperationType
}

export interface OperationWrite {
  operationId?: number
  date: string
  amount: number
  note: string
  operationTypeId: number
}

export interface OperationTypeWrite {
  operationTypeId?: number
  name: string
  description: string
  isIncome: boolean
}

export interface DailyReport {
  date: string
  totalIncome: number
  totalExpenses: number
  operations: Operation[]
}

export interface PeriodReport {
  startDate: string
  endDate: string
  totalIncome: number
  totalExpenses: number
  operations: Operation[]
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }
