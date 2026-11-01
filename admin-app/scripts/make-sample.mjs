// Generates sample-backup.json at the repo root — a demo backup file in the exact
// format the owner's app exports, so the admin APK can be tried before the owner
// app exists. Run: node admin-app/scripts/make-sample.mjs
import { writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// Same split as admin-app/src/domain/gst.ts (RULES A3).
function splitGst(price, rate) {
  const taxable = Math.round((price * 100) / (100 + rate))
  const gst = price - taxable
  const cgst = Math.floor(gst / 2)
  return { taxable, gst, cgst, sgst: gst - cgst }
}

const services = [
  ['Haircut', [45000, 65000, 80000]],
  ['Threading', [3000, 4000, 5000]],
  ['Waxing', [15000, 25000, 40000]],
  ['Facial', [60000, 90000, 120000]],
  ['Manicure', [35000, 50000, 70000]],
  ['Pedicure', [40000, 55000, 75000]],
  ['Hair colour', [50000, 80000, 110000]],
  ['Hair spa', [70000, 95000, 130000]],
]

const productCatalog = [
  ['Hair serum', 45000, 18],
  ['Face pack', 30000, 12],
  ['Nail polish', 15000, 5],
  ['Shampoo 200ml', 25000, 18],
]

const customers = [
  ['Sample Customer 1', '9000000001'],
  ['Sample Customer 2', '9000000002'],
  ['Sample Customer 3', '9000000003'],
  ['Sample Customer 4', '9000000004'],
  ['Sample Customer 5', '9000000005'],
  ['Sample Customer 6', '9000000006'],
  ['Sample Customer 7', '9000000007'],
  ['Sample Customer 8', '9000000008'],
  ['Sample Customer 9', '9000000009'],
  ['Sample Customer 10', '9000000010'],
]

const now = Date.now()
let seed = 42
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)]

const settings = {
  id: randomUUID(),
  parlour_name: 'Sample Beauty Parlour',
  address: 'Sample Street, Sample Town',
  phone: '9000000000',
  gstin: '36AAAAA0000A1Z5',
  updated_at: now,
}

const serviceRows = services.map(([name, prices], i) => ({
  id: randomUUID(),
  name,
  price_1: prices[0],
  price_2: prices[1],
  price_3: prices[2],
  label_1: 'Basic',
  label_2: 'Standard',
  label_3: 'Premium',
  active: true,
  sort_order: i,
  updated_at: now,
}))

const customerRows = customers.map(([name, phone], i) => ({
  id: randomUUID(),
  name,
  phone,
  first_visit: now - (30 + i) * 86400000,
  last_visit: now - 86400000,
  visit_count: 3 + i,
  updated_at: now,
}))

const bills = []
const items = []
let billNumber = 0

for (let dayOffset = 45; dayOffset >= 0; dayOffset--) {
  const dayStart = now - dayOffset * 86400000
  const d = new Date(dayStart)
  const count = 6 + Math.floor(rand() * 12)

  for (let n = 0; n < count; n++) {
    let hour = 10 + Math.floor(rand() * 10)
    let minute = Math.floor(rand() * 60)
    const stamp = new Date(d)
    stamp.setHours(hour, minute, Math.floor(rand() * 60), 0)
    const billedAt = stamp.getTime()
    if (billedAt > now) continue

    const [customerName, customerPhone] = pick(customers)
    const billId = randomUUID()
    billNumber += 1

    const billItems = []
    const lineCount = 1 + Math.floor(rand() * 3)
    for (let l = 0; l < lineCount; l++) {
      const [name, prices] = pick(services)
      const option = 1 + Math.floor(rand() * 3)
      const unit = prices[option - 1]
      billItems.push({
        id: randomUUID(),
        bill_id: billId,
        kind: 'service',
        name,
        price_option: option,
        unit_price: unit,
        quantity: rand() < 0.15 ? 2 : 1,
        taxable_value: 0,
        gst_amount: 0,
        line_total: unit,
      })
    }

    if (rand() < 0.5) {
      const [name, price, rate] = pick(productCatalog)
      const { taxable, gst } = splitGst(price, rate)
      billItems.push({
        id: randomUUID(),
        bill_id: billId,
        kind: 'product',
        name,
        unit_price: price,
        quantity: 1,
        gst_rate: rate,
        taxable_value: taxable,
        gst_amount: gst,
        line_total: price,
      })
    }

    for (const item of billItems) {
      if (item.quantity > 1) item.line_total = item.unit_price * item.quantity
    }

    const servicesTotal = billItems.filter((i) => i.kind === 'service').reduce((s, i) => s + i.line_total, 0)
    const productsTotal = billItems.filter((i) => i.kind === 'product').reduce((s, i) => s + i.line_total, 0)
    const discount = rand() < 0.2 ? Math.min(10000, Math.floor(rand() * 3 + 1) * 5000) : 0
    const grand = servicesTotal + productsTotal - discount
    const productsTaxable = billItems.filter((i) => i.kind === 'product').reduce((s, i) => s + i.taxable_value, 0)
    const productsGst = billItems.filter((i) => i.kind === 'product').reduce((s, i) => s + i.gst_amount, 0)
    const cgst = Math.floor(productsGst / 2)

    const cancelled = rand() < 0.02

    bills.push({
      id: billId,
      bill_number: billNumber,
      billed_at: billedAt,
      customer_name: customerName,
      customer_phone: customerPhone,
      services_total: servicesTotal,
      products_total: productsTotal,
      products_taxable: productsTaxable,
      cgst,
      sgst: productsGst - cgst,
      discount,
      grand_total: grand,
      payment_mode: rand() < 0.55 ? 'cash' : 'upi',
      status: cancelled ? 'cancelled' : 'active',
      ...(cancelled ? { cancel_reason: 'Wrong bill, made again' } : {}),
      created_at: billedAt,
      updated_at: billedAt,
    })
    items.push(...billItems)
  }
}

const backup = {
  app: 'parlour-billing',
  version: 1,
  exported_at: now,
  settings,
  services: serviceRows,
  customers: customerRows,
  bills,
  bill_items: items,
}

const out = join(root, 'sample-backup.json')
writeFileSync(out, JSON.stringify(backup, null, 2))
console.log(`wrote ${out}: ${bills.length} bills, ${items.length} items, ${customers.length} customers`)
