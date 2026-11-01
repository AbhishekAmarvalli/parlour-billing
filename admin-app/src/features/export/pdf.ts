// PDF export: one month summary page plus the bill list (PRD F12).
// The standard PDF fonts have no ₹ sign, so money is written as "Rs 1,74,000".

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Bill, BillItem } from '../../domain/types'
import { formatBillNumber } from '../../domain/numbering'
import { dayLabel, endOfMonth, monthLabel, startOfMonth, timeLabel } from '../../domain/dates'
import { rupeesNumber } from '../../domain/money'
import { monthReport } from '../../domain/reports'

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function rs(paise: number): string {
  return `Rs ${rupeesNumber(paise)}`
}

export function buildPdf(allBills: Bill[], allItems: BillItem[], ts: number, parlourName: string): { name: string; bytes: Uint8Array } {
  const from = startOfMonth(ts)
  const to = endOfMonth(ts)
  const report = monthReport(allBills, allItems, ts)
  const bills = allBills
    .filter((b) => b.status === 'active' && b.billed_at >= from && b.billed_at <= to)
    .sort((a, b) => a.billed_at - b.billed_at)

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const left = 48
  let y = 56

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(parlourName || 'Parlour', left, y)
  y += 20

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(90)
  doc.text(`Report — ${monthLabel(ts)}`, left, y)
  y += 14
  doc.text(`Generated ${dayLabel(Date.now())}`, left, y)
  y += 24

  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Summary', left, y)
  y += 18

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const lines: [string, string][] = [
    ['Month income', rs(report.income)],
    ['Customers', String(report.customers)],
    ['Services', rs(report.servicesTotal)],
    ['Products', rs(report.productsTotal)],
    ['Cash', rs(report.cashTotal)],
    ['UPI', rs(report.upiTotal)],
    ['Product sales (with GST)', rs(report.gst.sales)],
    ['GST collected', rs(report.gst.cgst + report.gst.sgst)],
  ]
  for (const [label, value] of lines) {
    doc.text(label, left, y)
    doc.text(value, pageW - 48, y, { align: 'right' })
    y += 16
  }

  y += 10
  autoTable(doc, {
    startY: y,
    margin: { left, right: 48 },
    head: [['Bill', 'Date', 'Customer', 'Items', 'Total', 'Paid by']],
    body: bills.map((b) => [
      formatBillNumber(b.bill_number),
      `${dateFmt.format(b.billed_at)} ${timeLabel(b.billed_at)}`,
      b.customer_name,
      itemNames(allItems, b.id),
      rs(b.grand_total),
      b.payment_mode === 'cash' ? 'Cash' : 'UPI',
    ]),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [74, 29, 61], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 247, 244] },
    columnStyles: { 4: { halign: 'right' } },
  })

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(130)
    doc.text('Services have no GST, so they are not counted in the GST figures.', left, doc.internal.pageSize.getHeight() - 28)
    doc.text(`Page ${p} of ${pages}`, pageW - 48, doc.internal.pageSize.getHeight() - 28, { align: 'right' })
  }

  const label = monthLabel(ts).replace(/\s+/g, '-')
  return { name: `Parlour-Report-${label}.pdf`, bytes: new Uint8Array(doc.output('arraybuffer')) }
}

function itemNames(items: BillItem[], billId: string): string {
  const names = items.filter((i) => i.bill_id === billId).map((i) => i.name)
  const joined = names.join(', ')
  return joined.length > 40 ? `${joined.slice(0, 37)}…` : joined
}
