// Reports: month income, services and products split, Cash and UPI, income each
// week, popular services, GST on products. Active bills only. PRD F11, RULES A8.

import { useMemo, useState } from 'react'
import { useData } from '../../app/DataProvider'
import { monthReport } from '../../domain/reports'
import { addMonths, monthLabel, startOfMonth } from '../../domain/dates'
import { formatRupees, formatShortRupees } from '../../domain/money'
import { Button, EmptyLine } from '../../ui/kit'
import { ChevronLeftIcon, ChevronRightIcon } from '../../ui/icons'
import { buildExcel } from '../export/excel'
import { buildPdf } from '../export/pdf'
import { saveFile } from '../../app/androidBridge'

export default function ReportsScreen() {
  const { settings, bills, items, loading } = useData()
  const [monthTs, setMonthTs] = useState(() => startOfMonth(Date.now()))
  const [exportMsg, setExportMsg] = useState('')

  function downloadExcel() {
    try {
      const { name, bytes } = buildExcel(bills, items, monthTs)
      const where = saveFile(name, bytes)
      setExportMsg(where === 'phone' ? `Saved to Downloads: ${name}` : `Downloaded: ${name}`)
    } catch {
      setExportMsg('The Excel file could not be made')
    }
  }

  function downloadPdf() {
    try {
      const { name, bytes } = buildPdf(bills, items, monthTs, settings?.parlour_name ?? '')
      const where = saveFile(name, bytes)
      setExportMsg(where === 'phone' ? `Saved to Downloads: ${name}` : `Downloaded: ${name}`)
    } catch {
      setExportMsg('The PDF file could not be made')
    }
  }

  const report = useMemo(() => monthReport(bills, items, monthTs), [bills, items, monthTs])
  const hasData = report.billCount > 0

  // Never go past this month or before the first bill's month.
  const earliest = bills.length > 0 ? startOfMonth(Math.min(...bills.map((b) => b.billed_at))) : startOfMonth(Date.now())
  const atEnd = monthTs >= startOfMonth(Date.now())
  const atStart = monthTs <= earliest

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Reports</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            disabled={atStart}
            onClick={() => setMonthTs((t) => addMonths(t, -1))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface active:bg-track disabled:opacity-30"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="min-w-36 rounded-full border border-line bg-surface px-4 py-2 text-center text-base font-extrabold">
            {monthLabel(monthTs)}
          </span>
          <button
            type="button"
            aria-label="Next month"
            disabled={atEnd}
            onClick={() => setMonthTs((t) => addMonths(t, 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface active:bg-track disabled:opacity-30"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {loading ? (
        <EmptyLine text="Loading…" />
      ) : !hasData ? (
        <EmptyLine text="No bills in this month" />
      ) : (
        <>
          <section className="rounded-3xl bg-ink p-5 text-white" aria-label="Month summary">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-soft">Month Income</p>
                <p className="mt-1 text-4xl font-extrabold">{formatRupees(report.income)}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extrabold">{report.customers}</p>
                <p className="text-sm font-bold text-soft">customers</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SubCard label="Services" value={formatRupees(report.servicesTotal)} />
              <SubCard label="Products" value={formatRupees(report.productsTotal)} />
              <SubCard label="Cash" value={formatRupees(report.cashTotal)} />
              <SubCard label="UPI" value={formatRupees(report.upiTotal)} />
            </div>
          </section>

          <Panel title="Income each week">
            <div className="flex h-40 items-end justify-between gap-3">
              {report.weeks.map((value, i) => {
                const max = Math.max(...report.weeks, 1)
                return (
                  <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-xs font-bold text-muted">{formatShortRupees(value)}</span>
                    <div
                      className="w-full max-w-14 rounded-t-lg bg-rose"
                      style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
                      role="img"
                      aria-label={`Week ${i + 1}: ${formatRupees(value)}`}
                    />
                    <span className="text-xs font-bold text-muted">{i === 3 ? 'Week 4+' : `Week ${i + 1}`}</span>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="Most popular services">
            {report.popularServices.length === 0 ? (
              <p className="py-4 text-center text-base text-muted">No services this month</p>
            ) : (
              <div className="flex flex-col gap-4">
                {report.popularServices.map((service) => {
                  const max = report.popularServices[0].count
                  return (
                    <div key={service.name}>
                      <div className="flex items-baseline justify-between text-base font-bold">
                        <span>{service.name}</span>
                        <span>{service.count}</span>
                      </div>
                      <div className="mt-1.5 h-3 rounded-full bg-track">
                        <div
                          className="h-3 rounded-full bg-rose"
                          style={{ width: `${Math.max(6, (service.count / max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          <Panel title="GST on products">
            <div className="flex flex-col gap-2 text-base">
              <GstRow label="Product sales (with GST)" value={formatRupees(report.gst.sales)} />
              <GstRow
                label={`GST collected, ${report.gst.byRate.map((r) => `${r.rate}%`).join(' + ') || '5% + 12% + 18%'} items`}
                value={formatRupees(report.gst.cgst + report.gst.sgst)}
              />
              {report.gst.byRate.map((rate) => (
                <GstRow key={rate.rate} label={`${rate.rate}% items value ${formatRupees(rate.taxable)}`} value={`GST ${formatRupees(rate.gst)}`} muted />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Services have no GST, so they are not counted here.</p>
          </Panel>

          <Panel title="Get the files">
            <p className="text-sm text-muted">
              Excel has Bills, Items and GST summary. PDF has this month's summary and bill list.
            </p>
            <div className="mt-3 flex gap-3">
              <Button variant="secondary" onClick={downloadExcel} className="flex-1">
                Download Excel
              </Button>
              <Button variant="secondary" onClick={downloadPdf} className="flex-1">
                Download PDF
              </Button>
            </div>
            {exportMsg ? (
              <p className="mt-3 rounded-xl bg-track px-3 py-2 text-sm font-bold text-ink" role="status">
                {exportMsg}
              </p>
            ) : null}
          </Panel>
        </>
      )}
    </div>
  )
}

function SubCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-sm font-bold text-soft">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold">{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function GstRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${muted ? 'text-sm text-muted' : 'font-bold'}`}>
      <span>{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  )
}
