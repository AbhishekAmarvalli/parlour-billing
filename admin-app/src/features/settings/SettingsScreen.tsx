// Settings: parlour details, the price list, change PIN, and backup.
// The owner edits everything here; old bills never change. RULES A2.4, A6.3.

import { useEffect, useRef, useState } from 'react'
import { useData } from '../../app/DataProvider'
import { Button, Card, Field, Input } from '../../ui/kit'
import { saveServices, saveSettings } from '../../data/repo'
import { importBackup, lastImportAt } from '../../data/import'
import { buildBackup } from '../../data/backupExport'
import { saveFile } from '../../app/androidBridge'
import { parseRupees } from '../../domain/money'
import { settingsSchema } from '../../domain/validation'
import { checkPin, isValidPin, setPin } from '../pin/pin'
import type { Service } from '../../domain/types'
import { timeLabel } from '../../domain/dates'

interface Row {
  id: string
  name: string
  p1: string
  p2: string
  p3: string
  l1: string
  l2: string
  l3: string
  active: boolean
}

function toRow(service: Service): Row {
  return {
    id: service.id,
    name: service.name,
    p1: service.price_1 > 0 ? String(service.price_1 / 100) : '',
    p2: service.price_2 > 0 ? String(service.price_2 / 100) : '',
    p3: service.price_3 > 0 ? String(service.price_3 / 100) : '',
    l1: service.label_1 ?? '',
    l2: service.label_2 ?? '',
    l3: service.label_3 ?? '',
    active: service.active,
  }
}

function emptyRow(): Row {
  return { id: crypto.randomUUID(), name: '', p1: '', p2: '', p3: '', l1: '', l2: '', l3: '', active: true }
}

export default function SettingsScreen() {
  const { settings, services, reload } = useData()

  const [parlour, setParlour] = useState({ parlour_name: '', address: '', phone: '', gstin: '' })
  const [detailsMsg, setDetailsMsg] = useState('')

  const [rows, setRows] = useState<Row[]>([])
  const [listMsg, setListMsg] = useState('')

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')

  const [backupMsg, setBackupMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (settings) {
      setParlour({
        parlour_name: settings.parlour_name,
        address: settings.address,
        phone: settings.phone,
        gstin: settings.gstin,
      })
    }
  }, [settings])

  useEffect(() => {
    setRows(services.map(toRow))
  }, [services])

  const importedAt = lastImportAt()

  async function saveDetails() {
    const check = settingsSchema.safeParse(parlour)
    if (!check.success) {
      setDetailsMsg('Type the parlour name')
      return
    }
    await saveSettings(parlour)
    await reload()
    setDetailsMsg('Details saved')
  }

  function patchRow(id: string, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  async function saveList() {
    if (rows.some((row) => row.name.trim() === '')) {
      setListMsg('Every service needs a name')
      return
    }
    const cleaned: Service[] = rows.map((row, index) => ({
      id: row.id,
      name: row.name.trim(),
      price_1: parseRupees(row.p1) ?? 0,
      price_2: parseRupees(row.p2) ?? 0,
      price_3: parseRupees(row.p3) ?? 0,
      label_1: row.l1.trim() || undefined,
      label_2: row.l2.trim() || undefined,
      label_3: row.l3.trim() || undefined,
      active: row.active,
      sort_order: index,
      updated_at: Date.now(),
    }))
    await saveServices(cleaned)
    await reload()
    setListMsg('Price list saved')
  }

  function changePin() {
    // checkPin does not count a wrong try, so a typo here cannot lock the app.
    if (!checkPin(currentPin)) {
      setPinMsg('The old PIN is wrong')
      return
    }
    if (!isValidPin(newPin)) {
      setPinMsg('The new PIN must be 4 numbers')
      return
    }
    if (newPin !== confirmPin) {
      setPinMsg('The two new PINs did not match')
      return
    }
    setPin(newPin)
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    setPinMsg('PIN changed')
  }

  async function backupNow() {
    try {
      const text = await buildBackup()
      const name = `parlour-backup-${new Date().toISOString().slice(0, 10)}.json`
      const where = saveFile(name, new TextEncoder().encode(text))
      setBackupMsg(where === 'phone' ? `Backup saved to Downloads: ${name}` : `Backup downloaded: ${name}`)
    } catch {
      setBackupMsg('Backup could not be made')
    }
  }

  async function restoreFile(file: File | undefined) {
    if (!file) return
    try {
      const text = await file.text()
      const result = await importBackup(text)
      if (result.ok && result.counts) {
        await reload()
        setBackupMsg(`Backup opened: ${result.counts.bills} bills, ${result.counts.customers} customers`)
      } else {
        setBackupMsg(result.error ?? 'This file could not be read')
      }
    } catch {
      setBackupMsg('This file could not be read')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-extrabold">Settings</h1>

      <Card>
        <p className="text-lg font-extrabold">Parlour details</p>
        <div className="mt-3 flex flex-col gap-4">
          <Field label="Parlour name *">
            <Input value={parlour.parlour_name} onChange={(e) => setParlour({ ...parlour, parlour_name: e.target.value })} />
          </Field>
          <Field label="Address">
            <Input value={parlour.address} onChange={(e) => setParlour({ ...parlour, address: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input
              type="tel"
              inputMode="numeric"
              value={parlour.phone}
              onChange={(e) => setParlour({ ...parlour, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            />
          </Field>
          <Field label="GST number (GSTIN)">
            <Input value={parlour.gstin} onChange={(e) => setParlour({ ...parlour, gstin: e.target.value })} />
          </Field>
          <Button variant="secondary" onClick={saveDetails}>
            Save details
          </Button>
          {detailsMsg ? <p className="text-sm font-bold text-muted">{detailsMsg}</p> : null}
        </div>
      </Card>

      <Card>
        <p className="text-lg font-extrabold">Services and prices</p>
        <p className="mt-1 text-sm text-muted">Each service has 3 prices. Old bills never change.</p>
        <div className="mt-3 flex flex-col gap-4">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-line p-3">
              <div className="flex gap-2">
                <Input
                  value={row.name}
                  onChange={(e) => patchRow(row.id, { name: e.target.value })}
                  placeholder="Service name"
                  aria-label="Service name"
                />
                <button
                  type="button"
                  onClick={() => patchRow(row.id, { active: !row.active })}
                  aria-label={row.active ? `Hide ${row.name}` : `Show ${row.name}`}
                  className={`min-h-13 shrink-0 rounded-xl border-[1.5px] px-3 text-sm font-extrabold ${
                    row.active ? 'border-ink bg-ink text-white' : 'border-inputline bg-surface text-muted'
                  }`}
                >
                  {row.active ? 'Shown' : 'Hidden'}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['p1', 'p2', 'p3'] as const).map((field, i) => (
                  <Input
                    key={field}
                    type="text"
                    inputMode="decimal"
                    value={row[field]}
                    onChange={(e) => patchRow(row.id, { [field]: e.target.value } as Partial<Row>)}
                    placeholder={`Price ${i + 1}`}
                    aria-label={`Price ${i + 1}`}
                  />
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['l1', 'l2', 'l3'] as const).map((field) => (
                  <Input
                    key={field}
                    type="text"
                    value={row[field]}
                    onChange={(e) => patchRow(row.id, { [field]: e.target.value } as Partial<Row>)}
                    placeholder="Name (optional)"
                    aria-label="Price name"
                    className="min-h-11 text-sm"
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setRows((current) => [...current, emptyRow()])}>
              + Add service
            </Button>
            <Button onClick={saveList}>Save price list</Button>
          </div>
          {listMsg ? <p className="text-sm font-bold text-muted">{listMsg}</p> : null}
        </div>
      </Card>

      <Card>
        <p className="text-lg font-extrabold">Change PIN</p>
        <div className="mt-3 flex flex-col gap-4">
          <Field label="Old PIN">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={currentPin}
              placeholder="Old PIN"
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </Field>
          <Field label="New PIN (4 numbers)">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              placeholder="New PIN"
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </Field>
          <Field label="Type the new PIN again">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              placeholder="New PIN again"
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </Field>
          <Button variant="secondary" onClick={changePin}>
            Change PIN
          </Button>
          {pinMsg ? <p className="text-sm font-bold text-muted">{pinMsg}</p> : null}
        </div>
      </Card>

      <Card>
        <p className="text-lg font-extrabold">Backup</p>
        <p className="mt-1 text-sm text-muted">
          All bills are safe on this phone. A backup file keeps a copy outside the app.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <Button onClick={backupNow}>Backup now</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Open a backup file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Open a backup file"
            onChange={(e) => restoreFile(e.target.files?.[0])}
          />
          {backupMsg ? <p className="text-sm font-bold text-muted">{backupMsg}</p> : null}
          {importedAt ? (
            <p className="text-xs text-muted">
              Last opened backup: {new Date(importedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at{' '}
              {timeLabel(importedAt)}
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
