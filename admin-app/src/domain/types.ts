// Shared types. Money is always whole paise (integers) — RULES B1.

export type PaymentMode = 'cash' | 'upi'
export type BillStatus = 'active' | 'cancelled'
export type ItemKind = 'service' | 'product'
export type GstRate = 5 | 12 | 18

export interface Settings {
  id: string
  parlour_name: string
  address: string
  phone: string
  gstin: string
  logo?: string
  /** Next bill number to use. Numbers run 0001, 0002 with no gaps. RULES A5. */
  next_bill_number?: number
  updated_at: number
}

export interface Service {
  id: string
  name: string
  price_1: number
  price_2: number
  price_3: number
  label_1?: string
  label_2?: string
  label_3?: string
  active: boolean
  sort_order: number
  updated_at: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  first_visit: number
  last_visit: number
  visit_count: number
  updated_at: number
}

export interface Bill {
  id: string
  bill_number: number
  billed_at: number
  customer_name: string
  customer_phone: string
  services_total: number
  products_total: number
  products_taxable: number
  cgst: number
  sgst: number
  discount: number
  grand_total: number
  payment_mode: PaymentMode
  status: BillStatus
  cancel_reason?: string
  created_at: number
  updated_at: number
}

export interface BillItem {
  id: string
  bill_id: string
  kind: ItemKind
  name: string
  price_option?: 1 | 2 | 3
  unit_price: number
  quantity: number
  gst_rate?: GstRate
  taxable_value: number
  gst_amount: number
  line_total: number
}
