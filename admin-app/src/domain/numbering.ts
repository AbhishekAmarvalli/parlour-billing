// Bill numbers run 0001, 0002, 0003 with no gaps and no reuse. RULES A5.

export function formatBillNumber(n: number): string {
  return String(n).padStart(4, '0')
}

export function nextBillNumber(current: number): number {
  return current + 1
}
