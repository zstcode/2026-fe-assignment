import type { Customer } from '../../api/types'
import { formatMoney } from '../../lib/format'
import { DashboardText } from './DashboardText'
import { Icon } from '../Icon'

export function DailyLimitWidget({ customer }: { customer?: Customer }) {
  const isLoading = !customer
  const remaining = customer ? Math.max(0, customer.dailyTransferLimit - customer.transferredToday) : 0

  return (
    <aside className="panel daily-limit" aria-labelledby="limit-title" aria-hidden={isLoading || undefined}>
      <div className="limit-heading">
        <span className="account-icon">
          <Icon name="clock" />
        </span>
        <h2 id="limit-title">Daily limit</h2>
      </div>
      <p className="limit-balance">
        <DashboardText className="limit-amount amount" showSkeleton={isLoading}>
          {formatMoney(remaining)}
        </DashboardText>
        <span className="muted">remaining today</span>
      </p>
      <progress value={remaining} max={customer?.dailyTransferLimit || 1} aria-label="Daily transfer limit remaining" />
      <p className="limit-note">Resets daily. Applies to all transfers.</p>
    </aside>
  )
}
