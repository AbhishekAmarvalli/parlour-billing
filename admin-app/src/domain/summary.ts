// One line describing a bill's items, e.g. "Haircut, Facial, Hair serum".

import type { BillItem } from './types'

export function billSummary(items: BillItem[]): string {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity)
  }
  return [...counts.entries()]
    .map(([name, qty]) => (qty > 1 ? `${name} ×${qty}` : name))
    .join(', ')
}
