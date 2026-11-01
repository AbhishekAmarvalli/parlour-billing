// Every form is checked with Zod before saving. RULES B6.2, A1.

import { z } from 'zod'
import { draftTotals, type Draft } from './draft'

export const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'Type a 10 digit phone number')

export const nameSchema = z.string().trim().min(1, 'Type the customer name')

export const gstRateSchema = z.union([z.literal(5), z.literal(12), z.literal(18)])

export const draftLineSchema = z
  .object({
    kind: z.enum(['service', 'product']),
    name: z.string(),
    price_option: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    unit_price: z.number().int().nonnegative(),
    quantity: z.number().int().positive(),
    gst_rate: gstRateSchema.optional(),
  })
  .superRefine((line, ctx) => {
    if (line.kind === 'product') {
      if (line.name.trim() === '') ctx.addIssue({ code: 'custom', message: 'Type the product name' })
      if (line.unit_price <= 0) ctx.addIssue({ code: 'custom', message: 'Type the price' })
      if (!line.gst_rate) ctx.addIssue({ code: 'custom', message: 'Choose the GST rate' })
    }
  })

/** The whole form, checked at once. Returns plain sentences for the screen. */
export function checkDraft(draft: Draft): string[] {
  const errors: string[] = []

  const name = nameSchema.safeParse(draft.customer_name)
  if (!name.success) errors.push('Type the customer name')

  const phone = phoneSchema.safeParse(draft.customer_phone)
  if (!phone.success) errors.push('Type a 10 digit phone number')

  if (draft.lines.length === 0) {
    errors.push('Add at least one service or product')
  }

  for (const line of draft.lines) {
    const result = draftLineSchema.safeParse(line)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const message = issue.message
        if (!errors.includes(message)) errors.push(line.kind === 'product' ? message : `${line.name || 'Service'}: ${message}`)
      }
    }
  }

  if (draft.discount < 0) {
    errors.push('Discount cannot be less than zero')
  }

  const totals = draftTotals(draft.lines, 0)
  if (draft.discount > totals.services_total + totals.products_total) {
    errors.push('Discount cannot be more than the bill')
  }

  if (draft.payment_mode !== 'cash' && draft.payment_mode !== 'upi') {
    errors.push('Choose Cash or UPI')
  }

  return errors
}

export const settingsSchema = z.object({
  parlour_name: z.string().trim().min(1, 'Type the parlour name'),
  address: z.string(),
  phone: z.string(),
  gstin: z.string(),
})

export const serviceFormSchema = z.object({
  name: z.string().trim().min(1, 'Type the service name'),
  price_1: z.number().int().nonnegative(),
  price_2: z.number().int().nonnegative(),
  price_3: z.number().int().nonnegative(),
})
