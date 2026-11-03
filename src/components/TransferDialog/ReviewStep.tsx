import { ApiError } from '../../api/client'
import type { Account, TransferRecipient } from '../../api/types'
import { formatMoney } from '../../lib/format'
import type { AmountValues } from '../../utils/validationUtils'
import { Icon } from '../Icon'

export function ReviewStep({
  fromAccount,
  recipient,
  values,
  error,
}: {
  fromAccount?: Account
  recipient?: TransferRecipient
  values: Partial<AmountValues>
  error: Error | null
}) {
  return (
    <>
      <dl className="review-summary">
        <div>
          <dt>From</dt>
          <dd>
            {fromAccount?.name} · <span className="amount">{fromAccount?.maskedNumber}</span>
          </dd>
        </div>
        <div>
          <dt>To</dt>
          <dd>
            {recipient?.name} ·{' '}
            <span className="amount">
              {recipient?.bank} · {recipient?.accountNumberMasked}
            </span>
          </dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd className="amount">{formatMoney(Number(values.amount))}</dd>
        </div>
        <div>
          <dt>Fee</dt>
          <dd className="amount">{formatMoney(0)}</dd>
        </div>
        <div>
          <dt>Note</dt>
          <dd>{values.note}</dd>
        </div>
        <div className="review-total">
          <dt>Total</dt>
          <dd className="amount">{formatMoney(Number(values.amount))}</dd>
        </div>
      </dl>
      <p className="info-note">
        <Icon name="info" />
        Usually arrives in minutes.
      </p>
      {error && (
        <div className="error-banner" role="alert">
          <p>
            {error instanceof ApiError && error.status < 500
              ? error.message
              : "Something went wrong. Your money hasn't left your account. Try again."}
          </p>
          {error instanceof ApiError && error.fields && (
            <ul>
              {Object.entries(error.fields).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}
