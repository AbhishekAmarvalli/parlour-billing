// "Backup now" (PRD F13): a full copy of everything on the phone, in the same
// JSON format the restore step reads. Same UUIDs in, same UUIDs out.

import { db } from './db'

export async function buildBackup(): Promise<string> {
  const [settings, services, customers, bills, bill_items] = await Promise.all([
    db.settings.toArray(),
    db.services.toArray(),
    db.customers.toArray(),
    db.bills.toArray(),
    db.billItems.toArray(),
  ])

  return JSON.stringify(
    {
      app: 'parlour-billing',
      version: 1,
      exported_at: Date.now(),
      settings: settings[0],
      services,
      customers,
      bills,
      bill_items,
    },
    null,
    2,
  )
}
