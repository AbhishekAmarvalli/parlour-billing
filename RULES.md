# RULES: Parlour Billing App

Business rules and engineering rules. If a rule here changes, update MEMORY.md too.

## Part A: Business rules

### A1. Bill validation

1. Customer name is required.
2. Customer phone is required and must be 10 digits. (Review: may become optional.)
3. A bill needs at least one service or one product.
4. A product needs a name, a price above zero, and a GST rate of 5, 12 or 18.
5. Discount is a flat rupee amount, zero or more, and cannot be more than the total before discount.
6. Payment mode is Cash or UPI. No other mode, no part payment, no credit.

### A2. Services

1. Services carry **no GST**.
2. Each service has exactly 3 fixed prices (price_1, price_2, price_3), with optional names for them.
3. The same service can be added more than once on a bill (quantity).
4. A service that is hidden stays on old bills unchanged.

### A3. Products and GST

1. The price she types for a product **includes GST**.
2. GST rate is chosen per product: 5, 12 or 18.
3. Formulas, per product line:
   - value without GST = price × 100 ÷ (100 + rate)
   - GST = price − value without GST
   - CGST = SGST = GST ÷ 2
4. Worked example: ₹450 at 18% → value 381.36, GST 68.64, CGST 34.32, SGST 34.32.

### A4. Totals

1. Services total = sum of service lines (no GST).
2. Products total = sum of product prices typed (GST already inside).
3. Grand total = services total + products total − discount.
4. The discount comes off the final total. Product GST stays as worked out in A3. (To be confirmed with the accountant; see MEMORY.md.)
5. Rounding: not yet decided (paise or nearest rupee). Until decided, keep paise.

### A5. Bill numbers

1. Numbers run 0001, 0002, 0003 with no gaps and no reuse.
2. A cancelled bill keeps its number.
3. If a second phone ever bills, give each phone a prefix (A-0001, B-0001).

### A6. Cancelling

1. A bill is never deleted. It is marked cancelled with a reason.
2. A cancelled bill is shown as Cancelled in the log and is left out of every total, report, GST figure and export total.
3. A bill's saved amounts never change after saving, even if prices or rates change later.

### A7. Customers

1. A customer is found by phone number (unique).
2. Name and phone are copied onto each bill, so editing a customer never changes old bills.

### A8. Reports

1. Reports use active (not cancelled) bills only.
2. They must match the Customer Log exactly.
3. Product sales and GST collected are shown separately from services.

## Part B: Engineering rules

### B1. Money

1. Store money as whole **paise** (integer). ₹450 is 45000. Never store money as floating point.
2. Do all GST and total maths in one shared module with tests. No maths inside screens.
3. Format as Indian rupees only when showing.

### B2. Data

1. Bill IDs are UUIDs made on the phone. Saving the same ID twice keeps one copy.
2. Never hard-delete bills, items or customers.
3. Save the worked-out amounts (taxable value, CGST, SGST, totals) on the bill at save time.
4. Every row has created_at and updated_at. Sync uses updated_at.

### B3. Offline and sync

1. Billing must never wait for the internet.
2. Save to the phone database first, then sync in the background.
3. Sync is safe to repeat (idempotent).
4. Show Saved on phone / Saved online and the number of waiting bills.

### B4. Security

1. PIN is stored hashed, never as plain digits.
2. Only two online accounts exist: owner (read and write) and admin viewer (read only). Enforce with database row-level rules, not only in the app.
3. All traffic uses HTTPS.
4. Collect only customer name and phone.

### B5. Interface

1. Buttons at least 48 px, text at least 16 px.
2. Plain English labels only.
3. Number keypad for phone and money fields.
4. Every screen works at about 360 px wide.

### B6. Code

1. TypeScript, strict mode.
2. Validate all form input with Zod before saving.
3. Unit tests for: GST split, totals, discount limits, bill numbering, sync repeat, cancel behaviour.
4. No feature is done until it works in airplane mode.
