# DESIGN: Parlour Billing App

Mobile-first, one hand, plain English. Mockup canvas: https://claude.ai/artifact/3UASqBXJnoheWvhqGJMz5p

## 1. Principles

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
| Price pill | 46 px tall, 3 per row. Selected: plum fill, white text. Unselected: white, light border |
| Choice pill (GST, Cash or UPI) | 44 to 52 px tall, same selected style |
| Input | 52 px tall, 12 px radius, 1.5 px border, label above, 18 px text |
| List row (bill) | White card, name and amount on top line, phone, time and mode under it, services last |
| Summary card | Plum fill, white text, inner chips with 12% white fill |
| Bottom nav | Home, New Bill, Log, Reports. Active item in rose |
| Banner | Small line: Saved on phone (n waiting) or Saved online |

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
