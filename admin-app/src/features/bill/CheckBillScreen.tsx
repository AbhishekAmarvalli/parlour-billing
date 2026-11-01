// Check Bill: read the bill before saving, with the GST breakup. PRD F4, WORKFLOW A2.8.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../app/DataProvider'
import { Button, Card, EmptyLine } from '../../ui/kit'
import { draftTotals, type Draft, type DraftLine } from '../../domain/draft'
import { formatRupees, parseRupees } from '../../domain/money'
import { saveNewBill } from '../../data/repo'
import { checkDraft } from '../../domain/validation'
import { clearDraft, getDraft } from './draftStore'

export default function CheckBillScreen() {
  const navigate = useNavigate()
  const { settings, reload } = useData()
  const [saving, setSaving] = useState(false)

  const stored = getDraft()
  const draft: Draft | null = stored
    ? {
        customer_name: stored.name,
        customer_phone: stored.phone,
        lines: stored.lines,
        discount: stored.discountText.trim() === '' ? 0 : (parseRupees(stored.discountText) ?? 0),
        payment_mode: stored.mode,
      }
    : null

  if (!draft) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyLine text="Nothing to check. Make a bill first." />
        <Button onClick={() => navigate('/new-bill')}>Make New Bill</Button>
      </div>
    )
  }

  const totals = draftTotals(draft.lines, draft.discount)
  const services = draft.lines.filter((l) => l.kind === 'service')
  const products = draft.lines.filter((l) => l.kind === 'product')

  async function save() {
    if (!draft || saving) return
    const problems = checkDraft(draft)
    if (problems.length > 0) {
      navigate('/new-bill')
      return
    }
    setSaving(true)
    try {
      const number = await saveNewBill(draft)
      clearDraft()
      // Re-read the database before showing Home, so the new bill and today's
      // totals are there straight away — no reopening the app needed.
      await reload()
      navigate(`/?saved=${number}`, { replace: true })
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-40">
      <h1 className="text-3xl font-extrabold">Check Bill</h1>
      <p className="-mt-2 text-sm text-muted">Read it once. Save it, or go back and change something.</p>

      <Card className="p-5">
        <div className="text-center">
          <p className="text-xl font-extrabold">{settings?.parlour_name || 'Parlour'}</p>
          {settings?.address ? <p className="mt-0.5 text-sm text-muted">{settings.address}</p> : null}
          {settings?.phone ? <p className="text-sm text-muted">{settings.phone}</p> : null}
          {settings?.gstin ? <p className="text-sm text-muted">GSTIN {settings.gstin}</p> : null}
        </div>

        <div className="mt-3 border-t border-line pt-4">
          <p className="text-lg font-extrabold">{draft.customer_name.trim()}</p>
          <p className="text-sm text-muted">{draft.customer_phone}</p>
        </div>

        {services.length > 0 && (
          <div className="mt-4">
            <p className="text-base font-extrabold">Services</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {services.map((line) => (
                <LineRow key={line.key} line={line} />
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-4">
            <p className="text-base font-extrabold">Products</p>
            <div className="mt-2 flex flex-col gap-2">
              {products.map((line) => {
                const split = draftTotals([line], 0)
                return (
                  <div key={line.key}>
                    <LineRow line={line} />
                    <p className="pl-1 text-xs text-muted">
                      GST {line.gst_rate}% = {formatRupees(split.cgst + split.sgst)} (CGST {formatRupees(split.cgst)} + SGST{' '}
                      {formatRupees(split.sgst)})
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-base">
          <Row label="Services total" value={formatRupees(totals.services_total)} />
          <Row label="Products total" value={formatRupees(totals.products_total)} />
          {draft.discount > 0 && <Row label="Discount" value={`− ${formatRupees(draft.discount)}`} muted />}
        </div>

        <div className="mt-4 flex items-baseline justify-between rounded-2xl bg-ink px-4 py-3 text-white">
          <p className="text-base font-bold text-soft">Total to pay</p>
          <p className="text-3xl font-extrabold">{formatRupees(totals.grand_total)}</p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-base font-bold">Paid by</p>
          <p className="text-lg font-extrabold">{draft.payment_mode === 'cash' ? 'Cash' : 'UPI'}</p>
        </div>
      </Card>

      <div className="fixed bottom-19 left-1/2 w-full max-w-[430px] -translate-x-1/2 flex gap-3 border-t border-line bg-surface px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button variant="secondary" onClick={() => navigate(-1)} disabled={saving} className="flex-1">
          Change something
        </Button>
        <Button onClick={save} disabled={saving} className="flex-1">
          {saving ? 'Saving…' : 'Save Bill'}
        </Button>
      </div>
    </div>
  )
}

function LineRow({ line }: { line: DraftLine }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-base">
      <span>
        {line.name.trim() || 'Product'}
        {line.quantity > 1 ? ` ×${line.quantity}` : ''}
        {line.kind === 'product' && line.gst_rate ? <span className="text-muted"> ({line.gst_rate}%)</span> : null}
      </span>
      <span className="shrink-0 font-bold">{formatRupees(line.unit_price * line.quantity)}</span>
    </div>
  )
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between ${muted ? 'text-muted' : ''}`}>
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}
