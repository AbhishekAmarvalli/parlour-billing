// Phone number helpers. A contact picker or a copied WhatsApp message can hand
// us "+91 98765 43210", "09876543210", "0091-98765-43210" — the bill needs the
// plain 10 digits. RULES A1.2.

/** Get the 10 digit Indian mobile number out of any messy input, or the digits we got. */
export function normalizePhone(raw: string): string {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (digits.length === 10) return digits
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  if (digits.length === 14 && digits.startsWith('0091')) return digits.slice(4)
  if (digits.length === 13 && digits.startsWith('091')) return digits.slice(3)
  return digits
}

/** Pull the first mobile-looking number out of a copied message. Null if none. */
export function phoneFromText(text: string): string | null {
  const match = /(\+?0?0?91[-\s]?)?(\d[\d\s-]{8,}\d)/.exec(text ?? '')
  if (!match) return null
  const digits = normalizePhone(match[0])
  if (digits.length < 10) return null
  return digits.slice(-10)
}

export interface SharedContact {
  name: string
  phone: string
}

function unvcard(value: string): string {
  return value
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

/**
 * Read a share from WhatsApp: a contact card (vCard) gives name + number,
 * plain shared text gives the number only. Null when there is no mobile.
 */
export function parseSharedContact(text: string): SharedContact | null {
  if (!text || !text.trim()) return null

  if (/BEGIN:VCARD/i.test(text)) {
    const lines = text.split(/\r?\n/)
    const field = (key: string): string[] =>
      lines
        .filter((line) => new RegExp(`^${key}(?:;[^:]*)?:`, 'i').test(line))
        .map((line) => unvcard(line.replace(new RegExp(`^${key}(?:;[^:]*)?:`, 'i'), '')))
        .filter((value) => value !== '')

    const fn = field('FN')[0] ?? ''
    const n = field('N')[0] ?? ''
    let name = fn
    if (!name && n) {
      const [family = '', given = ''] = n.split(';')
      name = [given, family].filter((part) => part.trim() !== '').join(' ')
    }

    for (const tel of field('TEL')) {
      const phone = phoneFromText(tel)
      if (phone) return { name: name.trim(), phone }
    }
    return null
  }

  const phone = phoneFromText(text)
  return phone ? { name: '', phone } : null
}
