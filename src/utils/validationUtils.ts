import { z } from 'zod'
import { formatMoney } from '../lib/format'

export const ALLOWED_BANKS = ['DBS', 'OCBC', 'UOB', 'POSB'] as const

export const recipientSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name with at least 2 characters.').max(50, 'Use no more than 50 characters.'),
  accountNumber: z.string().regex(/^\d{8}$/, 'Enter a valid 8-digit account number.'),
  bank: z.enum(ALLOWED_BANKS, { error: 'Select a bank.' }),
})

export function amountSchema(balance: number, remaining: number) {
  return z.object({
    fromAccountId: z.string().min(1, 'Choose a deposit account.'),
    amount: z
      .string()
      .min(1, 'Enter an amount.')
      .regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount with at most 2 decimal places.')
      .refine((value) => Number(value) >= 1, 'Enter at least SGD 1.00.')
      .refine(
        (value) => Math.round(Number(value) * 100) <= Math.round(balance * 100),
        `Amount can't be more than your available balance (${formatMoney(balance)}).`,
      )
      .refine(
        (value) => Math.round(Number(value) * 100) <= Math.round(remaining * 100),
        `This transfer exceeds your remaining daily limit (${formatMoney(remaining)}).`,
      ),
    note: z.string().max(50, 'Use no more than 50 characters.'),
  })
}

export type RecipientValues = z.infer<typeof recipientSchema>
export type AmountValues = z.infer<ReturnType<typeof amountSchema>>
