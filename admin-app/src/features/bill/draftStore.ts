// The bill being typed, kept outside React so it survives going to Check Bill,
// pressing back, or the phone's back button. Cleared only after a real save.

import type { DraftLine } from '../../domain/draft'
import type { PaymentMode } from '../../domain/types'

export interface DraftForm {
  name: string
  phone: string
  lines: DraftLine[]
  discountText: string
  mode: PaymentMode | ''
}

let current: DraftForm | null = null

export function getDraft(): DraftForm | null {
  return current
}

export function setDraft(form: DraftForm): void {
  current = form
}

export function clearDraft(): void {
  current = null
}

// A contact shared from WhatsApp waits here until the New Bill screen takes it.
let sharedContact: { name: string; phone: string } | null = null
const listeners = new Set<() => void>()

export function stashSharedContact(contact: { name: string; phone: string }): void {
  sharedContact = contact
  listeners.forEach((listener) => listener())
}

export function takeSharedContact(): { name: string; phone: string } | null {
  const contact = sharedContact
  sharedContact = null
  return contact
}

export function onSharedContactChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
