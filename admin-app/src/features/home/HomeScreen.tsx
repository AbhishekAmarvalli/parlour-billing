// Home: today's money, customers, Cash and UPI split, latest bills. Read only for
// the admin — no Make New Bill button. PRD F6 + F10.

import { useNavigate, useSearchParams } from 'react-router-dom'
import { useData } from '../../app/DataProvider'
import { activeBillsBetween } from '../../domain/reports'
import { endOfDay, startOfDay } from '../../domain/dates'
import { formatRupees } from '../../domain/money'
import { formatBillNumber } from '../../domain/numbering'
import { billSummary } from '../../domain/summary'
import { itemsOf } from '../../data/repo'
import { Button, Notice } from '../../ui/kit'
import { CheckIcon, GearIcon, LockIcon } from '../../ui/icons'

export default function HomeScreen({ onLock }: { onLock: () => void }) {
  const { settings, bills, items, loading } = useData()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const savedNumber = params.get('saved')

  const now = Date.now()
  const todayBills = activeBillsBetween(bills, startOfDay(now), endOfDay(now))
  const money = todayBills.reduce((sum, b) => sum + b.grand_total, 0)
  const cash = todayBills.filter((b) => b.payment_mode === 'cash').reduce((s, b) => s + b.grand_total, 0)
  const upi = money - cash

  const status = loading
    ? 'Loading bills…'
    : bills.length === 0
      ? 'Saved on this phone · no bills yet'
      : `Saved on this phone · ${bills.length} bills`

  // The bill just saved, so the end of the job says what happened (peak-end rule).
  const savedBill = savedNumber ? bills.find((bill) => bill.bill_number === Number(savedNumber)) : undefined

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-muted">
            {new Date(now).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-0.5 text-3xl font-extrabold">{settings?.parlour_name ?? 'Parlour'}</h1>
          <p className="mt-1 text-xs font-bold text-muted">{status}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-ink active:bg-track"
          >
            <GearIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onLock}
            aria-label="Lock app"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-ink active:bg-track"
          >
            <LockIcon className="h-6 w-6" />
          </button>
        </div>
      </header>

      {savedNumber ? (
        <Notice
          tone="ok"
          title={`Bill ${formatBillNumber(Number(savedNumber))} saved`}
          onDismiss={() => navigate('/', { replace: true })}
        >
          <span className="flex items-center gap-1.5">
            <CheckIcon className="h-4 w-4 shrink-0" />
            {savedBill
              ? `${formatRupees(savedBill.grand_total)} · ${savedBill.customer_name}`
              : 'Saved on this phone. It is in Bills.'}
          </span>
        </Notice>
      ) : null}

      <section className="rounded-3xl bg-ink p-5 text-white" aria-label="Today’s money">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-soft">Today’s Money</p>
            <p className="mt-1 text-4xl font-extrabold">{formatRupees(money)}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-extrabold">{todayBills.length}</p>
            <p className="text-sm font-bold text-soft">customers</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-sm font-bold text-soft">Cash</p>
            <p className="mt-0.5 text-xl font-extrabold">{formatRupees(cash)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-sm font-bold text-soft">UPI</p>
            <p className="mt-0.5 text-xl font-extrabold">{formatRupees(upi)}</p>
          </div>
        </div>
      </section>

      <Button onClick={() => navigate('/new-bill')} tall>
        + Make New Bill
      </Button>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold">Latest Bills</h2>
          <button type="button" onClick={() => navigate('/log')} className="text-base font-bold text-rose">
            See all
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {bills.length === 0 && !loading ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center">
              <p className="text-base font-bold text-ink">Your first bill goes here</p>
              <p className="mt-1 text-sm text-muted">Tap Make New Bill above to write it.</p>
            </div>
          ) : (
            bills.slice(0, 4).map((bill) => (
              <button
                key={bill.id}
                type="button"
                onClick={() => navigate(`/bill/${bill.id}`)}
                className="flex w-full items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4 text-left active:bg-track"
              >
                <span className="min-w-0">
                  <span className="block truncate text-lg font-extrabold">{bill.customer_name}</span>
                  <span className="mt-0.5 block truncate text-sm text-muted">
                    {billSummary(itemsOf(items, bill.id)) || '—'}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-extrabold">{formatRupees(bill.grand_total)}</span>
                  <span className="block text-xs font-bold uppercase text-muted">
                    {bill.payment_mode === 'cash' ? 'Cash' : 'UPI'}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
