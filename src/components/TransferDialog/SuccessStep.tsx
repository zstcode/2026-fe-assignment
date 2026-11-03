import type { Ref } from 'react'
import type { Transfer } from '../../api/types'
import { formatMoney } from '../../lib/format'
import { Icon } from '../Icon'

export function SuccessStep({ transfer, headingRef }: { transfer: Transfer; headingRef: Ref<HTMLHeadingElement> }) {
  return (
    <div className="success-panel" aria-live="polite" role="status">
      <div className="success-heading">
        <span className="success-icon">
          <Icon name="check" />
        </span>
        <h2 ref={headingRef} id="transfer-success-title" tabIndex={-1}>
          Transfer sent
        </h2>
      </div>
      <div className="success-details">
        <p className="success-amount amount">{formatMoney(transfer.amount)}</p>
        <p className="muted amount">
          to {transfer.recipient.name} · {transfer.recipient.bank} · {transfer.recipient.accountNumberMasked}
        </p>
      </div>
      <dl className="reference">
        <dt>Reference</dt>
        <dd>{transfer.reference}</dd>
      </dl>
      <p className="muted success-arrival">The money should arrive within minutes.</p>
    </div>
  )
}
