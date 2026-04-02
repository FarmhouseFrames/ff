# Products + Photo Quickstart

This guide gets you from a new photo to a live sellable listing in minutes.

## 1) Open admin and sign in

1. Go to `/dashboard/login.html`.
2. Sign in with your allowlisted admin account.
3. Open the Products screen at `/dashboard/#products`.

## 2) Upload photo source files

1. Open Uploads in admin (`/dashboard/#uploads`).
2. Upload the image you want to build products from.
3. Add optional label and category so you can find it later.

Tip: Keep source files high resolution so large print sizes stay sharp.

## 3) Create a sellable product

In Products (`/dashboard/#products`), complete these fields:

1. Product name
2. Category
3. Attached photo source
4. Supplier + supplier URL
5. Sell price
6. Internal cost + internal shipping (recommended for margin tracking)
7. Customer flat shipping
8. Available sizes
9. Website tags
10. Inventory count
11. Cutter preset
12. Theme preset
13. Rustic intro (use Generate Rustic Intro, then edit)
14. Mockup setting
15. Factual details
16. Dimensions
17. Care instructions

Use the actual supplier print-product page in the Supplier URL field.

If you want to confirm the crop and panel layout before saving, click `Open Source In Cutter`.

Then click Save Product.

## 4) Verify storefront output

1. Open `/products/index.html` and find the item.
2. Open the product detail page.
3. Confirm customer-safe copy (no supplier/vendor mention).
4. Confirm intro, mockup setting, dimensions, and care render cleanly.

## 5) Recommended listing rhythm

1. Upload 5-10 source photos first.
2. Create products in one category batch.
3. Keep naming consistent: location + mood + medium + size.
4. Check one live page per batch before creating the next batch.

## 6) Ready-to-sell checklist per item

- Photo attached
- Price set
- Cost and shipping set
- Intro + factual text completed
- Dimensions and care completed
- Product visible on storefront

## 7) If Storage upload fails

Use the fallback setup docs:

1. Run `/supabase/policies-core.sql` in Supabase SQL Editor.
2. Configure Storage policies from `/supabase/storage-policies-ui.md`.

## 8) If the splitter works but Uploads or Products do not

This usually means the admin allowlist policy has not been reapplied with the latest `is_admin()` function.

1. Run `/supabase/policies.sql` in Supabase SQL Editor.
2. If Storage ownership errors block that file, run `/supabase/policies-core.sql` instead.
3. Sign out and sign back in at `/dashboard/login.html`.
4. Retry `/dashboard/#products` and `/dashboard/#uploads`.