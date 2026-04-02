# Farmhouse Frames Go-Live Checklist

This checklist gets www.farmhouseframes.com online with your supplier-link product workflow and order routing.

## 1) Apply Supabase migrations

Run these SQL files in Supabase SQL editor (in order):

1. `supabase/schema.sql`
2. `supabase/policies.sql`

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
