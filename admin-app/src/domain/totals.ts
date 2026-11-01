// Totals. Grand total = services + products − discount. Discount comes off the final
// total only; product GST stays as worked out. RULES A4.

export interface LineLike {
  kind: 'service' | 'product'
  unit_price: number
  quantity: number
}

export interface Totals {
  services_total: number
  products_total: number
  grand_total: number
}

/** Sum a bill's lines into services and products totals. */
export function totalOfLines(lines: LineLike[]): Omit<Totals, 'grand_total'> {
  let services_total = 0
  let products_total = 0
  for (const line of lines) {
    const lineTotal = line.unit_price * line.quantity
    if (line.kind === 'service') services_total += lineTotal
    else products_total += lineTotal
  }
  return { services_total, products_total }
}

/** Grand total after a flat rupee discount. The discount cannot exceed the total before it. */
export function grandTotal(services_total: number, products_total: number, discount: number): number {
  const before = services_total + products_total
  if (discount > before) return before
  return before - discount
}

/** Everything a saved bill stores, computed at save time. */
export function computeTotals(lines: LineLike[], discount: number): Totals {
  const { services_total, products_total } = totalOfLines(lines)
  return { services_total, products_total, grand_total: grandTotal(services_total, products_total, discount) }
}
