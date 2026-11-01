// Every read and write the screens do goes through here. ARCHITECTURE rule:
// screens call domain/ for maths and data/repo.ts for reads and writes.

import { db } from './db'
import { splitGst } from '../domain/gst'
import { draftTotals, type Draft, type DraftLine } from '../domain/draft'
import type { Bill, BillItem, Customer, Service, Settings } from '../domain/types'

export interface LoadedData {
  settings?: Settings
  services: Service[]
  customers: Customer[]
  bills: Bill[]
  items: BillItem[]
}

/** Load everything once after unlock. The volume is a few years of bills, small enough for memory. */
export async function loadAll(): Promise<LoadedData> {
  const [settings, services, customers, bills, items] = await Promise.all([
    db.settings.orderBy('updated_at').reverse().first(),
    db.services.orderBy('sort_order').toArray(),
    db.customers.toArray(),
    db.bills.toArray(),
    db.billItems.toArray(),
  ])
  bills.sort((a, b) => b.billed_at - a.billed_at)
  return { settings, services, customers, bills, items }
}

export function itemsOf(items: BillItem[], billId: string): BillItem[] {
  return items.filter((i) => i.bill_id === billId)
}

export function billById(bills: Bill[], id: string): Bill | undefined {
  return bills.find((b) => b.id === id)
}

function defaultSettings(): Settings {
  return { id: 'settings', parlour_name: '', address: '', phone: '', gstin: '', next_bill_number: 1, updated_at: Date.now() }
}

function toItem(billId: string, line: DraftLine): BillItem {
  const lineTotal = line.unit_price * line.quantity
  const base = {
    id: crypto.randomUUID(),
    bill_id: billId,
    kind: line.kind,
    name: line.name,
    price_option: line.price_option,
    unit_price: line.unit_price,
    quantity: line.quantity,
    gst_rate: line.gst_rate,
    line_total: lineTotal,
  }
  if (line.kind === 'service' || !line.gst_rate) {
    return { ...base, taxable_value: 0, gst_amount: 0 }
  }
  const split = splitGst(line.unit_price, line.gst_rate)
  return { ...base, taxable_value: split.taxable * line.quantity, gst_amount: split.gst * line.quantity }
}

/**
 * Save a bill and its items in one transaction, take the next bill number and
 * remember the customer. Nothing is ever sent anywhere — it stays on the phone.
 * RULES A5 (numbers), A7 (customer by phone), B2.3 (amounts saved at save time).
 */
export async function saveNewBill(draft: Draft): Promise<number> {
  const now = Date.now()
  const totals = draftTotals(draft.lines, draft.discount)
  const billId = crypto.randomUUID()
  let number = 0

  await db.transaction('rw', db.bills, db.billItems, db.customers, db.settings, async () => {
    const settings = (await db.settings.orderBy('updated_at').reverse().first()) ?? defaultSettings()
    number = settings.next_bill_number ?? 1

    const bill: Bill = {
      id: billId,
      bill_number: number,
      billed_at: now,
      customer_name: draft.customer_name.trim(),
      customer_phone: draft.customer_phone,
      services_total: totals.services_total,
      products_total: totals.products_total,
      products_taxable: totals.products_taxable,
      cgst: totals.cgst,
      sgst: totals.sgst,
      discount: draft.discount,
      grand_total: totals.grand_total,
      payment_mode: draft.payment_mode as 'cash' | 'upi',
      status: 'active',
      created_at: now,
      updated_at: now,
    }

    const existing = await db.customers.where('phone').equals(draft.customer_phone).first()
    if (existing) {
      await db.customers.update(existing.id, {
        name: bill.customer_name,
        last_visit: now,
        visit_count: existing.visit_count + 1,
        updated_at: now,
      })
    } else {
      const customer: Customer = {
        id: crypto.randomUUID(),
        name: bill.customer_name,
        phone: draft.customer_phone,
        first_visit: now,
        last_visit: now,
        visit_count: 1,
        updated_at: now,
      }
      await db.customers.put(customer)
    }

    await db.bills.put(bill)
    await db.billItems.bulkPut(draft.lines.map((line) => toItem(billId, line)))
    await db.settings.put({ ...settings, next_bill_number: number + 1, updated_at: now })
  })

  return number
}

/** Cancel a bill. It keeps its number and is never deleted. RULES A6. */
export async function cancelBill(id: string, reason: string): Promise<void> {
  await db.bills.update(id, { status: 'cancelled', cancel_reason: reason, updated_at: Date.now() })
}

/** Save parlour details. */
export async function saveSettings(patch: Omit<Settings, 'id' | 'updated_at'>): Promise<void> {
  const current = (await db.settings.orderBy('updated_at').reverse().first()) ?? defaultSettings()
  await db.settings.put({ ...current, ...patch, updated_at: Date.now() })
}

/** Save the whole price list at once (add, edit, hide). RULES A2.2. */
export async function saveServices(services: Service[]): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.services, async () => {
    await db.services.bulkPut(services.map((s, i) => ({ ...s, sort_order: i, updated_at: now })))
  })
}

export async function findCustomerByPhone(phone: string): Promise<Customer | undefined> {
  return db.customers.where('phone').equals(phone).first()
}
