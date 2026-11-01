// PIN lock: 4 digits, hashed with salt, 3 wrong tries wait 30 seconds. PRD F1, RULES B4.1.

import { sha256Hex } from './sha256'

const PIN_KEY = 'parlour-admin.pin'
const LOCK_KEY = 'parlour-admin.lock'
const MAX_TRIES = 3
const LOCK_MS = 30_000

interface StoredPin {
  salt: string
  hash: string
}

interface LockState {
  tries: number
  lockedUntil: number
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

export function hasPin(): boolean {
  return localStorage.getItem(PIN_KEY) !== null
}

function readStored(): StoredPin | null {
  const raw = localStorage.getItem(PIN_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredPin
    return typeof parsed.salt === 'string' && typeof parsed.hash === 'string' ? parsed : null
  } catch {
    return null
  }
}

function randomSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Set a new 4 digit PIN, stored as salted hash. */
export function setPin(pin: string): void {
  if (!isValidPin(pin)) throw new Error('PIN must be 4 digits')
  const salt = randomSalt()
  localStorage.setItem(PIN_KEY, JSON.stringify({ salt, hash: sha256Hex(pin + salt) }))
  clearLock()
}

function readLock(): LockState {
  const raw = localStorage.getItem(LOCK_KEY)
  if (!raw) return { tries: 0, lockedUntil: 0 }
  try {
    const parsed = JSON.parse(raw) as LockState
    return { tries: parsed.tries ?? 0, lockedUntil: parsed.lockedUntil ?? 0 }
  } catch {
    return { tries: 0, lockedUntil: 0 }
  }
}

function writeLock(state: LockState): void {
  localStorage.setItem(LOCK_KEY, JSON.stringify(state))
}

export function isLocked(): boolean {
  return readLock().lockedUntil > Date.now()
}

/** Milliseconds left of the 30 second wait, or 0. */
export function lockWaitLeft(): number {
  return Math.max(0, readLock().lockedUntil - Date.now())
}

function clearLock(): void {
  localStorage.removeItem(LOCK_KEY)
}

/** Check the typed PIN. Wrong tries count up to 3, then the app waits 30 seconds. */
export function verifyPin(pin: string): boolean {
  const stored = readStored()
  if (!stored) return false
  if (isLocked()) return false
  const ok = sha256Hex(pin + stored.salt) === stored.hash
  if (ok) {
    clearLock()
  } else {
    const lock = readLock()
    const tries = lock.tries + 1
    writeLock(tries >= MAX_TRIES ? { tries: 0, lockedUntil: Date.now() + LOCK_MS } : { tries, lockedUntil: 0 })
  }
  return ok
}
