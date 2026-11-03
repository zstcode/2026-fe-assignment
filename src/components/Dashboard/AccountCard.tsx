import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'
import { DashboardText } from './DashboardText'

export function AccountCard({
  account,
  isLoading,
  isSelected,
  onSelect,
}: {
  account?: Account
  isLoading: boolean
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      className={`panel account-card${account && account.type === 'credit' ? ' account-credit' : ''}`}
      disabled={isLoading}
      aria-label={account ? `Filter transactions by ${account.name}` : undefined}
      aria-pressed={account ? isSelected : undefined}
      onClick={() => account && onSelect(account.id)}
    >
      <DashboardText className="account-label" showSkeleton={isLoading}>
        {account?.name}
      </DashboardText>
      <DashboardText className="account-number amount" showSkeleton={isLoading}>
        {account?.maskedNumber}
      </DashboardText>
      <span className="account-summary">
        <DashboardText className="account-balance amount" showSkeleton={isLoading}>
          {account && formatMoney(account.balance)}
        </DashboardText>
        <DashboardText className="account-caption" showSkeleton={isLoading}>
          {account?.type === 'credit' && 'Amount due'}
        </DashboardText>
      </span>
    </button>
  )
}
