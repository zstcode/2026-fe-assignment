import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ApiError, apiFetch } from '../../api/client'
import type { Account, CreateTransferRequest, PayeesResponse, TransferResponse } from '../../api/types'
import { amountSchema, recipientSchema } from '../../utils/validationUtils'
import type { AmountValues, RecipientValues } from '../../utils/validationUtils'
import { useDebugSettings } from '../../lib/debug-settings'
import { Icon } from '../Icon'
import { RecipientStep } from './RecipientStep'
import { AmountStep } from './AmountStep'
import { ReviewStep } from './ReviewStep'
import { SuccessStep } from './SuccessStep'

export function TransferDialog({
  accounts,
  remaining,
  canMakeAnotherTransfer,
  onClose,
}: {
  accounts: Account[]
  remaining: number
  canMakeAnotherTransfer: boolean
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const sending = useRef(false)
  const [step, setStep] = useState(1)
  const [newRecipient, setNewRecipient] = useState(false)
  const [payeeId, setPayeeId] = useState('')
  const [payeeSearch, setPayeeSearch] = useState('')
  const [payeeError, setPayeeError] = useState('')
  const { bypassValidation } = useDebugSettings()
  const queryClient = useQueryClient()
  const deposits = accounts.filter((account) => account.type !== 'credit')
  const payees = useQuery({
    queryKey: ['payees'],
    queryFn: ({ signal }) => apiFetch<PayeesResponse>('/api/payees', { signal }),
    retry: false,
  })
  const recipientForm = useForm<RecipientValues>({
    resolver: (values, context, options) =>
      bypassValidation ? { values, errors: {} } : zodResolver(recipientSchema)(values, context, options),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: { name: '', accountNumber: '' },
  })
  // The resolver reads the selected account at validation time, so switching
  // accounts always uses the current balance without duplicating the rules.
  const amountForm = useForm<AmountValues>({
    resolver: (values, context, options) =>
      bypassValidation
        ? { values, errors: {} }
        : zodResolver(
            amountSchema(deposits.find((account) => account.id === values.fromAccountId)?.balance ?? 0, remaining),
          )(values, context, options),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: { fromAccountId: deposits[0]?.id ?? '', amount: '', note: '' },
  })
  const amountFormValues = useWatch({ control: amountForm.control })
  const fromAccount = deposits.find((account) => account.id === amountFormValues.fromAccountId)
  const selectedPayee = payees.data?.payees.find((payee) => payee.id === payeeId)
  const recipient = newRecipient
    ? {
        name: recipientForm.getValues('name').trim(),
        bank: recipientForm.getValues('bank'),
        accountNumberMasked: `•••• ${recipientForm.getValues('accountNumber').slice(-4)}`,
      }
    : selectedPayee
  const mutation = useMutation({
    mutationFn: (body: CreateTransferRequest) =>
      apiFetch<TransferResponse>('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setStep(4)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fields) {
        for (const [key, message] of Object.entries(error.fields)) {
          if (key === 'amount' || key === 'note' || key === 'fromAccountId') amountForm.setError(key, { message })
          if (key === 'recipient.name') recipientForm.setError('name', { message })
          if (key === 'recipient.accountNumber') recipientForm.setError('accountNumber', { message })
          if (key === 'recipient.bank') recipientForm.setError('bank', { message })
          if (key === 'payeeId') setPayeeError(message)
        }
      }
    },
    onSettled: () => {
      sending.current = false
    },
  })

  const blockEscapeWhileSending = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && sending.current) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    element?.showModal()
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', blockEscapeWhileSending, true)
    return () => {
      document.removeEventListener('keydown', blockEscapeWhileSending, true)
      element?.close()
      document.body.style.overflow = previousOverflow
      opener?.focus()
    }
  }, [])

  useEffect(() => {
    heading.current?.focus()
  }, [step])

  function clearErrors() {
    recipientForm.clearErrors()
    amountForm.clearErrors()
    setPayeeError('')
    if (mutation.isError) mutation.reset()
  }

  function continueRecipient() {
    if (bypassValidation) {
      setPayeeError('')
      setStep(2)
    } else if (newRecipient) {
      recipientForm.handleSubmit(() => setStep(2))()
    } else if (selectedPayee) {
      setPayeeError('')
      setStep(2)
    } else {
      setPayeeError('Choose a recipient or send to someone new.')
      dialog.current?.querySelector<HTMLInputElement>('input[name="payee"]')?.focus()
    }
  }

  function startAnotherTransfer(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    recipientForm.reset()
    amountForm.reset({ fromAccountId: deposits[0]?.id ?? '', amount: '', note: '' })
    setNewRecipient(false)
    setPayeeId('')
    setPayeeSearch('')
    setPayeeError('')
    mutation.reset()
    setStep(1)
  }

  function confirmTransfer() {
    if (sending.current || mutation.isPending) return
    const fields = amountForm.getValues()
    const body: CreateTransferRequest = {
      fromAccountId: fields.fromAccountId,
      amount: Number(fields.amount),
      note: fields.note.trim() || undefined,
      ...(newRecipient
        ? { recipient: bypassValidation ? recipientForm.getValues() : recipientSchema.parse(recipientForm.getValues()) }
        : { payeeId }),
    }
    sending.current = true
    mutation.mutate(body)
  }

  function requestClose() {
    if (sending.current || mutation.isPending) {
      return
    }
    onClose()
  }

  return (
    <dialog
      ref={dialog}
      className="transfer-dialog"
      aria-labelledby={step === 4 ? 'transfer-success-title' : 'transfer-title'}
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
    >
      <div className="dialog-layout">
        {step < 4 && (
          <header className="dialog-header">
            <div className="dialog-title-row">
              <h2 id="transfer-title">New transfer</h2>
              <button
                className="icon-button"
                aria-label="Close transfer"
                disabled={mutation.isPending}
                onClick={requestClose}
              >
                <Icon name="close" />
              </button>
            </div>
            <ol className="stepper" aria-label="Transfer progress">
              {['Recipient', 'Amount', 'Review'].map((label, index) => (
                <li
                  key={label}
                  aria-current={step === index + 1 ? 'step' : undefined}
                  className={step > index + 1 ? 'complete' : ''}
                >
                  <span className="step-number">{step > index + 1 ? <Icon name="check" /> : index + 1}</span>
                  {label}
                </li>
              ))}
            </ol>
          </header>
        )}
        <form
          className="transfer-form"
          noValidate
          onChange={clearErrors}
          onSubmit={(event) => {
            event.preventDefault()
            if (step === 1) {
              continueRecipient()
            }
            if (step === 2) {
              amountForm.handleSubmit(() => {
                mutation.reset()
                setStep(3)
              })()
            }
            if (step === 3) {
              confirmTransfer()
            }
          }}
        >
          <div className={step === 4 ? 'dialog-body success-body' : 'dialog-body'}>
            {step < 4 && bypassValidation && (
              <p className="debug-validation-notice" role="status">
                Debug: form validation bypassed. API validation is active.
              </p>
            )}
            {step < 4 && (
              <h3 ref={heading} tabIndex={-1} className="step-title">
                {step === 1 ? 'Who are you sending to?' : step === 2 ? 'How much?' : 'Check the details'}
              </h3>
            )}
            {step === 1 && (
              <RecipientStep
                payees={payees}
                recipientForm={recipientForm}
                newRecipient={newRecipient}
                payeeId={payeeId}
                payeeSearch={payeeSearch}
                payeeError={payeeError}
                onSearchChange={setPayeeSearch}
                onPayeeSelect={(id) => {
                  setPayeeId(id)
                  setNewRecipient(false)
                  setPayeeError('')
                }}
                onToggleNewRecipient={() => {
                  setNewRecipient(!newRecipient)
                  clearErrors()
                }}
              />
            )}
            {step === 2 && (
              <AmountStep
                amountForm={amountForm}
                deposits={deposits}
                fromAccount={fromAccount}
                remaining={remaining}
                noteLength={amountFormValues.note?.length ?? 0}
                onClearErrors={clearErrors}
              />
            )}
            {step === 3 && (
              <ReviewStep
                fromAccount={fromAccount}
                recipient={recipient}
                values={amountFormValues}
                error={mutation.isError ? mutation.error : null}
              />
            )}
            {step === 4 && mutation.data && <SuccessStep transfer={mutation.data.transfer} headingRef={heading} />}
          </div>
          <footer className={step === 4 ? 'dialog-footer success-footer' : 'dialog-footer'}>
            {step < 4 ? (
              <>
                <button
                  type="button"
                  className="button secondary"
                  disabled={mutation.isPending}
                  onClick={() => (step === 1 ? requestClose() : setStep(step - 1))}
                >
                  {step > 1 && <Icon name="back" />}
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>
                <button className="button primary" type="submit" disabled={mutation.isPending}>
                  {step === 3 ? (mutation.isPending ? 'Sending…' : 'Confirm transfer') : 'Continue'}
                  {step < 3 && <Icon name="arrow" />}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="button primary full-width" onClick={requestClose}>
                  Back to dashboard
                </button>
                {canMakeAnotherTransfer && (
                  <button type="button" className="button secondary full-width" onClick={startAnotherTransfer}>
                    Make another transfer
                  </button>
                )}
              </>
            )}
          </footer>
        </form>
      </div>
    </dialog>
  )
}
