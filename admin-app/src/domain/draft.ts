// The bill she is typing, before it is saved. Pure maths so screens stay thin
// and the totals can be tested. RULES B1, B2, A2, A3, A4.

import { splitGst } from './gst'
import { grandTotal } from './totals'
import type { GstRate, ItemKind, PaymentMode } from './types'

export interface DraftLine {
  /** random key, only for the form */
  key: string
  kind: ItemKind
  name: string
  /** 1, 2 or 3 for services, undefined for products */
  price_option?: 1 | 2 | 3
  /** paise */
  unit_price: number
  quantity: number
  /** products only */
  gst_rate?: GstRate
}

export interface DraftTotals {
  services_total: number
  products_total: number
  grand_total: number
  products_taxable: number
  cgst: number
  sgst: number
}

export interface Draft {
  customer_name: string
  customer_phone: string
  lines: DraftLine[]
  /** flat rupees discount, paise */
  discount: number
  payment_mode: PaymentMode | ''
}

export function newLineKey(): string {
  return crypto.randomUUID()
}

/** Tap a service price pill. Tapping the same price again raises the quantity. */
export function addServiceLine(lines: DraftLine[], name: string, option: 1 | 2 | 3, price: number): DraftLine[] {
  const existing = lines.find((l) => l.kind === 'service' && l.name === name && l.price_option === option)
  if (existing) {
    return lines.map((l) => (l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l))
  }
  return [...lines, { key: newLineKey(), kind: 'service', name, price_option: option, unit_price: price, quantity: 1 }]
}

export function addProductLine(lines: DraftLine[]): DraftLine[] {
  return [...lines, { key: newLineKey(), kind: 'product', name: '', unit_price: 0, quantity: 1 }]
}

export function updateLine(lines: DraftLine[], key: string, patch: Partial<DraftLine>): DraftLine[] {
  return lines.map((l) => (l.key === key ? { ...l, ...patch } : l))
}

export function removeLine(lines: DraftLine[], key: string): DraftLine[] {
  return lines.filter((l) => l.key !== key)
}

export function lineTotal(line: DraftLine): number {
  return line.unit_price * line.quantity
}

/** Services total, products total, discount off the final total, product GST split. */
export function draftTotals(lines: DraftLine[], discount: number): DraftTotals {
  let services_total = 0
  let products_total = 0
  let products_taxable = 0
  let gstTotal = 0

  for (const line of lines) {
    const total = lineTotal(line)
    if (line.kind === 'service') {
      services_total += total
    } else {
      products_total += total
      if (line.gst_rate && line.unit_price > 0) {
        const split = splitGst(line.unit_price, line.gst_rate)
        products_taxable += split.taxable * line.quantity
        gstTotal += split.gst * line.quantity
      }
    }
  }

  const cgst = Math.floor(gstTotal / 2)
  return {
    services_total,
    products_total,
    grand_total: grandTotal(services_total, products_total, discount),
    products_taxable,
    cgst,
    sgst: gstTotal - cgst,
  }
}
