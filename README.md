# KashRun — Customer Storefront

Kashmir-focused marketplace. Vanilla HTML/CSS/JS + Supabase. Deployable free on GitHub Pages.

## What's built (this pass)

Full customer flow: `index.html`, `products.html`, `category.html`, `search.html`,
`product.html`, `cart.html`, `checkout.html`, `login.html`, `signup.html`,
`account.html`, `orders.html`, `order-details.html`, `wishlist.html`, plus
all `js/*.js` files.

Each HTML file carries its own `<style>` block (no shared `css/style.css`) —
copy-paste/upload-friendly, single-file-per-page. The design system tokens
are identical across all of them, so if you tweak a color or the type scale,
update it in every file's `<style>` block (or find-and-replace across the
project).

**Not yet built:** `seller/*` and `admin/*` (the spec explicitly says to do
customer pages first). Say the word and I'll build those next, following the
same design system and Supabase tables.

## Before you deploy

1. **Add your logo.** Drop the real file at `assets/logo.png` (referenced
   everywhere — header, footer favicon, etc.). If it's missing, the `<img>`
   quietly hides itself rather than showing a broken-image icon.

2. **Run the order-placement SQL once.** Open the Supabase SQL editor and run
   `sql/place_order.sql`. This creates a `place_order` Postgres function that
   re-checks `serviceable_pincodes` **on the server** before an order is ever
   created — the spec is explicit that PIN enforcement can't live in
   JavaScript alone, since anyone can bypass client-side checks. Checkout
   calls this via `sb.rpc('place_order', ...)`.

   ⚠️ I guessed at some column names (`orders.address`, `orders.total_amount`,
   `orders.payment_method`, `order_items.price`, `serviceable_pincodes.pincode`
   /`is_active`) since I don't have your exact schema in front of me — open
   the file and adjust names to match your real tables before running it.

3. **Check `categories.icon` and `.slug`.** The homepage/category pages expect
   an `icon` (emoji or short text) and `slug` column on `categories`. If those
   don't exist, categories will still render — the slug filter falls back to
   the row `id`.

4. **RLS.** Make sure Row Level Security policies let: anyone `select` on
   `products`, `product_images`, `categories`, `serviceable_pincodes`,
   `reviews`; only the owning `user_id` `select`/`insert`/`update` their own
   `cart_items`, `addresses`, `orders`. The `place_order` function runs as
   `security definer` so it can insert into `orders`/`order_items` safely
   even with strict RLS.

## How the pieces fit together

- **Guest cart** lives in `localStorage` (`kr_guest_cart`) so anyone can add
  to cart without an account. On login/signup, `krCartMergeOnLogin()` folds
  it into the real `cart_items` table — nothing is lost.
- **Wishlist** is `localStorage`-only per the spec (no table added).
- **PIN check** (`krCheckPincode` in `js/checkout.js`) queries
  `serviceable_pincodes` live as the user types — this is the friendly UX
  layer. The real gate is the SQL function above.
- Checkout requires login (`krRequireAuth()`); everything before it — browse,
  search, add to cart — works signed out.

## Local testing

Since this is a static site, you can open `index.html` directly in a browser,
or serve it locally (`python3 -m http.server`) to avoid any `file://` quirks
with `fetch`/CORS. Same code works unmodified once pushed to GitHub Pages.
