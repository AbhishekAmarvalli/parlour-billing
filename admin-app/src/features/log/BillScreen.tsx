// One bill, exactly as saved. Amounts are the stored ones — they never change
// after saving. RULES B2.3. Admin view is read only (F10): no cancel button.

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../app/DataProvider'
import { formatBillNumber } from '../../domain/numbering'
import { formatPhone, formatRupees } from '../../domain/money'
import { dayLabel, timeLabel } from '../../domain/dates'
import { cancelBill, itemsOf } from '../../data/repo'
import { Button, Card, EmptyLine, Field, Input } from '../../ui/kit'
import { ChevronLeftIcon } from '../../ui/icons'
import type { BillItem } from '../../domain/types'

export default function BillScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings, bills, items, reload } = useData()
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const [cancelMsg, setCancelMsg] = useState('')

  const bill = bills.find((b) => b.id === id)

  async function doCancel() {
    if (!bill) return
    await cancelBill(bill.id, reason.trim() || 'Cancelled by owner')
    reload()
    setConfirming(false)
    setCancelMsg('This bill is cancelled')
  }
  if (!bill) {
    return (
      <div>
        <BackBar onBack={() => navigate('/log')} />
        <EmptyLine text="This bill is not here" />
      </div>
    )
  }

  const billItems = itemsOf(items, bill.id)
  const services = billItems.filter((i) => i.kind === 'service')
  const products = billItems.filter((i) => i.kind === 'product')

  return (
    <div className="flex flex-col gap-4">
      <BackBar onBack={() => navigate('/log')} />

      <Card className="p-5">
        <div className="text-center">
          <p className="text-xl font-extrabold">{settings?.parlour_name ?? 'Parlour'}</p>
          {settings?.address ? <p className="mt-0.5 text-sm text-muted">{settings.address}</p> : null}
          {settings?.phone ? <p className="text-sm text-muted">{settings.phone}</p> : null}
          {settings?.gstin ? <p className="text-sm text-muted">GSTIN {settings.gstin}</p> : null}
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <p className="text-lg font-extrabold">Bill {formatBillNumber(bill.bill_number)}</p>
          <p className="text-sm font-bold text-muted">
            {dayLabel(bill.billed_at)}, {timeLabel(bill.billed_at)}
          </p>
        </div>

        <div className="mt-3">
          <p className="text-lg font-extrabold">{bill.customer_name}</p>
          <p className="text-sm text-muted">{formatPhone(bill.customer_phone)}</p>
        </div>

        {services.length > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-base font-extrabold">Services</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {services.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-base font-extrabold">Products</p>
            <div className="mt-2 flex flex-col gap-2">
              {products.map((item) => (
                <div key={item.id}>
                  <ItemRow item={item} />
                  <p className="pl-1 text-xs text-muted">
                    GST {item.gst_rate}% = {formatRupees(item.gst_amount)} (CGST {formatRupees(Math.floor(item.gst_amount / 2))} + SGST{' '}
                    {formatRupees(item.gst_amount - Math.floor(item.gst_amount / 2))})
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-base">
          <Row label="Services total" value={formatRupees(bill.services_total)} />
          <Row label="Products total" value={formatRupees(bill.products_total)} />
          {bill.discount > 0 && <Row label="Discount" value={`− ${formatRupees(bill.discount)}`} muted />}
        </div>

        <div className="mt-4 flex items-baseline justify-between rounded-2xl bg-ink px-4 py-3 text-white">
          <p className="text-base font-bold text-soft">Total to pay</p>
          <p className="text-3xl font-extrabold">{formatRupees(bill.grand_total)}</p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-base font-bold">Paid by</p>
          <p className="text-lg font-extrabold">{bill.payment_mode === 'cash' ? 'Cash' : 'UPI'}</p>
        </div>

        {bill.status === 'cancelled' && (
          <div className="mt-4 rounded-2xl border border-line bg-track p-3">
            <p className="text-base font-extrabold text-muted">Cancelled</p>
            {bill.cancel_reason ? <p className="mt-0.5 text-sm text-muted">{bill.cancel_reason}</p> : null}
          </div>
        )}
      </Card>

      {bill.status === 'active' && (
        <Card>
          <p className="text-lg font-extrabold">Cancel this bill</p>
          <p className="mt-1 text-sm text-muted">
            The bill keeps its number and stays in the log, but leaves every total.
          </p>
          {cancelMsg ? <p className="mt-2 text-sm font-bold text-muted">{cancelMsg}</p> : null}
          {!confirming ? (
            <div className="mt-3">
              <Button variant="secondary" onClick={() => setConfirming(true)}>
                Cancel bill
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              <Field label="Why was it cancelled?">
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Wrong bill" />
              </Field>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setConfirming(false)} className="flex-1">
                  Keep it
                </Button>
                <Button onClick={doCancel} className="flex-1">
                  Yes, cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

function BackBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink active:bg-track"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>
      <h1 className="text-2xl font-extrabold">Bill</h1>
    </div>
  )
}

function ItemRow({ item }: { item: BillItem }) {
  const qty = item.quantity > 1 ? ` ×${item.quantity}` : ''
  return (
    <div className="flex items-baseline justify-between gap-3 text-base">
      <span className={item.kind === 'product' ? 'text-ink' : ''}>
        {item.name}
        {qty}
        {item.kind === 'product' && item.gst_rate ? <span className="text-muted"> ({item.gst_rate}%)</span> : null}
      </span>
      <span className="shrink-0 font-bold">{formatRupees(item.line_total)}</span>
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
