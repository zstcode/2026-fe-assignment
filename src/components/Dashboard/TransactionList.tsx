import { useRef } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { TransactionsResponse } from '../../api/types'
import { formatMoney, formatShortDate } from '../../lib/format'
import { Icon } from '../Icon'

export function TransactionList({
  transactionQuery,
  search,
  onSearchChange,
  isDashboardLoading,
  isSearchPending,
  hasSelectedAccount,
}: {
  transactionQuery: UseQueryResult<TransactionsResponse, Error>
  search: string
  onSearchChange: (search: string) => void
  isDashboardLoading: boolean
  isSearchPending: boolean
  hasSelectedAccount: boolean
}) {
  const searchInput = useRef<HTMLInputElement>(null)
  const hasSearch = search.trim().length > 0
  const matchingCount = transactionQuery.data?.total ?? 0
  const transactions = transactionQuery.data?.transactions ?? []
  const isTransactionsLoading =
    isDashboardLoading || isSearchPending || transactionQuery.isPending || transactionQuery.isFetching

  function clearSearch() {
    onSearchChange('')
    searchInput.current?.focus()
  }

  return (
    <section className="panel transactions" aria-labelledby="transactions-title">
      <div className="transactions-header">
        <div className="transactions-heading">
          <h2 id="transactions-title">Recent transactions</h2>
          <p id="transaction-search-results" className="search-results" role="status" aria-atomic="true">
            {hasSearch &&
              (isTransactionsLoading
                ? 'Searching…'
                : transactionQuery.isSuccess
                  ? `${matchingCount} matching transaction${matchingCount === 1 ? '' : 's'}`
                  : '')}
          </p>
        </div>
        <div className="transaction-search">
          <div className="search-input">
            <Icon name="search" />
            <input
              ref={searchInput}
              aria-label="Search transactions"
              aria-describedby="transaction-search-results"
              placeholder="Search transactions"
              type="search"
              disabled={isDashboardLoading}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>
      </div>
      {isTransactionsLoading ? (
        <TransactionsSkeleton />
      ) : transactionQuery.isError ? (
        <div className="empty-state" role="alert">
          <p>We couldn't load your transactions.</p>
          <button className="button primary" onClick={() => transactionQuery.refetch()}>
            Retry transactions
          </button>
        </div>
      ) : transactions.length ? (
        <ul className="transaction-list">
          {transactions.map((transaction) => (
            <li className="transaction-row" key={transaction.id}>
              <h3 className="transaction-description">{transaction.description}</h3>
              <p className="transaction-meta">
                <span className="category">{transaction.category}</span>
                <span aria-hidden="true"> · </span>
                <time dateTime={transaction.date}>{formatShortDate(transaction.date)}</time>
              </p>
              <div className="transaction-value">
                <span className={`amount ${transaction.direction === 'in' ? 'positive' : ''}`}>
                  {transaction.direction === 'in' ? '+' : '-'}
                  {formatMoney(transaction.amount)}
                </span>
                {transaction.status === 'pending' && <span className="badge">Pending</span>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p>
            {hasSearch
              ? 'No transactions match your search.'
              : hasSelectedAccount
                ? 'No recent transactions for this account.'
                : 'No recent transactions.'}
          </p>
          {hasSearch && (
            <button type="button" className="button secondary" onClick={clearSearch}>
              Clear search
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function TransactionsSkeleton() {
  return (
    <div role="status" aria-label="Loading transactions" aria-busy="true">
      <ul className="transaction-list" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <li className="transaction-row" key={index}>
            <span className="transaction-description skeleton skeleton-text">&nbsp;</span>
            <span className="transaction-meta skeleton skeleton-text">&nbsp;</span>
            <span className="transaction-value">
              <span className="amount skeleton skeleton-text">&nbsp;</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
