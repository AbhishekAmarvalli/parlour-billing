# ARCHITECTURE: Parlour Billing App

## 1. Overview

An offline-first Progressive Web App (PWA) for one Android phone, with a managed online database for backup and a read-only admin view. All billing logic runs on the phone.

```
Her Android phone                         Online                     Admin phone
┌──────────────────────────┐        ┌────────────────┐        ┌──────────────────┐
│ Billing app (React PWA)  │        │ PostgreSQL     │        │ Same PWA,        │
│        │                 │  sync  │ + login        │  view  │ read-only role   │
│        ▼                 │◄──────►│ + row rules    │───────►│                  │
│ Phone database (Dexie)   │        │ + nightly copy │        └──────────────────┘
└──────────────────────────┘        └────────────────┘
```

No bill is sent to customers.

## 2. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| UI | React + TypeScript, Vite | Common, fast |
| Styling | Tailwind CSS | Keeps big-button rules consistent |
| Installable app | PWA: web manifest + service worker (vite-plugin-pwa) | Home-screen icon, full screen, works offline, no Play Store |
| Routing | React Router | 7 screens |
| Phone database | IndexedDB via Dexie | Offline storage of all bills |
| Validation | Zod | Phone, name, amounts |
| Files | SheetJS (Excel), jsPDF (PDF), made on the phone | Work offline |
| Online database | PostgreSQL on a managed service such as Supabase | Database, login and storage in one place |
| Login | Email link or one-time code, once per phone | No password to remember |
| Access control | Row-level security rules | Only owner and admin viewer can read; only owner can write |
| Hosting of the app | Any static host with HTTPS | PWA is static files |

## 3. Modules (folder layout)

```
src/
  app/            routes, layout, bottom nav, banner (saved on phone / online)
  features/
    pin/          PIN screen, hashing, auto-lock
    bill/         New Bill form, Check Bill, save, cancel
    log/          Customer Log, search, filters
    home/         Today summary, latest bills
    reports/      month report, weekly bars, popular services, GST summary
    export/       Excel and PDF builders
    settings/     parlour details, price list, PIN change, backup now
  domain/
    money.ts      paise helpers, rupee formatting (Indian style)
    gst.ts        value without GST, CGST, SGST for products
    totals.ts     services total, products total, discount, grand total
    numbering.ts  next bill number
    validation.ts Zod schemas
  data/
    db.ts         Dexie schema (phone database)
    repo.ts       read and write functions used by features
    sync.ts       push unsynced rows, pull changes since last sync
    auth.ts       sign-in, role
  ui/             buttons, inputs, pills, cards (see DESIGN.md)
tests/            unit tests for domain/ and sync
```

Rule: screens call `domain/` for every calculation and `data/repo.ts` for every read or write.

## 4. Data model

Money is stored in paise (integers). Every table has `id` (UUID), `created_at`, `updated_at`. The same tables exist on the phone and online (online rows also carry `owner_id`).

| Table | Key fields |
| --- | --- |
| settings | parlour_name, address, phone, gstin, logo, pin_hash, next_bill_number |
| services | name, price_1, price_2, price_3, label_1, label_2, label_3, active, sort_order |
| customers | name, phone (unique), first_visit, last_visit, visit_count |
| bills | bill_number, billed_at, customer_name, customer_phone, services_total, products_total, products_taxable, cgst, sgst, discount, grand_total, payment_mode (cash or upi), status (active or cancelled), cancel_reason, synced_at |
| bill_items | bill_id, kind (service or product), name, price_option (1, 2, 3 or empty), unit_price, quantity, gst_rate (5, 12, 18 or empty), taxable_value, gst_amount, line_total |

Rows are never deleted. A cancelled bill has status cancelled.

## 5. Billing flow in code

1. Form collects customer, service lines, product lines, discount, payment mode.
2. `validation.ts` checks the form.
3. `gst.ts` and `totals.ts` compute all amounts in paise.
4. `numbering.ts` takes the next bill number.
5. `repo.ts` writes the bill and its items to the phone database in one transaction and marks them unsynced.
6. `sync.ts` is triggered; it pushes when online.

## 6. Sync

1. Push: send all rows where `synced_at` is empty, each with its own UUID. The server upserts by UUID, so repeats are safe.
2. Pull: ask for rows with `updated_at` after the last sync time; apply them to the phone database.
3. Triggers: after each bill, when the app opens, when the phone comes back online, and every few minutes while open.
4. Conflicts: one biller phone, so the phone wins for bills. Settings and price list use the latest `updated_at`.
5. Banner shows the number of unsynced bills.

## 7. Security

| Item | Design |
| --- | --- |
| App lock | 4 digit PIN, stored hashed with salt; 3 wrong tries wait 30 seconds; auto-lock on close or 5 minutes idle |
| Accounts | owner (read and write), admin viewer (read only) |
| Database rules | Reject any request from other accounts; viewer cannot insert or update |
| Transport | HTTPS only |
| Backup | Nightly scheduled job saves a full copy of all bills as a file; Backup now in Settings downloads an Excel file |
| Privacy | Only name and phone collected |

## 7a. Admin view

Same app. After sign-in, the role decides what is shown. Viewer sees Today, Log and Reports with no New Bill, Cancel or Settings edit buttons.

## 8. Reports and exports

- Reports are computed on the phone (and in the admin app) from active bills only.
- Excel: sheets Bills, Items, GST summary (value without GST, CGST, SGST per rate).
- PDF: one-page month summary plus a bill list.

## 9. Offline behaviour

Service worker caches the app files. All reads and writes use the phone database. The app opens and bills with no internet. Only sign-in, sync and admin view need internet.

## 10. Risks and notes

| Risk | Handling |
| --- | --- |
| Phone lost before sync | Banner shows waiting bills; nightly backup covers synced data |
| Wrong GST treatment of discounts | Confirm with accountant before launch |
| Browser clears site data | Install as PWA; ask for persistent storage; sync often |
| Two phones billing | Add per-phone bill number prefix |
| Rounding differences | Decide paise vs nearest rupee; keep all maths in domain/ |
