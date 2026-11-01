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
