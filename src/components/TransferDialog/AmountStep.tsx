import type { UseFormReturn } from 'react-hook-form'
import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'
import type { AmountValues } from '../../utils/validationUtils'
import { Icon } from '../Icon'
import { FieldError } from './FieldError'

export function AmountStep({
  amountForm,
  deposits,
  fromAccount,
  remaining,
  noteLength,
  onClearErrors,
}: {
  amountForm: UseFormReturn<AmountValues>
  deposits: Account[]
  fromAccount?: Account
  remaining: number
  noteLength: number
  onClearErrors: () => void
}) {
  const amountErrors = amountForm.formState.errors

  return (
    <div className="form-fields">
      <div className="field">
        <label htmlFor="from-account">From account</label>
        <div className="select-input">
          <select
            id="from-account"
            className="amount"
            {...amountForm.register('fromAccountId')}
            aria-invalid={!!amountErrors.fromAccountId}
            aria-describedby={amountErrors.fromAccountId ? 'account-hint account-error' : 'account-hint'}
          >
            {deposits.map((account) => (
              <option value={account.id} key={account.id}>
                {account.name} · {account.maskedNumber}
              </option>
            ))}
          </select>
          <Icon name="chevron" />
        </div>
        <p id="account-hint" className="field-hint">
          Deposit accounts only
        </p>
        <FieldError id="account-error" message={amountErrors.fromAccountId?.message} />
      </div>
      <div className="field">
        <label htmlFor="amount">Amount</label>
        <div className="amount-input">
          <span>SGD</span>
          <input
            id="amount"
            inputMode="decimal"
            placeholder="0.00"
            autoComplete="off"
            {...amountForm.register('amount')}
            aria-invalid={!!amountErrors.amount}
            aria-describedby={amountErrors.amount ? 'amount-error amount-hint' : 'amount-hint'}
          />
        </div>
        <FieldError id="amount-error" message={amountErrors.amount?.message} />
        <div className="quick-amounts">
          {[50, 100, 250, 500].map((amount) => (
            <button
              className="button secondary amount"
              type="button"
              key={amount}
              onClick={() => {
                amountForm.setValue('amount', amount.toFixed(2), { shouldDirty: true })
                onClearErrors()
              }}
            >
              {amount}
            </button>
          ))}
        </div>
        <div id="amount-hint" className="field-hint">
          <p>
            Available <span className="amount">{formatMoney(fromAccount?.balance ?? 0)}</span>
          </p>
          <p>
            Remaining daily limit <span className="amount">{formatMoney(remaining)}</span>
          </p>
        </div>
      </div>
      <div className="field">
        <div className="field-label-row">
          <label htmlFor="note">Note (optional)</label>
          <span className="field-hint">{noteLength}/50</span>
        </div>
        <input
          id="note"
          {...amountForm.register('note')}
          aria-invalid={!!amountErrors.note}
          aria-describedby={amountErrors.note ? 'note-error' : undefined}
        />
        <FieldError id="note-error" message={amountErrors.note?.message} />
      </div>
    </div>
  )
}
