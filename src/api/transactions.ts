import { apiFetch } from './client'
import type { TransactionsResponse } from './types'

export interface TransactionFilters {
  q: string
  accountId: string
}

export function getTransactions({ q, accountId }: TransactionFilters, signal?: AbortSignal) {
  const params = new URLSearchParams({ limit: '8' })
  if (q) params.set('q', q)
  if (accountId !== 'all') params.set('accountId', accountId)
  return apiFetch<TransactionsResponse>(`/api/transactions?${params}`, { signal })
}
