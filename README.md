# BTK Coffee — Website \& Online Ordering System

**Brewed to Brighten Your Day.**

A complete, static, mobile-first website and Messenger-assisted ordering system for BTK Coffee.
Built with **HTML5, CSS3, and vanilla JavaScript only** — no frameworks, no build step, no backend.

\---

## 1\. Project folder structure

```
btk-coffee/
├── index.html          # All page markup: nav, hero, featured, menu, story, how-to-order,
│                       # find us, footer, cart drawer, option modal, checkout modal
├── style.css           # Design tokens (khaki/cream/ivory), layout, components, responsive,
│                       # accessibility + reduced-motion + print styles
├── script.js           # Menu data, rendering, filters, search, cart, checkout, order summary
├── README.md           # This file
└── assets/             # (recommended) local brand + product images
    ├── logo.png            # BTK Coffee logo — replaces the inline "BTK" SVG mark
    ├── favicon.png         # 512×512 version of the logo
    ├── og-image.jpg        # 1200×630 social sharing image
    ├── menu-reference.jpg  # Photo/scan of the printed menu, for staff reference
    └── products/           # 600×450 product photos, e.g. spanish-latte.jpg, java-chip.jpg
```

### Using your own images

1. Create the `assets/` folders above and drop in your files.
2. In `script.js`, replace the values in the `IMG` object near the top:

```js
   const IMG = {
     spanish: 'assets/products/spanish-latte.jpg',
     // ...
   };
   ```

3. In `index.html`, swap the inline `<span class="brand-mark">…</span>` SVG for
`<img src="assets/logo.png" alt="BTK Coffee logo" class="brand-img">` (header and footer),
and point the `<link rel="icon">` / Open Graph `og:image` tags at your real assets.
The logo image is never stretched — `.brand-img` keeps its aspect ratio.

\---

## 2\. Run it locally

**Option A — just open it**
Double-click `index.html`. Everything works except the Clipboard API on some browsers
(which needs a secure context); the built-in manual-copy fallback handles that case.

**Option B — local server (recommended)**

```bash
# Python 3
python3 -m http.server 8080
# then visit http://localhost:8080
```

or use the VS Code **Live Server** extension.

\---

## 3\. Deploy to GitHub Pages

1. Create a repository (e.g. `btk-coffee`) and push the three files plus `assets/`:

```bash
   git init
   git add .
   git commit -m "BTK Coffee website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/btk-coffee.git
   git push -u origin main
   ```

2. On GitHub: **Settings → Pages → Build and deployment**

   * Source: **Deploy from a branch**
   * Branch: `main`, folder: `/ (root)` → **Save**
3. Your site goes live at `https://<your-username>.github.io/btk-coffee/` in \~1 minute.

It also deploys as-is to Netlify, Vercel, Cloudflare Pages, Firebase Hosting, or any static host —
just drag the folder in. No environment variables, no build command.

\---

## 4\. Updating the menu

Every product, size, and price lives in **one array** in `script.js`:

```js
{ id: 'cof-spanish-latte', cat: 'coffee', name: 'Spanish Latte', img: IMG.spanish, featured: true,
  desc: 'Sweet, creamy and rich — a BTK house favorite.',
  sizes: \[{ label: '12 oz', price: P(89) }, { label: '16 oz', price: P(99) }] }
```

* `P(89)` converts pesos to **centavos (8900)**. All money math is integer-based, so there are
no floating-point rounding errors.
* Add/remove entries in `MENU`, and the featured grid, category tabs, counts, search, and footer
category links all update automatically.
* Featured cards are controlled by the `FEATURED\_ORDER` array.
* Fees live in `CONFIG`: `serviceFeeCentavos: 0` (none charged) and
`deliveryFeeCentavos: null` (**unknown → displayed as "To be confirmed"**).
Set a number there only once the business confirms a real fee.

\---

## 5\. How the Messenger order workflow works (and its limits)

A static site has **no backend**, so it genuinely cannot:

* take or process payments,
* write orders into a private business database,
* send a message to Messenger on the customer's behalf,
* or sync orders across devices.

So the site implements an honest, practical workflow instead:

1. The customer builds a cart and fills in the checkout form (validated client-side).
2. On **Place Order**, the site generates a human-readable reference — `BTK-YYYYMMDD-XXXX` —
and a complete plain-text order summary.
3. The summary is saved to `localStorage` under `btk\_last\_order\_v1` with the status
`pending-confirmation`. The UI states plainly that this is a **browser-local record, not a
server-side order record**.
4. **Copy Order Summary** uses `navigator.clipboard.writeText()`, falling back to
`document.execCommand('copy')` and then to selecting the text for manual `Ctrl/⌘+C`
if clipboard permission is denied or the page isn't on HTTPS.
5. **Continue to Messenger** opens `https://m.me/btkcoffeeeee` in a new tab
(`target="\_blank" rel="noopener noreferrer"`). The customer pastes and sends.

> The site deliberately does \*\*not\*\* rely on undocumented `m.me` prefill parameters —
   > Messenger does not guarantee them, so claiming a prefilled message would be misleading.

6. Every screen states that the order is **a request awaiting confirmation**. Nothing is ever
marked "confirmed". Availability, the final total, fees, hours, delivery coverage, and payment
methods are all explicitly listed as things BTK Coffee confirms in the chat.

\---

## 6\. Tested functionality checklist

|#|Check|Status|
|-|-|-|
|1|Page loads with no console errors|✅|
|2|All 37 menu items match the supplied menu (names, categories, sizes, prices)|✅|
|3|Single-price items expose exactly one option; no sizes invented|✅|
|4|Multi-size items **require** a size choice before adding (inline error otherwise)|✅|
|5|Category tabs and search work **together** (filter is combined)|✅|
|6|Empty-results state appears with a working "Reset filters" button|✅|
|7|Add to cart from featured, full menu, and recently-viewed|✅|
|8|Same drink in two sizes = two distinct cart lines|✅|
|9|Quantity +/− updates line total, subtotal, badge, and mobile bar instantly|✅|
|10|Decreasing below 1 removes the line; negative quantities impossible|✅|
|11|Remove item and Clear cart (with confirm) work|✅|
|12|Totals use integer centavos — no floating-point drift|✅|
|13|Cart survives refresh; stored data is re-validated against the live menu|✅|
|14|Corrupt/tampered localStorage is discarded safely, prices re-read from `MENU`|✅|
|15|"Cart restored" notice + toast shown on reload|✅|
|16|Checkout blocks empty carts|✅|
|17|Name required; PH mobile validated (`09…`, `+639…`, `639…`, spaces/dashes tolerated)|✅|
|18|Delivery address required **only** for Delivery; field hides for Pickup|✅|
|19|Failed validation never clears the cart or the form entries|✅|
|20|Review step shows items, sizes, qty, unit price, line totals, fees, estimated total, details|✅|
|21|"Edit Details" and "Edit Cart" return without losing data|✅|
|22|Unique `BTK-YYYYMMDD-XXXX` reference generated (crypto-backed when available)|✅|
|23|Copy Order Summary works; manual-select fallback when clipboard is blocked|✅|
|24|Messenger link opens `m.me/btkcoffeeeee` in a new tab|✅|
|25|Google Maps link opens the supplied pin in a new tab|✅|
|26|Order never shown as confirmed — "awaiting confirmation" everywhere|✅|
|27|Print / Save as PDF produces a clean summary sheet only|✅|
|28|Mobile hamburger opens/closes (button, scrim, link click, Escape)|✅|
|29|Cart drawer is full-width on mobile, slide-out on desktop|✅|
|30|No horizontal overflow at 320px, 375px, 768px, 1024px, 1440px|✅|
|31|Keyboard: focus trap in modals/drawer, Escape closes, visible focus rings|✅|
|32|`prefers-reduced-motion` disables animations and smooth scroll|✅|
|33|Images lazy-loaded with descriptive alt text; hero image prioritised|✅|
|34|Dynamic copyright year|✅|
|35|Works entirely on static hosting, no backend, no framework|✅|

\---

## 7\. localStorage keys used

|Key|Contents|
|-|-|
|`btk\_cart\_v1`|`\[{ id, size, qty }]` — prices are **never** trusted from storage|
|`btk\_recent\_v1`|Up to 8 recently viewed product IDs|
|`btk\_last\_order\_v1`|`{ ref, summary, status: 'pending-confirmation', createdAt, total }`|

All reads are wrapped in `try/catch`, so private-browsing modes that block storage degrade
gracefully instead of throwing.

\---

## 8\. Honest-content policy applied

The site contains **no** invented awards, certifications, branch counts, customer counts,
reviews, ratings, testimonials, founding dates, founder names, ingredients, allergen claims,
prep times, delivery times, delivery coverage, delivery fees, payment methods, or social profiles.
The only contact points are the supplied Messenger and Google Maps links, and the Our Story text
is reproduced as provided.

\---

© BTK Coffee — Brewed to Brighten Your Day.

