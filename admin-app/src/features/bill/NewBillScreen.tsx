// New Bill: customer, services by tapping a price, products with GST, discount,
// paid by. Total always visible at the bottom. PRD F3, WORKFLOW A2.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../app/DataProvider'
import { Button, Card, Field, Input, Pill } from '../../ui/kit'
import {
  addProductLine,
  addServiceLine,
  draftTotals,
  removeLine,
  updateLine,
  type Draft,
  type DraftLine,
} from '../../domain/draft'
import { checkDraft } from '../../domain/validation'
import { formatRupees, parseRupees } from '../../domain/money'
import type { PaymentMode } from '../../domain/types'
import { findCustomerByPhone } from '../../data/repo'
import { getDraft, setDraft } from './draftStore'

export default function NewBillScreen() {
  const { services } = useData()
  const navigate = useNavigate()

  // Pick up where she left off, even after going back from Check Bill.
  const stored = getDraft()
  const [name, setName] = useState(stored?.name ?? '')
  const [phone, setPhone] = useState(stored?.phone ?? '')
  const [lines, setLines] = useState<DraftLine[]>(stored?.lines ?? [])
  const [discount, setDiscount] = useState(stored?.discountText ?? '')
  const [mode, setMode] = useState<PaymentMode | ''>(stored?.mode ?? '')
  const [errors, setErrors] = useState<string[]>([])
  // Keeps "450." typable: the input holds its own text while the line holds paise.
  const [priceText, setPriceText] = useState<Record<string, string>>({})

  useEffect(() => {
    setDraft({ name, phone, lines, discountText: discount, mode })
  }, [name, phone, lines, discount, mode])

  const discountPaise = discount.trim() === '' ? 0 : (parseRupees(discount) ?? 0)
  const discountWrong = discount.trim() !== '' && parseRupees(discount) === null
  const totals = draftTotals(lines, discountPaise)

  // How many of each service price are on the bill right now (for the pill badge).
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const line of lines) {
      if (line.kind !== 'service') continue
      const key = `${line.name}|${line.price_option}`
      map.set(key, (map.get(key) ?? 0) + line.quantity)
    }
    return map
  }, [lines])

  // If this phone was seen before, her name fills in. WORKFLOW A2.2.
  useEffect(() => {
    if (!/^\d{10}$/.test(phone)) return
    let cancelled = false
    findCustomerByPhone(phone).then((customer) => {
      if (!cancelled && customer && name.trim() === '') setName(customer.name)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone])

  const activeServices = services.filter((s) => s.active)
  const productLines = lines.filter((l) => l.kind === 'product')
  const serviceLines = lines.filter((l) => l.kind === 'service')

  function makeBill() {
    const draft: Draft = {
      customer_name: name,
      customer_phone: phone,
      lines,
      discount: discountPaise,
      payment_mode: mode,
    }
    const problems = checkDraft(draft)
    if (discountWrong) problems.push('Discount must be a number, like 50')
    if (problems.length > 0) {
      setErrors(problems)
      window.scrollTo({ top: 0 })
      return
    }
    setErrors([])
    navigate('/check-bill')
  }

  return (
    <div className="flex flex-col gap-5 pb-40">
      <h1 className="text-3xl font-extrabold">New Bill</h1>

      {errors.length > 0 && (
        <div className="rounded-2xl border border-rose bg-rose/5 p-4" role="alert">
          <p className="text-base font-extrabold text-rose">Check this first</p>
          <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5 text-sm text-ink">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <p className="text-lg font-extrabold">1 · Customer</p>
        <div className="mt-3 flex flex-col gap-4">
          <Field label="Name *">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" autoComplete="off" />
          </Field>
          <Field label="Phone * (10 numbers)">
            <Input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="98765 43210"
            />
          </Field>
        </div>
      </Card>

      <section>
        <h2 className="text-lg font-extrabold">2 · Services</h2>
        <p className="text-sm text-muted">Tap a price. Tap again for the same service twice.</p>
        <div className="mt-3 flex flex-col gap-3">
          {activeServices.length === 0 && <p className="text-base text-muted">No services yet. Add them in Settings.</p>}
          {activeServices.map((service) => (
            <div key={service.id} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-base font-extrabold">
                {service.name}
                {service.label_1 || service.label_2 || service.label_3 ? (
                  <span className="ml-2 text-xs font-bold text-muted">
                    {[service.label_1, service.label_2, service.label_3].filter(Boolean).join(' / ')}
                  </span>
                ) : null}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((option) => {
                  const price = option === 1 ? service.price_1 : option === 2 ? service.price_2 : service.price_3
                  const added = counts.get(`${service.name}|${option}`) ?? 0
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={price <= 0}
                      onClick={() => setLines((current) => addServiceLine(current, service.name, option, price))}
                      className={`min-h-12 rounded-xl border-[1.5px] px-2 text-base font-bold active:scale-[0.98] disabled:opacity-30 ${
                        added > 0 ? 'border-ink bg-ink text-white' : 'border-inputline bg-surface text-ink'
                      }`}
                    >
                      {price > 0 ? formatRupees(price) : '—'}
                      {added > 0 ? <span className="ml-1 text-sm">×{added}</span> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {serviceLines.length > 0 && (
          <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
            <p className="text-base font-extrabold">On this bill</p>
            <div className="mt-2 flex flex-col gap-2">
              {serviceLines.map((line) => (
                <div key={line.key} className="flex items-center justify-between">
                  <span className="text-base">
                    {line.name} {line.quantity > 1 ? `×${line.quantity}` : ''}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-bold">{formatRupees(line.unit_price * line.quantity)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${line.name}`}
                      onClick={() => setLines((current) => removeLine(current, line.key))}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-extrabold text-muted active:bg-track"
                    >
                      ×
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold">3 · Products</h2>
          <button
            type="button"
            onClick={() => setLines((current) => addProductLine(current))}
            className="text-base font-bold text-rose"
          >
            + Add product
          </button>
        </div>
        <p className="text-sm text-muted">Things she takes home. Price includes GST.</p>
        <div className="mt-3 flex flex-col gap-3">
          {productLines.map((line) => (
            <div key={line.key} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex gap-2">
                <Input
                  value={line.name}
                  onChange={(e) => setLines((current) => updateLine(current, line.key, { name: e.target.value }))}
                  placeholder="Product name"
                  aria-label="Product name"
                />
                <button
                  type="button"
                  aria-label="Remove product"
                  onClick={() => setLines((current) => removeLine(current, line.key))}
                  className="flex min-h-13 w-12 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-inputline text-xl font-extrabold text-muted active:bg-track"
                >
                  ×
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={priceTextOf(line)}
                  onChange={(e) => {
                    const text = e.target.value
                    setPriceText((t) => ({ ...t, [line.key]: text }))
                    const paise = parseRupees(text)
                    setLines((current) => updateLine(current, line.key, { unit_price: paise ?? 0 }))
                  }}
                  placeholder="Price with GST inside"
                  aria-label="Product price with GST"
                  className="flex-1"
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm font-bold text-muted">GST</span>
                {([5, 12, 18] as const).map((rate) => (
                  <Pill
                    key={rate}
                    selected={line.gst_rate === rate}
                    onClick={() => setLines((current) => updateLine(current, line.key, { gst_rate: rate }))}
                  >
                    {rate}%
                  </Pill>
                ))}
              </div>
            </div>
          ))}
          {productLines.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line bg-surface p-4 text-center text-base text-muted">
              No products on this bill.
            </p>
          )}
        </div>
      </section>

      <Card>
        <p className="text-lg font-extrabold">4 · Discount and paid by</p>
        <div className="mt-3 flex flex-col gap-4">
          <Field label="Discount (flat rupees, if any)">
            <Input
              type="text"
              inputMode="decimal"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
            />
          </Field>
          {discountWrong ? (
            <p className="-mt-2 text-sm font-bold text-rose">Discount must be a number, like 50</p>
          ) : null}
          <div>
            <p className="mb-1.5 text-sm font-bold text-muted">Paid by *</p>
            <div className="flex gap-2">
              <Pill selected={mode === 'cash'} onClick={() => setMode('cash')} className="flex-1">
                Cash
              </Pill>
              <Pill selected={mode === 'upi'} onClick={() => setMode('upi')} className="flex-1">
                UPI
              </Pill>
            </div>
          </div>
        </div>
      </Card>

      <div className="fixed bottom-19 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-surface px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-muted">Total to pay</p>
            <p className="text-2xl font-extrabold">{formatRupees(totals.grand_total)}</p>
          </div>
          <Button onClick={makeBill} className="flex-1">
            Check the Bill
          </Button>
        </div>
      </div>
    </div>
  )

  function priceTextOf(line: DraftLine): string {
    return priceText[line.key] ?? (line.unit_price > 0 ? String(line.unit_price / 100) : '')
  }
}
