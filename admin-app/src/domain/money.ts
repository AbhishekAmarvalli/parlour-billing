// Money helpers. Store whole paise; format only when showing. RULES B1.

/** Parse a rupee string ("450", "450.5", "1,740.50") into paise, or null if not a valid amount. */
export function parseRupees(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, '')
  if (cleaned === '') return null
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const [whole, frac = ''] = cleaned.split('.')
  const paise = Number(whole) * 100 + Number((frac + '00').slice(0, 2))
  return Number.isSafeInteger(paise) ? paise : null
}

/** Rupees (number) to paise. Round to the nearest paise. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/** Paise to rupees as a number (for charts and sums, never for storage). */
export function toRupees(paise: number): number {
  return paise / 100
}

const inr = new Intl.NumberFormat('en-IN')

/** Indian style number without the symbol: "1,74,000" or "450.50". */
export function rupeesNumber(paise: number): string {
  const negative = paise < 0
  const abs = Math.abs(paise)
  const whole = Math.floor(abs / 100)
  const frac = abs % 100
  const body = frac === 0 ? inr.format(whole) : `${inr.format(whole)}.${frac.toString().padStart(2, '0')}`
  return negative ? `-${body}` : body
}

/** Format paise as Indian rupees: "₹ 1,74,000". Paise show only when they exist. */
export function formatRupees(paise: number): string {
  const number = rupeesNumber(paise)
  return number.startsWith('-') ? `− ${number.slice(1)}` : `₹ ${number}`
}

/** Short form for chart labels: "41.2k". */
export function formatShortRupees(paise: number): string {
  const rupees = toRupees(paise)
  if (Math.abs(rupees) >= 1000) {
    const k = rupees / 1000
    return `${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}k`
  }
  return inr.format(Math.round(rupees))
}

/** Format a 10 digit phone as "98765 43210". */
export function formatPhone(phone: string): string {
  return phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone
}
