// Excel export: Bills, Items, GST summary (PRD F12). Money leaves the phone in
// rupees; the accountant needs plain numbers.

import * as XLSX from 'xlsx'
import type { Bill, BillItem } from '../../domain/types'
import { formatBillNumber } from '../../domain/numbering'
import { endOfMonth, monthLabel, startOfMonth, timeLabel } from '../../domain/dates'

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function money(paise: number): number {
  return Math.round(paise) / 100
}

function monthBills(bills: Bill[], ts: number): Bill[] {
  const from = startOfMonth(ts)
  const to = endOfMonth(ts)
  return bills.filter((b) => b.status === 'active' && b.billed_at >= from && b.billed_at <= to)
}

/** Build the .xlsx file for the month. Returns the bytes and a file name. */
export function buildExcel(allBills: Bill[], allItems: BillItem[], ts: number): { name: string; bytes: Uint8Array } {
  const bills = monthBills(allBills, ts)
  const ids = new Set(bills.map((b) => b.id))
  const items = allItems.filter((i) => ids.has(i.bill_id))
  const byId = new Map(bills.map((b) => [b.id, b]))

  const billRows: (string | number)[][] = [
    ['Bill No', 'Date', 'Time', 'Customer', 'Phone', 'Services', 'Products', 'Discount', 'Total', 'Paid by'],
    ...bills.map((b) => [
      formatBillNumber(b.bill_number),
      dateFmt.format(b.billed_at),
      timeLabel(b.billed_at),
      b.customer_name,
      b.customer_phone,
      money(b.services_total),
      money(b.products_total),
      money(b.discount),
      money(b.grand_total),
      b.payment_mode === 'cash' ? 'Cash' : 'UPI',
    ]),
  ]

  const itemRows: (string | number)[][] = [
    ['Bill No', 'Date', 'Customer', 'Item', 'Kind', 'Price option', 'Unit price', 'Qty', 'GST rate %', 'Taxable value', 'GST amount', 'Line total'],
    ...items.map((i) => {
      const bill = byId.get(i.bill_id)
      return [
        bill ? formatBillNumber(bill.bill_number) : '',
        bill ? dateFmt.format(bill.billed_at) : '',
        bill ? bill.customer_name : '',
        i.name,
        i.kind === 'service' ? 'Service' : 'Product',
        i.price_option ?? '',
        money(i.unit_price),
        i.quantity,
        i.gst_rate ?? '',
        money(i.taxable_value),
        money(i.gst_amount),
        money(i.line_total),
      ]
    }),
  ]

  const rates = [5, 12, 18] as const
  const gstRows: (string | number)[][] = [['GST rate %', 'Taxable value', 'CGST', 'SGST', 'Total GST']]
  let totalTaxable = 0
  let totalGst = 0
  for (const rate of rates) {
    const rateItems = items.filter((i) => i.kind === 'product' && i.gst_rate === rate)
    if (rateItems.length === 0) continue
    const taxable = rateItems.reduce((s, i) => s + i.taxable_value, 0)
    const gst = rateItems.reduce((s, i) => s + i.gst_amount, 0)
    totalTaxable += taxable
    totalGst += gst
    gstRows.push([rate, money(taxable), money(Math.floor(gst / 2)), money(gst - Math.floor(gst / 2)), money(gst)])
  }
  gstRows.push(['Total', money(totalTaxable), money(Math.floor(totalGst / 2)), money(totalGst - Math.floor(totalGst / 2)), money(totalGst)])
  gstRows.push([])
  gstRows.push([`Note: Services have no GST. ${monthLabel(ts)} — ${bills.length} bills.`])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(billRows), 'Bills')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(itemRows), 'Items')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gstRows), 'GST summary')

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  const label = monthLabel(ts).replace(/\s+/g, '-')
  return { name: `Parlour-Bills-${label}.xlsx`, bytes: new Uint8Array(out) }
}

