# DESIGN: Parlour Billing App

Mobile-first, one hand, plain English. Mockup canvas: https://claude.ai/artifact/3UASqBXJnoheWvhqGJMz5p

## 1. Principles

Each rule below is backed by a named UX law. Section 9 lists all of them, with the
place in the app where each one lives, so a change can be checked against the law it
is serving.

1. **Few steps.** A bill is one screen, then a check screen.
2. **Big and clear.** Buttons at least 48 px tall, body text at least 16 px, key numbers 24 px or larger.
3. **Plain words.** Short labels: "Make New Bill", "Paid by", "Total to pay". No heavy terms.
4. **Always show the total.** It stays at the bottom while she works.
5. **Always show safety.** A banner says Saved on phone or Saved online.
6. **Main action at the bottom**, within thumb reach.

## 2. Colours

| Role | Hex | Use |
| --- | --- | --- |
| Background | #FFF7F4 | App background |
| Surface | #FFFFFF | Cards, inputs |
| Ink (plum) | #4A1D3D | Text, selected pills, summary cards |
| Accent (rose) | #B83A62 | Main button, active nav, links |
| Muted text | #6B5560 | Labels, small text |
| Soft text on plum | #F3DCE3 | Labels on dark cards |
| Border | #EFE0E3 | Card borders |
| Input border | #D9C3C9 | Inputs and unselected pills |
| Bar track | #F3E6E9 | Empty part of a progress bar |

Contrast: text on background and on cards is above 4.5:1. Do not use colour alone to show a selected option; selected pills are also filled dark.

## 3. Type

Font: Nunito (400, 600, 700, 800), fallback system-ui.

| Use | Size and weight |
| --- | --- |
| Screen title | 24 to 26 px, 800 |
| Big money number | 36 to 40 px, 800 |
| Section title | 18 px, 800 |
| Body and buttons | 16 to 18 px, 600 to 800 |
| Small labels | 13 to 14 px, 600 to 700 |

Money uses the Indian style: ₹ 1,74,000. Negative discount shows as − ₹ 50.

## 4. Spacing and shape

- Screen side padding 20 px, gap between blocks 14 to 20 px
- Card radius 14 to 20 px, button radius 12 to 18 px, pills 12 px
- Bottom navigation 76 px tall, 4 items

## 5. Components

| Component | Spec |
| --- | --- |
| Main button | Rose fill, white text, 56 to 64 px tall, 18 px radius |
| Secondary button | White or transparent, 1.5 px plum border, 52 to 54 px tall |
| Price pill | 48 px tall, 3 per row. Selected: plum fill, white text. Unselected: white, light border. Shows ×2 when tapped twice |
| Choice pill (GST, Cash or UPI) | 48 to 52 px tall, same selected style |
| Input | 52 px tall, 12 px radius, 1.5 px border, label above, 18 px text |
| List row (bill) | White card, name and amount on top line, phone, time and mode under it, services last |
| Summary card | Plum fill, white text, inner chips with 12% white fill |
| Bottom nav | Home, New Bill, Log, Reports. Active item in rose |
| Banner | Small line: Saved on phone (n waiting) or Saved online |
| Notice | One line plus optional title, inside a card. Ok: plum fill, white text. Error: rose text on rose 5% fill, `role="alert"`. Always has a 48 px dismiss ×. One notice per place, never a bare small print line |
| Step rail | Four 6 px segments under the New Bill title, one per numbered part, rose when done, plus "Next: Services" or "Ready to check" |

## 6. Screens

1. **PIN lock.** Plum background, parlour name, 4 dots, large round keypad 3 by 4.
2. **Home.** Date and parlour name; summary card (Today's Money, customers, Cash, UPI); Make New Bill button; Latest Bills; bottom nav.
3. **New Bill.** Back arrow and title; steps 1 Customer, 2 Services, 3 Products, then Discount and Paid by; fixed bottom bar with Total to pay and Make Bill.
4. **Check Bill.** Bill card: parlour name, address, phone, GSTIN, bill number, date, customer, services, products with GST breakup, discount, total, paid by. Buttons: Save Bill, Change something.
5. **Customer Log.** Search, filters Today, This week, This month, day total, list of bill rows.
6. **Reports.** Month picker, summary card, Income each week (bars), Most popular services (bars), GST on products, Download Excel and Download PDF.
7. **Settings** (no mockup yet). Parlour details, GST number, logo, service list with 3 prices, change PIN, Backup now.

## 7. Copy rules

- Use "Make New Bill", "Save Bill", "Change something", "Paid by", "Total to pay", "Cash", "UPI".
- One idea per sentence, under 8 words where possible.
- Required fields end with * and say why when it is not obvious.
- Error messages say what to do: "Type a 10 digit phone number".
- Sample data in mockups only; real names and prices come from Settings.

## 8. Accessibility

- Real buttons, links and inputs with labels
- Icon-only buttons carry an accessible name (for example "Go back", "Lock app")
- Phone and money fields open the number keypad
- Minimum touch target 48 px
- Works in portrait on small Android screens (about 360 px wide)
- Keyboard focus is always visible (rose ring), and press, busy and saved states are announced

## 9. UX laws this app follows

All twenty are in force. The table says what each one means **in this app** and where
to look; a screen that breaks a row is a bug.

| Law | What it means here | Where it lives |
| --- | --- | --- |
| Aesthetic-usability | Clean, calm, consistent screens make the app feel easy, so mistakes feel rarer. Soft rose background, white cards, Nunito, one accent, no clutter. | Whole app; colours 2, type 3, shape 4 |
| Hick's law | Fewer choices at once means a faster decision. Four bottom tabs, two payment modes, three GST rates, three prices per service. Services are searchable once the list passes six, so it is never one long wall of prices. | Bottom nav, New Bill services, GST pills |
| Fitts's law | Big targets close to the thumb. Main action 56 to 64 px at the bottom; every tap target at least 48 px, including row deletes and the notice dismiss; the whole bill row is one target, not just the name. | Components 5, New Bill bottom bar, Check Bill buttons |
| Jakob's law | Use what Android users already know: bottom tabs, back arrow, phone keypad on number fields, a card that looks tappable is tappable. No invented gestures. | Navigation, inputs, list rows |
| Miller's law | Group what belongs together and keep groups small: four numbered parts, four latest bills, today / week / month, Cash and UPI side by side. | New Bill steps, Home, Bills filters |
| Doherty threshold | Every tap answers at once. Press states (`active:scale`, `active:bg-track`), "Saving…" on the save button, the button disabled while it works, and Home shows the result the moment it returns. | Check Bill save, Home banner, all buttons |
| Proximity | Things that belong together sit together: label above its input, hint under it, the × at the end of its own row, totals directly under the lines they add up. | Fields, bill rows, Check Bill totals |
| Similarity | Same look means same job. All secondary buttons are the one kit button, all choices are pills, all money is plum-on-white the same way. No one-off restyled buttons on a screen. | `ui/kit.tsx` used everywhere |
| Common region | A card means "these belong together": customer details, each service, each product line, each totals block. Never split related fields across cards. | Cards 5, Settings sections |
| Visual hierarchy | One biggest thing per screen: the screen title, then the money, then the rest. Total to pay is always 24 px or more and never competes with a label. | Type 3, Home summary, New Bill bottom bar |
| Progressive disclosure | Show the next decision, not all of them. Optional price names stay folded behind "Name the prices"; the GST breakup only appears on the check screen; only four latest bills show until "See all". | Settings price list, Check Bill, Home |
| Recognition > recall | Never make her remember a number or a name. Prices are tappable pills, the phone number fills the name of a known customer, the total is always on screen, and a saved bill is confirmed with its number and amount. | New Bill, Home |
| Von Restorff | The one thing that matters stands out. The total, the save button and a success notice are the only plum-filled blocks; everything else stays light so they cannot be missed. | Summary card, bottom bar, Notice ok |
| Peak-end rule | The last moment is the one remembered. Saving ends on Home with "Bill 0007 saved", the amount and the customer name, and a × to clear it. Errors are the one red block and say what to do next. | Home saved notice, New Bill error notice |
| Goal-gradient | Progress is visible, so finishing feels close. The step rail fills as Customer, Services, Products and Paid by are completed and names the next part. | New Bill step rail |
| Serial position | First and last are remembered best. The safety line and today's money come first; the total and the main action are last, in thumb reach; new bills sit at the top of every list. | Home, New Bill, Bills |
| Tesler's law | The app absorbs the hard part: GST split, CGST and SGST, bill numbering, phone clean-up, the draft surviving back and Change something, backup. She only answers simple questions. | `domain/`, draft store, backup |
| Postel's law | Be strict in what is saved, generous in what is accepted. "98765 43210", "+91 98765 43210", "Rs. 450", "₹ 1,200", "450." all land correctly; the saved value is still 10 digits and whole paise. | `domain/phone.ts`, `domain/money.ts` |
| Occam's razor | One way to do a thing. One main button per screen, one notice per place, one shared kit, no duplicate call to action in an empty state. | Whole app |
| Feedback loops | Every action answers, and every state is visible: press, saving, saved, error, empty, loading, busy. A message can be dismissed and never silently disappears; a failure never closes on itself. | Notice, button disabled states, empty states |
