# PRD: Parlour Billing App

Status: Draft v1 · Last updated: 1 Nov 2026

## 1. Problem

A beauty parlour owner makes handwritten bills for 15 to 30 customers a day. It is slow, totals can be wrong, and there is no easy record of who came, what they got, and what they paid. Monthly income, product sales and GST are hard to work out from paper.

## 2. Users

| User | Role | Device | Needs |
| --- | --- | --- | --- |
| Owner | Makes every bill, edits the price list | Android phone | Fast billing, big buttons, easy English, works when internet is off |
| Admin viewer (family member) | Checks records and reports | Own phone | Read-only view of the log and reports |
| Accountant (indirect) | Receives files | None | Monthly Excel and PDF with GST figures |

The 3 staff members do not use the app. Customers do not receive anything from the app.

## 3. Goals

1. A bill takes under 1 minute to make.
2. Every visit is stored: who came, which services and products, what they paid, how.
3. Today and month totals are always correct and match the log.
4. Product GST is worked out correctly; services carry no GST.
5. Works with slow or no internet. Data is backed up online.

## 4. Non-goals for version 1

- Sending or printing bills for customers (decided: admin-only storage)
- Expense tracking and profit
- Staff-wise tracking and staff logins
- Appointments and bookings
- Card payments, pay-later credit, tips, packages, memberships
- Languages other than simple English

## 5. Features

### P0 (must have)

| ID | Feature | Acceptance criteria |
| --- | --- | --- |
| F1 | PIN lock | 4 digit PIN opens the app. 3 wrong tries lock for 30 seconds. Auto-lock after close or 5 minutes idle |
| F2 | Price list (Settings) | Add, edit, hide services. Each service has 3 fixed prices, with optional names for them |
| F3 | New Bill | Name and 10 digit phone required. Tap a service price. Add products with typed price (GST included) and GST rate 5, 12 or 18. Flat discount in rupees. Pay by Cash or UPI. Total always visible |
| F4 | Check Bill | Shows full bill with GST breakup before saving. Buttons: Save Bill, Change something |
| F5 | Save and numbering | Bill saved on the phone at once. Numbers run 0001, 0002 with no gaps |
| F6 | Home (Today) | Today's money, customers, Cash and UPI split, latest 4 bills, big Make New Bill button |
| F7 | Customer Log | Search by name or phone. Filters: Today, This week, This month. Open any bill. Cancel a bill by mistake |
| F8 | Offline first | Everything above works with no internet |

### P1 (version 1, after core works)

| ID | Feature | Acceptance criteria |
| --- | --- | --- |
| F9 | Online copy and sync | Bills sync when internet is on. No double bills if sent twice |
| F10 | Admin view | Read-only Today, Log and Reports for the admin account |
| F11 | Reports | Month income, services and products split, Cash and UPI, income each week, popular services, product sales and GST |
| F12 | Export | Excel (Bills, Items, GST summary) and PDF (summary and bill list) made on the phone |
| F13 | Nightly backup | Full copy of all bills saved once a night; Backup now button in Settings |

### P2 (later)

Expense tracking and profit, reminders for customers who have not visited, Hindi or Telugu words, staff-wise work, bill printing.

## 6. User stories

- As the owner, I type a customer's name and phone, tap services, and save, so the visit is recorded without writing.
- As the owner, I add a product with its price and GST rate, so GST is shown correctly.
- As the owner, I give a flat discount, so the customer pays the lower total.
- As the owner, I cancel a wrong bill, so totals stay correct and the record remains.
- As the owner, I see today's money at a glance, so I know how the day went.
- As the admin, I open reports on my phone, so I can check the parlour from anywhere.
- As the owner, I download the month's Excel, so my accountant can file GST.

## 7. Success measures

- She makes 10 real bills in a row without help.
- Every total matches her own calculation during a few days of side-by-side testing with paper.
- Bills made offline appear in the admin view after her phone reconnects.
- The accountant can open the Excel file and use the GST summary.

## 8. Constraints

- Android phone, mobile only, one hand use
- Internet is sometimes slow or off
- Services have no GST; products carry GST with the price including GST
- Payments: Cash and UPI only
- Phone and name are required on every bill (to be reviewed, see open questions)

## 9. Open questions

1. Is the phone number still required now that nothing is sent to customers?
2. Show the total to the paise or round to the nearest rupee?
3. Do bill numbers start at 0001 or continue her paper book?
4. Should the app remember products she sells often (name and GST rate)?
5. Accountant ruling: should a flat discount reduce a product's value and GST, or only the final total? Version 1 takes it off the final total.
6. Parlour name, address, phone, GSTIN, logo and the full service list with 3 prices each.
7. Who builds version 1: the requester, or Claude builds a first version to share with her?

## 10. Release plan

1. Billing on the phone (F1 to F8)
2. Online copy and admin view (F9, F10, F13)
3. Reports and files (F11, F12)
4. Later ideas (P2)
