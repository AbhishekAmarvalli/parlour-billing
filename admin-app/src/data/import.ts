// Import the owner's backup file. Uploading the same file twice keeps one copy,
// because every row is keyed by its UUID and we put() by id. RULES B2.1, B2.2.

import { z } from 'zod'
import { db } from './db'
import type { Bill, BillItem, Customer, Service, Settings } from '../domain/types'

const money = z.number().int().nonnegative()
const paise = z.number().int()
const phone = z.string().regex(/^\d{10}$/, 'Phone must be 10 digits')

const settingsSchema = z.object({
  id: z.string(),
  parlour_name: z.string(),
  address: z.string(),
  phone: z.string(),
  gstin: z.string(),
  logo: z.string().optional(),
  updated_at: z.number(),
})

const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  price_1: money,
  price_2: money,
  price_3: money,
  label_1: z.string().optional(),
  label_2: z.string().optional(),
  label_3: z.string().optional(),
  active: z.boolean(),
  sort_order: z.number(),
  updated_at: z.number(),
})

const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone,
  first_visit: z.number(),
  last_visit: z.number(),
  visit_count: z.number().int(),
  updated_at: z.number(),
})

const billSchema = z.object({
  id: z.string(),
  bill_number: z.number().int().positive(),
  billed_at: z.number(),
  customer_name: z.string(),
  customer_phone: phone,
  services_total: money,
  products_total: money,
  products_taxable: money,
  cgst: money,
  sgst: money,
  discount: money,
  grand_total: money,
  payment_mode: z.enum(['cash', 'upi']),
  status: z.enum(['active', 'cancelled']),
  cancel_reason: z.string().optional(),
  created_at: z.number(),
  updated_at: z.number(),
})

const billItemSchema = z.object({
  id: z.string(),
  bill_id: z.string(),
  kind: z.enum(['service', 'product']),
  name: z.string(),
  price_option: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  unit_price: money,
  quantity: z.number().int().positive(),
  gst_rate: z.union([z.literal(5), z.literal(12), z.literal(18)]).optional(),
  taxable_value: paise,
  gst_amount: paise,
  line_total: money,
})

export const backupSchema = z.object({
  app: z.literal('parlour-billing'),
  version: z.literal(1),
  exported_at: z.number(),
  settings: settingsSchema.optional(),
  services: z.array(serviceSchema).default([]),
  customers: z.array(customerSchema).default([]),
  bills: z.array(billSchema).default([]),
  bill_items: z.array(billItemSchema).default([]),
})

export type Backup = z.infer<typeof backupSchema>

export interface ImportResult {
  ok: boolean
  error?: string
  counts?: { bills: number; customers: number; services: number; items: number }
}

const LAST_IMPORT_KEY = 'parlour-admin.lastImportAt'

export function lastImportAt(): number | null {
  const v = localStorage.getItem(LAST_IMPORT_KEY)
  return v ? Number(v) : null
}

export function markImported(): void {
  localStorage.setItem(LAST_IMPORT_KEY, String(Date.now()))
}

/** Validate a backup file's text and merge it into the phone database. */
export async function importBackup(text: string): Promise<ImportResult> {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not a backup file' }
  }

  const parsed = backupSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first ? `${first.path.join('.')} is wrong in this file` : 'This file is not a backup file' }
  }

  const backup = parsed.data
  const billIds = new Set(backup.bills.map((b) => b.id))
  const items = backup.bill_items.filter((i) => billIds.has(i.bill_id))

  await db.transaction('rw', db.settings, db.services, db.customers, db.bills, db.billItems, async () => {
    if (backup.settings) await db.settings.put(backup.settings as Settings)
    if (backup.services.length) await db.services.bulkPut(backup.services as Service[])
    if (backup.customers.length) await db.customers.bulkPut(backup.customers as Customer[])
    if (backup.bills.length) await db.bills.bulkPut(backup.bills as Bill[])
    if (items.length) await db.billItems.bulkPut(items as BillItem[])
  })

  markImported()
  return {
    ok: true,
    counts: {
      bills: backup.bills.length,
      customers: backup.customers.length,
      services: backup.services.length,
      items: items.length,
    },
  }
}
