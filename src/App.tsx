import { lazy, Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './api/client'
import type { AccountsResponse, CustomerResponse } from './api/types'
import { getTransactions } from './api/transactions'
import useDebouncedValue from './hooks/useDebouncedValue'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard/Dashboard'
import { TransferDialog } from './components/TransferDialog/TransferDialog'

const DebugDrawer = lazy(() => import('./components/DebugDrawer'))

export default function App() {
  const [transferOpen, setTransferOpen] = useState(false)
  const [today] = useState(() => new Date())
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 250)
  const [accountId, setAccountId] = useState('all')

  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: async ({ signal }) => {
      const [customer, accounts] = await Promise.all([
        apiFetch<CustomerResponse>('/api/customer', { signal }),
        apiFetch<AccountsResponse>('/api/accounts', { signal }),
      ])
      return { ...customer, ...accounts }
    },
    retry: false,
  })
  const transactions = useQuery({
    queryKey: ['dashboard', 'transactions', { q: debouncedSearch, accountId }],
    queryFn: ({ signal }) => getTransactions({ q: debouncedSearch, accountId }, signal),
    retry: false,
  })

  return (
    <>
      <Header customer={dashboard.data?.customer} />
      <main id="main" className="page-shell">
        <div className="greeting">
          <h1>
            Good evening
            {dashboard.data ? `, ${dashboard.data.customer.firstName}` : ''}
          </h1>
          <p className="greeting-date muted">
            <time dateTime={today.toISOString()}>
              {today.toLocaleDateString('en-SG', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'Asia/Singapore',
              })}
            </time>
          </p>
        </div>
        {dashboard.isError ? (
          <div className="panel empty-state" role="alert">
            <h2>We couldn't load your dashboard.</h2>
            <button
              className="button primary retry-button"
              disabled={dashboard.isFetching}
              onClick={() => dashboard.refetch()}
            >
              {dashboard.isFetching ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        ) : (
          <Dashboard
            data={dashboard.data}
            transactionQuery={transactions}
            search={search}
            onSearchChange={setSearch}
            accountId={accountId}
            onAccountSelect={(id) => setAccountId((current) => (current === id ? 'all' : id))}
            isSearchPending={search.trim() !== debouncedSearch}
            onTransfer={() => setTransferOpen(true)}
          />
        )}
      </main>
      <Suspense fallback={null}>
        <DebugDrawer />
      </Suspense>
      {transferOpen && dashboard.data && (
        <TransferDialog
          accounts={dashboard.data.accounts}
          remaining={Math.max(0, dashboard.data.customer.dailyTransferLimit - dashboard.data.customer.transferredToday)}
          canMakeAnotherTransfer={dashboard.isSuccess && transactions.isSuccess}
          onClose={() => setTransferOpen(false)}
        />
      )}
    </>
  )
}
