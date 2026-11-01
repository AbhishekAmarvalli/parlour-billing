// Reports are computed from active (not cancelled) bills only. RULES A8.

import type { Bill, BillItem } from './types'
import { endOfMonth, startOfMonth } from './dates'

export interface MonthReport {
  income: number
  customers: number
  billCount: number
  servicesTotal: number
  productsTotal: number
  cashTotal: number
  upiTotal: number
  /** Income for week 1, 2, 3 and 4+ of the month. */
  weeks: number[]
  popularServices: { name: string; count: number }[]
  gst: GstReport
}

export interface GstReport {
  /** Product sales, GST included. */
  sales: number
  taxable: number
  cgst: number
  sgst: number
  byRate: { rate: 5 | 12 | 18; taxable: number; gst: number }[]
}

export function activeBillsBetween(bills: Bill[], from: number, to: number): Bill[] {
  return bills.filter((b) => b.status === 'active' && b.billed_at >= from && b.billed_at <= to)
}

/** Build the report for the month containing `ts`. */
export function monthReport(bills: Bill[], items: BillItem[], ts: number): MonthReport {
  const from = startOfMonth(ts)
  const to = endOfMonth(ts)
  const monthBills = activeBillsBetween(bills, from, to)
  const ids = new Set(monthBills.map((b) => b.id))
  const monthItems = items.filter((i) => ids.has(i.bill_id))

  let income = 0
  let servicesTotal = 0
  let productsTotal = 0
  let cashTotal = 0
  let upiTotal = 0
  const weeks = [0, 0, 0, 0]
  const serviceCounts = new Map<string, number>()

  for (const bill of monthBills) {
    income += bill.grand_total
    servicesTotal += bill.services_total
    productsTotal += bill.products_total
    if (bill.payment_mode === 'cash') cashTotal += bill.grand_total
    else upiTotal += bill.grand_total
    const weekIndex = Math.min(3, Math.floor((new Date(bill.billed_at).getDate() - 1) / 7))
    weeks[weekIndex] += bill.grand_total
  }

  for (const item of monthItems) {
    if (item.kind === 'service') {
      serviceCounts.set(item.name, (serviceCounts.get(item.name) ?? 0) + item.quantity)
    }
  }

  const popularServices = [...serviceCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    income,
    customers: monthBills.length,
    billCount: monthBills.length,
    servicesTotal,
    productsTotal,
    cashTotal,
    upiTotal,
    weeks,
    popularServices,
    gst: gstReport(monthItems),
  }
}

/** GST collected on products in this set of items. Services carry no GST. */
export function gstReport(items: BillItem[]): GstReport {
  let sales = 0
  let taxable = 0
  const byRate = new Map<5 | 12 | 18, { taxable: number; gst: number }>()

  for (const item of items) {
    if (item.kind !== 'product' || !item.gst_rate) continue
    sales += item.line_total
    taxable += item.taxable_value
  }

  for (const rate of [5, 12, 18] as const) {
    const rateItems = items.filter((i) => i.kind === 'product' && i.gst_rate === rate)
    if (rateItems.length === 0) continue
    const t = rateItems.reduce((s, i) => s + i.taxable_value, 0)
    const g = rateItems.reduce((s, i) => s + i.gst_amount, 0)
    byRate.set(rate, { taxable: t, gst: g })
  }

  const cgstSgst = cgstSplit(items)
  return {
    sales,
    taxable,
    cgst: cgstSgst.cgst,
    sgst: cgstSgst.sgst,
    byRate: [...byRate.entries()].map(([rate, v]) => ({ rate, ...v })),
  }
}

function cgstSplit(items: BillItem[]): { cgst: number; sgst: number } {
  let cgst = 0
  let sgst = 0
  for (const item of items) {
    if (item.kind !== 'product' || !item.gst_rate) continue
    const half = Math.floor(item.gst_amount / 2)
    cgst += half
    sgst += item.gst_amount - half
  }
  return { cgst, sgst }
}
