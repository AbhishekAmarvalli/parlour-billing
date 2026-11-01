# MEMORY: Parlour Billing App

Project context for anyone (or any AI assistant) who picks this up. Read this first, then PRD.md, RULES.md, ARCHITECTURE.md, DESIGN.md, WORKFLOW.md.

Last updated: 1 Nov 2026

## What this is

A mobile admin app for a beauty parlour. The owner makes bills on their Android phone; every visit is stored with customer, services, products, payment and totals. Nothing is sent to customers. The owner can also check reports from the same phone.

## Decisions (as told by the requester)

| Topic | Decision |
| --- | --- |
| Language | English, very simple words, short labels |
| Owner's phone skill | Very comfortable, but keep buttons big |
| Device | Android |
| Internet | Sometimes slow or off, so offline-first |
| Volume | 15 to 30 customers a day |
| Staff | 3 staff, no per-staff tracking needed |
| Service prices | Fixed, 3 price options per service |
| Product prices | Change each time; typed on the bill |
| Payments | Cash and UPI only |
| Discount | Flat rupee amount |
| Bill delivery | **Not sent to the customer.** Bill is stored in the admin app only (changed on 1 Nov 2026 from WhatsApp sending) |
| GST | Registered. Services have no GST. Products carry GST; typed price includes GST; rate differs per product (5, 12 or 18 assumed) |
| Customer details | Name and phone required on every bill (under review now that nothing is sent) |
| Reports wanted | Today's total, monthly income, popular services, product sales and GST |
| Expenses | Later, not now |
| Security and backup | PIN lock, admin viewer account, Excel and PDF export |

## Assumptions made (not stated by the requester)

- GST rates for products are 5, 12 or 18 percent.
- Discount comes off the final total; product GST stays as worked out. Needs accountant confirmation.
- Totals shown to the paise until a rounding choice is made.
- Admin viewer is read-only.
- Backend on a managed PostgreSQL service with login and row-level rules.

## Open questions

1. Phone number still required, or optional?
2. Round to the nearest rupee or show paise?
3. Bill numbers start at 0001 or continue the paper book?
4. Remember frequently sold products (name and GST rate)?
5. Accountant: how should a flat discount affect product GST?
6. Parlour name, address, phone, GSTIN, logo.
7. Full service list with 3 prices each, and names for the 3 prices.
8. Emails for the owner account and the admin account.
9. Who builds version 1: the requester, or Claude builds a first version to share?

## Current state

- Requirements gathered through a question-and-answer round.
- Clickable mockup made (6 screens: PIN, Home, New Bill, Check Bill, Customer Log, Reports). Settings screen not yet drawn.
- Full plan written as a document.
- **APK v1.2.0 built** (2 Nov 2026): one phone, owner = admin, all data stored locally. PIN lock, New Bill, Check Bill, Home, Bills (+cancel with reason), Reports, Excel/PDF export to Downloads, Settings (parlour details, price list, change PIN, backup/restore). v1.2.0 fixes: data refreshes right after a save (no app restart), the draft survives back/Change something, changing the PIN in Settings cannot lock the app, an older backup cannot rewind bill numbers, clearer labels and a receipt launcher icon. Code in `admin-app/` + `android/`. APK at repo root: `ParlourAdmin-v1.2.0.apk`. Demo data: `sample-backup.json`.
- **Published on GitHub** (2 Nov 2026): private repo `AbhishekAmarvalli/parlour-billing`, personal details scrubbed (family references, local paths, sample parlour address/phone/GSTIN).

## Links

- Mockup canvas: https://claude.ai/artifact/3UASqBXJnoheWvhqGJMz5p
- Plan document: https://claude.ai/artifact/FXvFEjDrTJJoBewXr77uea
  (both private until shared from the Share menu)

## File guide

| File | Holds |
| --- | --- |
| README.md | How to build and install the admin APK; backup file format |
| PRD.md | Problem, users, goals, features with acceptance criteria, open questions |
| WORKFLOW.md | How the app is used (daily, bill, cancel, offline, month end) and how it is built |
| DESIGN.md | Colours, type, components, screens, copy and accessibility rules |
| RULES.md | Business rules (GST, totals, numbering, cancelling) and engineering rules |
| ARCHITECTURE.md | Stack, folder layout, data model, sync, security, risks |
| MEMORY.md | This file: decisions, assumptions, open questions, state |

## Conventions to keep

- Money in paise (integers), never floats.
- All maths in one tested domain module.
- Never delete bills; cancel them.
- Plain English labels; buttons at least 48 px; text at least 16 px.
- Works offline; test in airplane mode.
- When a decision changes, update this file in the same change.

## Change log

- 1 Nov 2026: Requirements round completed. Mockup and plan created.
- 1 Nov 2026: Removed WhatsApp bill sending; bills are stored for admin only.
- 1 Nov 2026: Admin APK v1.0.0 built (read-only view, file import for data).
- 1 Nov 2026: Confirmed with the requester: owner is the admin, bills are made and stored on the one phone. v1.1.0 adds New Bill, Check Bill, Settings, cancel and Excel/PDF export; the old Data tab moved into Settings as backup/restore.
- 2 Nov 2026: v1.2.0 after phone testing — clearer screens, receipt icon, and four bug fixes (immediate data refresh, draft kept on back, PIN side-effect in Settings, bill numbers on restore). Published to GitHub (private).
