// Customer Log: search by name or phone, filter Today / This week / This month. Read only.
// PRD F7 (without cancel), F10.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../app/DataProvider'
import { endOfDay, monthLabel, startOfDay, startOfMonth, startOfWeek, timeLabel } from '../../domain/dates'
import { formatPhone, formatRupees } from '../../domain/money'
import { billSummary } from '../../domain/summary'
import { itemsOf } from '../../data/repo'
import { EmptyLine, Field, Input, Pill } from '../../ui/kit'
import { SearchIcon } from '../../ui/icons'

type Filter = 'today' | 'week' | 'month'

export default function LogScreen() {
  const { bills, items } = useData()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('today')

  const from = useMemo(() => {
    const now = Date.now()
    if (filter === 'today') return startOfDay(now)
    if (filter === 'week') return startOfWeek(now)
    return startOfMonth(now)
  }, [filter])

  const to = filter === 'today' ? endOfDay(Date.now()) : Number.MAX_SAFE_INTEGER

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bills.filter((b) => {
      if (b.billed_at < from || b.billed_at > to) return false
      if (!q) return true
      return b.customer_name.toLowerCase().includes(q) || b.customer_phone.includes(q)
    })
  }, [bills, query, from, to])

  const active = shown.filter((b) => b.status === 'active')
  const total = active.reduce((s, b) => s + b.grand_total, 0)

  const context = filter === 'today' ? timeContext() : filter === 'week' ? 'This week' : monthLabel(Date.now())

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-extrabold">Bills</h1>
        <p className="text-sm text-muted">Every bill made on this phone.</p>
      </div>

      <Field label="Find by name or phone">
        <div className="relative">
          <Input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type name or number"
            className="pr-11"
          />
          <SearchIcon className="pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-muted" />
        </div>
      </Field>

      <div className="flex gap-2">
        <Pill selected={filter === 'today'} onClick={() => setFilter('today')}>
          Today
        </Pill>
        <Pill selected={filter === 'week'} onClick={() => setFilter('week')}>
          This week
        </Pill>
        <Pill selected={filter === 'month'} onClick={() => setFilter('month')}>
          This month
        </Pill>
      </div>

      <div className="flex items-baseline justify-between text-sm font-bold text-ink">
        <span>
          {context} · {active.length} customers
        </span>
        <span className="text-lg font-extrabold">{formatRupees(total)}</span>
      </div>

      <div className="flex flex-col gap-3">
        {shown.length === 0 ? (
          <EmptyLine text={query ? 'No bill matches this name or number' : 'No bills in this time'} />
        ) : (
          shown.map((bill) => (
            <button
              key={bill.id}
              type="button"
              onClick={() => navigate(`/bill/${bill.id}`)}
              className={`w-full rounded-2xl border p-4 text-left active:bg-track ${
                bill.status === 'cancelled' ? 'border-line bg-track/50' : 'border-line bg-surface'
              }`}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-lg font-extrabold">{bill.customer_name}</span>
                <span className={`shrink-0 text-lg font-extrabold ${bill.status === 'cancelled' ? 'text-muted line-through' : ''}`}>
                  {formatRupees(bill.grand_total)}
                </span>
              </span>
              <span className="mt-0.5 block text-sm text-muted">
                {formatPhone(bill.customer_phone)} · {timeLabel(bill.billed_at)} ·{' '}
                {bill.status === 'cancelled' ? 'Cancelled' : bill.payment_mode === 'cash' ? 'Cash' : 'UPI'}
              </span>
              <span className="mt-1 block text-sm text-ink">{billSummary(itemsOf(items, bill.id)) || '—'}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function timeContext(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}
