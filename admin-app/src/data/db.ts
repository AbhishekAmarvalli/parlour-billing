import Dexie, { type Table } from 'dexie'
import type { Bill, BillItem, Customer, Service, Settings } from '../domain/types'

/**
 * The phone database. Same tables as the owner's app, so a backup file drops in.
 * Rows are never deleted — cancelled bills stay with status 'cancelled'. RULES B2.2.
 */
export class ParlourDB extends Dexie {
  settings!: Table<Settings, string>
  services!: Table<Service, string>
  customers!: Table<Customer, string>
  bills!: Table<Bill, string>
  billItems!: Table<BillItem, string>

  constructor() {
    super('parlour-admin')
    this.version(1).stores({
      settings: 'id, updated_at',
      services: 'id, active, sort_order',
      customers: 'id, phone, updated_at',
      bills: 'id, bill_number, billed_at, status, customer_phone, updated_at',
      billItems: 'id, bill_id, kind',
    })
  }
}

export const db = new ParlourDB()
