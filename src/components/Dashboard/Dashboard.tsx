import type { UseQueryResult } from '@tanstack/react-query'
import type { Account, Customer, TransactionsResponse } from '../../api/types'
import { formatMoney } from '../../lib/format'
import { Icon } from '../Icon'
import { AccountCard } from './AccountCard'
import { DailyLimitWidget } from './DailyLimitWidget'
import { DashboardText } from './DashboardText'
import { TransactionList } from './TransactionList'

export function Dashboard({
  data,
  transactionQuery,
  search,
  onSearchChange,
  accountId,
  onAccountSelect,
  isSearchPending,
  onTransfer,
}: {
  data?: { accounts: Account[]; customer: Customer }
  transactionQuery: UseQueryResult<TransactionsResponse, Error>
  search: string
  onSearchChange: (search: string) => void
  accountId: string
  onAccountSelect: (id: string) => void
  isSearchPending: boolean
  onTransfer: () => void
}) {
  const isDashboardLoading = !data
  const accounts = data?.accounts ?? []
  const accountCards = isDashboardLoading ? [undefined, undefined, undefined] : accounts
  const deposits = accounts.filter((account) => account.type !== 'credit')
  const total = deposits.reduce((sum, account) => sum + Math.round(account.balance * 100), 0) / 100

  return (
    <div
      className="dashboard-grid"
      role={isDashboardLoading ? 'status' : undefined}
      aria-label={isDashboardLoading ? 'Loading dashboard' : undefined}
      aria-busy={isDashboardLoading || undefined}
    >
      <div className="main-column" aria-hidden={isDashboardLoading || undefined}>
        <section className="balance-hero" aria-labelledby="balance-title">
          <div>
            <h2 id="balance-title" className="eyebrow">
              Total available
            </h2>
            <DashboardText
              as="p"
              className="total amount"
              showSkeleton={isDashboardLoading}
              skeletonClassName="skeleton-balance"
            >
              {formatMoney(total)}
            </DashboardText>
            <DashboardText as="p" className="hero-caption" showSkeleton={isDashboardLoading}>
              Across {deposits.length} deposit accounts
            </DashboardText>
          </div>
          <div className="transfer-action">
            <button className="button primary" onClick={onTransfer} disabled={!deposits.length}>
              <Icon name="plus" />
              New transfer
            </button>
          </div>
        </section>
        <section aria-labelledby="accounts-title">
          <h2 id="accounts-title" className="section-title">
            Accounts
          </h2>
          <div className="account-grid">
            {accountCards.map((account, index) => (
              <AccountCard
                key={account?.id ?? index}
                account={account}
                isLoading={isDashboardLoading}
                isSelected={accountId === account?.id}
                onSelect={onAccountSelect}
              />
            ))}
          </div>
          {!isDashboardLoading && !accounts.length && <p className="panel empty-state">No accounts to display.</p>}
        </section>
        <TransactionList
          transactionQuery={transactionQuery}
          search={search}
          onSearchChange={onSearchChange}
          isDashboardLoading={isDashboardLoading}
          isSearchPending={isSearchPending}
          hasSelectedAccount={accounts.some((account) => account.id === accountId)}
        />
      </div>
      <DailyLimitWidget customer={data?.customer} />
    </div>
  )
}
