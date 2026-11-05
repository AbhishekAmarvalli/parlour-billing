# MEMORY: Parlour Billing App

Project context for anyone (or any AI assistant) who picks this up. Read this first, then PRD.md, RULES.md, ARCHITECTURE.md, DESIGN.md, WORKFLOW.md.

Last updated: 5 Nov 2026

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
- **APK v1.5.0 built** (5 Nov 2026): the UX laws pass is inside the APK — step rail on New Bill, service search, folded price names, one dismissible Notice for every message (save errors no longer swallowed), saved-bill confirmation with number, amount and name, 48 px targets, and money fields that accept "Rs. 450"/"INR 1,200". `versionCode 6`, `versionName 1.5.0`, APK at repo root: `ParlourAdmin-v1.5.0.apk`. Built with the local JDK 21 (`.build-tools/jdk21/jdk-21.0.13+9`, was an unextracted zip; JDK 25 fails Gradle's Groovy step) and local Gradle 8.14.3 with `--offline`.
- **APK v1.4.0 built** (2 Nov 2026): WhatsApp **share target** — sharing a contact card (vCard) or a plain number to *Parlour Admin* opens a new bill with name and number filled. Pulled (not pushed) so a share that arrives at the PIN screen still opens after unlock. `singleTask` launch mode; accepts `text/plain` and `text/vcard`.
- **APK v1.3.0 built** (2 Nov 2026): adds customer lookup — **Pick from contacts** (system contact picker, name + mobile into the bill) and **Paste number** (a number copied from a WhatsApp chat). The app cannot read WhatsApp's private database; the contact list holds the same numbers WhatsApp uses. All of v1.2.0 below still applies. APK: `ParlourAdmin-v1.3.0.apk`.
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
- 2 Nov 2026: v1.3.0 — customer contacts: pick from the phone's contact list, or paste a number copied from WhatsApp. GitHub release v1.3.0 created.
- 2 Nov 2026: v1.4.0 — share-to-app target from WhatsApp opens a new bill.
- 5 Nov 2026: UX laws pass (DESIGN.md 9). All twenty named laws are now written down with the place each one lives: New Bill shows a step rail and a service search, optional price names fold away in Settings, all feedback uses one dismissible Notice (save errors are no longer swallowed), a saved bill ends with its number and amount on Home, every target is 48 px, and money boxes accept "Rs. 450" / "₹ 1,200".
