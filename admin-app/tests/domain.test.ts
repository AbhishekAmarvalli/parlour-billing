// Unit tests for the money maths. RULES B6.3: GST split, totals, discount limits,
// bill numbering, cancel behaviour.

import { describe, expect, it } from 'vitest'
import { splitGst } from '../src/domain/gst'
import { addProductLine, addServiceLine, draftTotals, removeLine, updateLine } from '../src/domain/draft'
import { checkDraft, phoneSchema } from '../src/domain/validation'
import { normalizePhone, phoneFromText } from '../src/domain/phone'
import type { Draft } from '../src/domain/draft'
import { computeTotals, grandTotal, totalOfLines } from '../src/domain/totals'
import { formatBillNumber, nextBillNumber } from '../src/domain/numbering'
import { formatRupees, parseRupees, toPaise } from '../src/domain/money'
import { monthReport } from '../src/domain/reports'
import { sha256Hex } from '../src/features/pin/sha256'
import type { Bill, BillItem } from '../src/domain/types'

describe('GST split (RULES A3)', () => {
  it('splits ₹450 at 18% exactly as the worked example', () => {
    const split = splitGst(45000, 18)
    expect(split.taxable).toBe(38136) // 381.36
    expect(split.gst).toBe(6864) // 68.64
    expect(split.cgst).toBe(3432) // 34.32
    expect(split.sgst).toBe(3432) // 34.32
  })

  it('keeps taxable + gst equal to the typed price at every rate', () => {
    for (const rate of [5, 12, 18] as const) {
      for (const price of [10000, 45000, 9999, 12345]) {
        const split = splitGst(price, rate)
        expect(split.taxable + split.gst).toBe(price)
        expect(split.cgst + split.sgst).toBe(split.gst)
      }
    }
  })

  it('splits an odd gst amount without losing a paise', () => {
    const split = splitGst(45001, 18)
    expect(split.cgst + split.sgst).toBe(split.gst)
    expect(split.cgst).toBe(Math.floor(split.gst / 2))
  })
})

describe('totals and discount (RULES A4)', () => {
  const lines = [
    { kind: 'service' as const, unit_price: 45000, quantity: 2 },
    { kind: 'product' as const, unit_price: 19900, quantity: 1 },
  ]

  it('adds services and products separately', () => {
    const { services_total, products_total } = totalOfLines(lines)
    expect(services_total).toBe(90000)
    expect(products_total).toBe(19900)
  })

  it('takes the discount off the final total only', () => {
    expect(computeTotals(lines, 5000).grand_total).toBe(90000 + 19900 - 5000)
  })

  it('never goes below zero when the discount is too big', () => {
    expect(grandTotal(100, 50, 500)).toBe(150)
    expect(computeTotals(lines, 9999999).grand_total).toBe(109900)
  })
})

describe('bill numbers (RULES A5)', () => {
  it('formats 0001, 0002, 0003 with no gaps', () => {
    expect(formatBillNumber(1)).toBe('0001')
    expect(formatBillNumber(42)).toBe('0042')
    expect(nextBillNumber(1)).toBe(2)
    expect(nextBillNumber(9999)).toBe(10000)
  })
})

describe('money formatting (RULES B1)', () => {
  it('parses rupees into paise without float drift', () => {
    expect(parseRupees('450')).toBe(45000)
    expect(parseRupees('450.5')).toBe(45050)
    expect(parseRupees('1,740.50')).toBe(174050)
    expect(parseRupees('₹ 12')).toBe(1200)
    expect(parseRupees('')).toBeNull()
    expect(parseRupees('1.999')).toBeNull()
    expect(parseRupees('-5')).toBeNull()
  })

  it('formats in the Indian style', () => {
    expect(formatRupees(17400000)).toBe('₹ 1,74,000')
    expect(formatRupees(45000)).toBe('₹ 450')
    expect(formatRupees(45050)).toBe('₹ 450.50')
    expect(toPaise(450.5)).toBe(45050)
  })
})

describe('reports use active bills only (RULES A8)', () => {
  const base = {
    id: '',
    bill_number: 1,
    billed_at: new Date('2026-10-15T12:00:00').getTime(),
    customer_name: 'Test',
    customer_phone: '9876543210',
    services_total: 10000,
    products_total: 0,
    products_taxable: 0,
    cgst: 0,
    sgst: 0,
    discount: 0,
    grand_total: 10000,
    payment_mode: 'cash' as const,
    created_at: 0,
    updated_at: 0,
  }

  const items: BillItem[] = [
    { id: 'i1', bill_id: 'b1', kind: 'service', name: 'Haircut', unit_price: 5000, quantity: 2, taxable_value: 0, gst_amount: 0, line_total: 10000 },
    { id: 'i2', bill_id: 'b2', kind: 'service', name: 'Facial', unit_price: 8000, quantity: 1, taxable_value: 0, gst_amount: 0, line_total: 8000 },
  ]

  it('leaves cancelled bills out of income and counts', () => {
    const bills: Bill[] = [
      { ...base, id: 'b1', status: 'active' },
      { ...base, id: 'b2', bill_number: 2, status: 'cancelled', cancel_reason: 'wrong bill', grand_total: 8000, services_total: 8000 },
    ]
    const report = monthReport(bills, items, new Date('2026-10-20T12:00:00').getTime())
    expect(report.income).toBe(10000)
    expect(report.billCount).toBe(1)
    expect(report.popularServices).toEqual([{ name: 'Haircut', count: 2 }])
  })

  it('groups income into four weeks of the month', () => {
    const bills: Bill[] = [
      { ...base, id: 'b1', billed_at: new Date('2026-10-03T12:00:00').getTime(), status: 'active' },
      { ...base, id: 'b3', bill_number: 3, billed_at: new Date('2026-10-11T12:00:00').getTime(), status: 'active' },
      { ...base, id: 'b4', bill_number: 4, billed_at: new Date('2026-10-29T12:00:00').getTime(), status: 'active' },
    ]
    const report = monthReport(bills, [], new Date('2026-10-20T12:00:00').getTime())
    expect(report.weeks).toEqual([10000, 10000, 0, 10000])
  })
})

describe('bill draft (RULES A2, A3, A4)', () => {
  it('adds a service once and raises quantity when the same price is tapped again', () => {
    let lines = addServiceLine([], 'Haircut', 1, 45000)
    lines = addServiceLine(lines, 'Haircut', 1, 45000)
    expect(lines).toHaveLength(1)
    expect(lines[0].quantity).toBe(2)
    expect(draftTotals(lines, 0).services_total).toBe(90000)

    lines = addServiceLine(lines, 'Haircut', 2, 65000)
    expect(lines).toHaveLength(2)
  })

  it('keeps a product price with GST and takes the discount off the final total', () => {
    let lines = addServiceLine([], 'Threading', 1, 3000)
    lines = addProductLine(lines)
    const productKey = lines[1].key
    lines = updateLine(lines, productKey, { name: 'Face pack', unit_price: 30000, gst_rate: 12 })

    const totals = draftTotals(lines, 5000)
    expect(totals.services_total).toBe(3000)
    expect(totals.products_total).toBe(30000)
    expect(totals.grand_total).toBe(3000 + 30000 - 5000)
    expect(totals.products_taxable).toBe(26786) // 12%: taxable 26786, gst 3214
    expect(totals.cgst + totals.sgst).toBe(3214)
    expect(totals.products_taxable + totals.cgst + totals.sgst).toBe(30000)
  })

  it('removes a line', () => {
    let lines = addServiceLine([], 'Haircut', 1, 45000)
    lines = addProductLine(lines)
    lines = removeLine(lines, lines[0].key)
    expect(lines).toHaveLength(1)
    expect(lines[0].kind).toBe('product')
  })
})

describe('form validation (RULES B6.2, A1)', () => {
  const goodDraft: Draft = {
    customer_name: 'Priya Sharma',
    customer_phone: '9876543210',
    lines: [{ key: 'k1', kind: 'service', name: 'Haircut', price_option: 1, unit_price: 45000, quantity: 1 }],
    discount: 0,
    payment_mode: 'cash',
  }

  it('accepts a good bill', () => {
    expect(checkDraft(goodDraft)).toEqual([])
  })

  it('asks for a name and a 10 digit phone', () => {
    const errors = checkDraft({ ...goodDraft, customer_name: ' ', customer_phone: '98765' })
    expect(errors).toContain('Type the customer name')
    expect(errors).toContain('Type a 10 digit phone number')
    expect(phoneSchema.safeParse('9876543210').success).toBe(true)
    expect(phoneSchema.safeParse('987654321').success).toBe(false)
  })

  it('needs at least one line and a payment mode', () => {
    const errors = checkDraft({ ...goodDraft, lines: [], payment_mode: '' })
    expect(errors).toContain('Add at least one service or product')
    expect(errors).toContain('Choose Cash or UPI')
  })

  it('needs a product name, price and GST rate', () => {
    const errors = checkDraft({
      ...goodDraft,
      lines: [{ key: 'k2', kind: 'product', name: '', unit_price: 0, quantity: 1 }],
    })
    expect(errors).toContain('Type the product name')
    expect(errors).toContain('Type the price')
    expect(errors).toContain('Choose the GST rate')
  })

  it('stops a discount bigger than the bill', () => {
    const errors = checkDraft({ ...goodDraft, discount: 999999 })
    expect(errors).toContain('Discount cannot be more than the bill')
  })
})

describe('contact numbers (RULES A1.2)', () => {
  it('normalises messy contact numbers to 10 digits', () => {
    expect(normalizePhone('98765 43210')).toBe('9876543210')
    expect(normalizePhone('+91 98765 43210')).toBe('9876543210')
    expect(normalizePhone('09876543210')).toBe('9876543210')
    expect(normalizePhone('0091-98765-43210')).toBe('9876543210')
    expect(normalizePhone('9876543210')).toBe('9876543210')
    expect(normalizePhone('')).toBe('')
  })

  it('finds a number in a copied WhatsApp message', () => {
    expect(phoneFromText('9876543210')).toBe('9876543210')
    expect(phoneFromText('Hi, my number is +91 98765 43210, call me')).toBe('9876543210')
    expect(phoneFromText('see you at 7 pm tomorrow')).toBeNull()
    expect(phoneFromText('')).toBeNull()
  })
})

describe('PIN hash (RULES B4.1)', () => {
  it('matches the standard SHA-256 vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('hashes a longer message correctly', () => {
    expect(sha256Hex('The quick brown fox jumps over the lazy dog')).toBe(
      'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
    )
  })
})
