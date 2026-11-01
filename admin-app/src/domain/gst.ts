// GST for products. Services carry no GST. RULES A3.

import type { GstRate } from './types'

export interface GstSplit {
  /** value without GST, in paise */
  taxable: number
  /** total GST, in paise */
  gst: number
  cgst: number
  sgst: number
}

/**
 * Split a GST-inclusive price into taxable value and GST.
 * price includes GST. value without GST = price × 100 ÷ (100 + rate)
 * Example: ₹450 at 18% → value 381.36, GST 68.64, CGST 34.32, SGST 34.32 (RULES A3.4)
 */
export function splitGst(priceIncludingGst: number, rate: GstRate): GstSplit {
  const taxable = Math.round((priceIncludingGst * 100) / (100 + rate))
  const gst = priceIncludingGst - taxable
  const cgst = Math.floor(gst / 2)
  const sgst = gst - cgst
  return { taxable, gst, cgst, sgst }
}
