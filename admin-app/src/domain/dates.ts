// Day, week and month boundaries in the phone's own time zone.

const DAY = 24 * 60 * 60 * 1000

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function endOfDay(ts: number): number {
  return startOfDay(ts) + DAY - 1
}

/** Weeks start on Sunday. */
export function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts))
  d.setDate(d.getDate() - d.getDay())
  return d.getTime()
}

export function startOfMonth(ts: number): number {
  const d = new Date(ts)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** End of the month, inclusive. */
export function endOfMonth(ts: number): number {
  const d = new Date(ts)
  d.setMonth(d.getMonth() + 1, 1)
  d.setHours(0, 0, 0, 0)
  return d.getTime() - 1
}

export function addMonths(ts: number, months: number): number {
  const d = new Date(ts)
  d.setMonth(d.getMonth() + months)
  return d.getTime()
}

/** Stable key for a month, e.g. "2026-10". */
export function monthKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "October 2026" */
export function monthLabel(ts: number): string {
  const d = new Date(ts)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "Sunday, 1 November" */
export function dayLabel(ts: number): string {
  const d = new Date(ts)
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' })
  return `${weekday}, ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** "6:45 PM" */
export function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}
