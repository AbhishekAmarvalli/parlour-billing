# WORKFLOW: Parlour Billing App

How the app is used day to day, and how it is built and released.

## Part A: Usage workflows

### A1. Daily routine

1. Open the app, type PIN.
2. Home shows today's money and customers so far.
3. For each customer: Make New Bill (A2).
4. End of day: look at Home for the day's total and the Cash and UPI split.

### A2. Make a bill (the main flow)

1. Tap **Make New Bill**.
2. Type customer **name** and **phone** (10 digits). If the phone was seen before, the name fills in.
3. Under **Services**, tap one of the 3 prices for each service. Tap again for a second person, or remove it.
4. Under **Products** (if sold): type product name, type the price with GST included, tap 5%, 12% or 18%. Add more products if needed.
5. Type **Discount** in rupees if any (flat).
6. Choose **Paid by**: Cash or UPI.
7. Check the **Total** at the bottom, tap **Make Bill**.
8. On **Check Bill**, read the bill. Tap **Save Bill**, or **Change something** to go back.
9. The bill is saved on the phone with the next bill number. Nothing is sent to the customer.

```
Home → New Bill → Check Bill → Save Bill → Home
                        └── Change something → New Bill
```

### A3. Cancel a wrong bill

1. Open **Log**, find the bill (search by name or phone).
2. Open it, tap **Cancel bill**, give a short reason.
3. The bill stays in the log marked Cancelled. It keeps its number and is left out of all totals and reports.

### A4. Edit the price list

1. Settings → Services.
2. Add a service, or edit its 3 prices (and names for them).
3. Hide a service that is no longer offered. Old bills stay unchanged.

### A5. When the internet is off

1. She bills as normal. Banner says **Saved on phone** and shows how many bills are waiting.
2. When internet returns, the app syncs in the background. Banner changes to **Saved online**.
3. The admin view catches up after this.

### A6. Month end

1. Reports → choose the month.
2. Check income, products, GST collected.
3. Tap **Download Excel** and **Download PDF**.
4. Send the files to the accountant.

### A7. Admin viewer

1. Sign in with the admin account on the admin's phone.
2. See Today, Log and Reports. No billing or editing buttons.

### A8. New phone or lost phone

1. Install the app on the new phone, sign in once.
2. All synced bills return. Bills not yet synced on the old phone may be missing.
3. Remove the old phone's access from the admin account if it was lost.

## Part B: Build workflow

### B1. Phases

| Phase | Scope | Done when |
| --- | --- | --- |
| 1 | Billing on phone: PIN, price list, New Bill, Check Bill, Save Bill, Home, Log, offline storage | 10 real bills in a row, totals match paper |
| 2 | Sign-in, sync, admin read-only view, nightly backup | Offline bill shows in admin view after reconnect |
| 3 | Reports, Excel, PDF, GST summary | Month figures match the log; accountant opens the Excel |
| 4 | Later ideas | Chosen after weeks of real use |

### B2. Per-feature loop

1. Read the rule in RULES.md and the acceptance criteria in PRD.md.
2. Check the screen in DESIGN.md.
3. Write the logic first (money and GST functions) with tests.
4. Build the screen.
5. Test offline (airplane mode) and on a real Android phone.
6. Compare with a paper bill.

### B3. Release

1. Test on her own phone in the parlour for a few days beside paper bills.
2. Fix mismatches, then switch to the app alone.
3. Deploy updates to the web address; the installed app updates itself the next time it opens with internet.

### B4. Definition of done for any change

- Totals and GST tests pass
- Works offline
- Buttons at least 48 px, text at least 16 px
- No new term in the screens that is not plain English
- MEMORY.md updated if a decision changed
