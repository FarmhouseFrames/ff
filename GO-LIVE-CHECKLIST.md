# Farmhouse Frames Go-Live Checklist

This checklist gets www.farmhouseframes.com online with your supplier-link product workflow and order routing.

## 1) Apply Supabase migrations

Run these SQL files in Supabase SQL editor (in order):

1. `supabase/schema.sql`
2. `supabase/policies.sql`

Optional one-command terminal path (after environment setup):

1. Install `psql`
2. Set `SUPABASE_DB_URL` (or `DATABASE_URL`)
3. Run:

```bash
./scripts/apply-supabase-sql.sh
```

This enables:
- supplier metadata on products (`supplier_name`, `supplier_url`)
- public checkout order intake tables (`order_requests`, `order_request_items`)
- admin-only management with public insert for storefront checkout

## 2) Confirm admin allowlist

In Supabase, insert your auth user ID into `public.admin_users`.

Example:

```sql
insert into public.admin_users (user_id)
values ('YOUR_AUTH_USER_UUID')
on conflict do nothing;
```

## 3) Publish to GitHub Pages

1. Push branch to `main` after review.
2. In GitHub repo settings:
   - Pages source: `Deploy from a branch`
   - Branch: `main` and `/ (root)`
3. Confirm custom domain is set to `www.farmhouseframes.com`.

## 4) DNS setup for www domain

At your DNS provider:

1. Create CNAME record:
   - Host: `www`
   - Value: `FarmhouseFrames.github.io`
2. Optional apex support (`farmhouseframes.com`):
   - add URL redirect from apex to `https://www.farmhouseframes.com`

## 5) Test complete workflow

1. Admin login at `/dashboard/login.html`
2. In Admin > Products:
   - create product with supplier name/link and retail price
3. On storefront, add item to cart and checkout.
4. Verify order appears in Admin > Orders (`order_requests`).
5. Update status through fulfillment stages (`new` -> `ordered` -> `received` -> `ready` -> `completed`).

## 6) Daily operational flow

1. Add/edit products with supplier links in Admin.
2. Customer places order on storefront checkout.
3. Order routes to Admin queue and to your order email.
4. You place supplier order (Walmart/CanvasChamp/Amazon).
5. Receive product, apply branding, complete pickup/shipping.
6. Mark order completed in Admin.

## 7) 10-minute pre-merge smoke test

Run this after each major admin/storefront update:

1. Admin product publish flow
   - Open `/dashboard/#products`
   - Create product with:
     - attached photo selected
     - theme preset selected
     - generated rustic intro
     - factual details, dimensions, care
     - internal cost/shipping + customer shipping
   - Expected: save succeeds and product appears in products table.

2. Supplier packet + PO history
   - Open `/dashboard/#orders`
   - On an order, click `Generate Supplier Packet`
   - Click `Save Supplier PO Record`
   - Expected: record appears under `Supplier PO History`.

3. Storefront customer-safe content
   - Open `/`, `/gallery.html`, `/splits.html`, `/products/index.html`
   - Expected: rustic Farmhouse Frames branding and no supplier/vendor names.

4. Product page content format
   - Open one product detail page
   - Expected:
     - intro is rustic and themed
     - mockup setting appears
     - dimensions/care appear factual
     - no raw markers like `[INTRO]` are visible.

## 8) Post-deploy quick checks

1. Verify custom domain resolves at `https://www.farmhouseframes.com`
2. Verify admin login works for allowlisted account only
3. Verify one test checkout creates rows in:
   - `order_requests`
   - `order_request_items`
4. Verify supplier packet save creates rows in:
   - `supplier_order_packets`
