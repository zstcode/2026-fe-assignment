import { useEffect, useRef } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { UseFormReturn } from 'react-hook-form'
import type { PayeesResponse } from '../../api/types'
import { ALLOWED_BANKS } from '../../utils/validationUtils'
import type { RecipientValues } from '../../utils/validationUtils'
import { Icon } from '../Icon'
import { FieldError } from './FieldError'

export function RecipientStep({
  payees,
  recipientForm,
  newRecipient,
  payeeId,
  payeeSearch,
  payeeError,
  onSearchChange,
  onPayeeSelect,
  onToggleNewRecipient,
}: {
  payees: UseQueryResult<PayeesResponse, Error>
  recipientForm: UseFormReturn<RecipientValues>
  newRecipient: boolean
  payeeId: string
  payeeSearch: string
  payeeError: string
  onSearchChange: (search: string) => void
  onPayeeSelect: (id: string) => void
  onToggleNewRecipient: () => void
}) {
  const recipientErrors = recipientForm.formState.errors
  const newRecipientFields = useRef<HTMLDivElement>(null)
  const visiblePayees =
    payees.data?.payees.filter((payee) =>
      `${payee.name} ${payee.bank}`.toLowerCase().includes(payeeSearch.trim().toLowerCase()),
    ) ?? []

  useEffect(() => {
    if (newRecipient) {
      newRecipientFields.current?.scrollIntoView?.({
        block: 'nearest',
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      })
    }
  }, [newRecipient])

  return (
    <>
      <div className="search-input">
        <Icon name="search" />
        <input
          aria-label="Search payees"
          type="search"
          placeholder="Search payees"
          value={payeeSearch}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="payee-list-region" aria-busy={payees.isPending}>
        {payees.isPending ? (
          <PayeeListSkeleton />
        ) : payees.isError ? (
          <div className="error-banner" role="alert">
            We couldn't load your payees.{' '}
            <button type="button" className="text-button" onClick={() => payees.refetch()}>
              Retry
            </button>
          </div>
        ) : (
          <fieldset className="payee-list" aria-describedby={payeeError ? 'payee-error' : undefined}>
            <legend className="visually-hidden">Saved payees</legend>
            {visiblePayees.map((payee) => (
              <label className="payee-option" key={payee.id}>
                <input
                  type="radio"
                  name="payee"
                  value={payee.id}
                  checked={!newRecipient && payeeId === payee.id}
                  aria-describedby={payeeError ? 'payee-error' : undefined}
                  onChange={() => onPayeeSelect(payee.id)}
                  onKeyUp={(event) => {
                    if (event.key === 'Tab') onPayeeSelect(payee.id)
                  }}
                />
                <span className="avatar">{payee.initials}</span>
                <span className="payee-details">
                  <strong>{payee.name}</strong>
                  <span className="amount">
                    {payee.bank} · {payee.accountNumberMasked}
                  </span>
                </span>
                <Icon name="arrow" />
              </label>
            ))}
            {!visiblePayees.length && (
              <p className="muted">
                {payeeSearch ? 'No payees match your search.' : 'No saved payees. Send to someone new below.'}
              </p>
            )}
          </fieldset>
        )}
      </div>
      <FieldError id="payee-error" message={payeeError} />
      <button
        className="new-recipient-button"
        type="button"
        aria-expanded={newRecipient}
        aria-controls="new-recipient-fields"
        onClick={onToggleNewRecipient}
      >
        <Icon name="plus" />
        Send to someone new
        <Icon name="arrow" />
      </button>
      {newRecipient && (
        <div ref={newRecipientFields} id="new-recipient-fields" className="form-fields">
          <div className="field">
            <label htmlFor="recipient-name">Recipient name</label>
            <input
              id="recipient-name"
              autoComplete="off"
              {...recipientForm.register('name')}
              aria-invalid={!!recipientErrors.name}
              aria-describedby={recipientErrors.name ? 'recipient-name-error' : undefined}
            />
            <FieldError id="recipient-name-error" message={recipientErrors.name?.message} />
          </div>
          <div className="field">
            <label htmlFor="recipient-account">Account number (8 digits)</label>
            <input
              id="recipient-account"
              className="amount"
              inputMode="numeric"
              autoComplete="off"
              {...recipientForm.register('accountNumber')}
              aria-invalid={!!recipientErrors.accountNumber}
              aria-describedby={recipientErrors.accountNumber ? 'recipient-account-error' : undefined}
            />
            <FieldError id="recipient-account-error" message={recipientErrors.accountNumber?.message} />
          </div>
          <div className="field">
            <label htmlFor="recipient-bank">Bank</label>
            <select
              id="recipient-bank"
              {...recipientForm.register('bank')}
              aria-invalid={!!recipientErrors.bank}
              aria-describedby={recipientErrors.bank ? 'recipient-bank-error' : undefined}
            >
              <option value="">Select a bank</option>
              {ALLOWED_BANKS.map((bank) => (
                <option key={bank}>{bank}</option>
              ))}
            </select>
            <FieldError id="recipient-bank-error" message={recipientErrors.bank?.message} />
          </div>
        </div>
      )}
    </>
  )
}

function PayeeListSkeleton() {
  return (
    <div role="status" aria-label="Loading payees">
      <span className="visually-hidden">Loading payees…</span>
      {[0, 1, 2, 3].map((index) => (
        <div className="payee-skeleton-row" key={index} aria-hidden="true">
          <span className="skeleton payee-skeleton-avatar" />
          <span className="payee-skeleton-details">
            <span className="skeleton payee-skeleton-name" />
            <span className="skeleton payee-skeleton-account" />
          </span>
        </div>
      ))}
    </div>
  )
}
