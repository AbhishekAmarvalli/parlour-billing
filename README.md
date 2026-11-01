# Parlour Billing — Android APK

One app, one phone, no internet needed. The owner **is** the admin: she makes every bill on
her phone, the app stores it locally, and only this phone holds the data. Reports and Excel/PDF
files can be made any time.

Built from the plan in `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md` and `RULES.md`.

## What is in the app (v1.2.0)

| Screen | What it does |
| --- | --- |
| **PIN lock** | First launch makes a 4 digit PIN (stored hashed, 3 wrong tries wait 30 seconds, auto-lock after 5 minutes idle) — PRD F1 |
| **Home** | Today's money, customers, Cash/UPI split, latest bills — PRD F6 |
| **New Bill** | Name + 10 digit phone (old customers fill in), tap a service price, add products with typed price and GST 5/12/18, flat discount, Cash or UPI, total always visible — PRD F3 |
| **Check Bill** | Full bill with GST breakup before saving; Save Bill / Change something — PRD F4 |
| **Save & numbering** | Saved to the phone at once, numbers 0001, 0002 with no gaps — PRD F5 |
| **Customer Log** | Search name or phone, Today / This week / This month, open any bill — PRD F7 |
| **Cancel a bill** | Keeps its number, stays in the log, leaves every total (with a reason) — RULES A6 |
| **Reports** | Month income, services/products, Cash/UPI, weeks, popular services, GST on products — PRD F11 |
| **Export** | Excel (Bills, Items, GST summary) and PDF (summary + bill list), saved to the phone's **Downloads** — PRD F12 |
| **Settings** | Parlour details and GSTIN, the whole price list (3 prices per service, hide services), change PIN, Backup now, open a backup file — PRD F2, F13 |

Everything works in airplane mode. Money is stored in paise (integers), all GST and total maths
is in `admin-app/src/domain/` with unit tests, and bills are never deleted — only cancelled.

## Install

Copy **`ParlourAdmin-v1.2.0.apk`** (repo root) to an Android phone and open it. Allow
"install from unknown sources" when asked. Android 7.0+ (minSdk 24).

## Try the exports

1. Make a couple of bills (New Bill → Make Bill → Save Bill).
2. Open **Reports**, move to the month you want.
3. Tap **Download Excel** or **Download PDF** — the file lands in the phone's **Downloads** folder.
   The accountant can open the Excel (sheets: Bills, Items, GST summary).

`sample-backup.json` (repo root) is demo data: **Settings → Open a backup file** to load it.
`node admin-app/scripts/make-sample.mjs` regenerates it.

## Backup file format

**Backup now** writes this JSON; **Open a backup file** reads it back. Importing the same file
twice is safe — rows are keyed by UUID, so nothing duplicates (RULES B2).

```json
{
  "app": "parlour-billing",
  "version": 1,
  "exported_at": 1793529600000,
  "settings": { "id": "uuid", "parlour_name": "...", "address": "...", "phone": "...", "gstin": "...", "next_bill_number": 509, "updated_at": 0 },
  "services": [ { "id": "uuid", "name": "Haircut", "price_1": 45000, "price_2": 65000, "price_3": 80000, "active": true, "sort_order": 0, "updated_at": 0 } ],
  "customers": [ { "id": "uuid", "name": "...", "phone": "9876543210", "first_visit": 0, "last_visit": 0, "visit_count": 1, "updated_at": 0 } ],
  "bills": [ { "id": "uuid", "bill_number": 1, "billed_at": 0, "customer_name": "...", "customer_phone": "9876543210",
               "services_total": 0, "products_total": 0, "products_taxable": 0, "cgst": 0, "sgst": 0,
               "discount": 0, "grand_total": 0, "payment_mode": "cash", "status": "active", "created_at": 0, "updated_at": 0 } ],
  "bill_items": [ { "id": "uuid", "bill_id": "uuid", "kind": "service", "name": "Haircut", "price_option": 1,
                    "unit_price": 45000, "quantity": 1, "taxable_value": 0, "gst_amount": 0, "line_total": 45000 } ]
}
```

All money in **paise** (integers). Products also carry `gst_rate` (5, 12 or 18),
`taxable_value` and `gst_amount`.

## Project layout

```
admin-app/          React + TypeScript + Tailwind + Dexie + Zod web app (ARCHITECTURE.md stack)
  src/domain/       money, GST, totals, numbering, draft, validation, reports — all maths, with tests
  src/data/         Dexie (IndexedDB) schema, save/cancel/settings writes, backup export + import
  src/features/     pin, bill, home, log, reports, settings, export screens
  tests/            vitest unit tests (RULES B6.3)
android/            WebView wrapper that ships the built web app inside the APK
  app/src/main/assets/   copy of admin-app/dist (rebuilt below)
  tools/make-icon.mjs    generates the launcher icons
sample-backup.json  demo data
.build-tools/       local JDK + Android SDK used to build (not part of the app, git-ignored)
```

The WebView loads the bundle through `WebViewAssetLoader` as
`https://appassets.androidplatform.net/…`, which gives it a normal secure origin so
IndexedDB, localStorage and crypto work exactly like in a browser. A small Java bridge
(`MainActivity.AndroidBridge`) writes exported files into the phone's Download folder.

## Rebuild

```bash
# 1. Web app
cd admin-app
npm install
npm test              # domain tests (GST, totals, numbering, cancel, validation, SHA-256)
npm run build

# 2. Copy into the APK
rm -rf ../android/app/src/main/assets/*
cp -r dist/* ../android/app/src/main/assets/

# 3. APK (needs JDK 17+ and the Android SDK; local ones live in .build-tools/)
cd ../android
./gradlew assembleDebug assembleRelease
```

With any JDK 17+ and the Android SDK installed, point Gradle at them:

```bash
export JAVA_HOME=/path/to/jdk-21
export PATH="$JAVA_HOME/bin:/path/to/gradle-8.14.3/bin:$PATH"
```

`android/local.properties` points `sdk.dir` at `.build-tools/android-sdk`.
Launcher icons: `node android/tools/make-icon.mjs`.

## Notes

- Data never leaves the phone. Online sync to a second phone (PRD F9/F10) is not built yet;
  the monthly backup file is the way to copy data to another phone or keep it safe.
- The PDF writes money as "Rs 1,74,000" because the standard PDF font has no ₹ sign.
  Excel keeps real numbers (rupees with paise) for the accountant.
