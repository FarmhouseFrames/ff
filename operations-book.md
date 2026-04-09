# Farmhouse Frames Operations Book

## 1. Scope

This operations book covers every active web surface in this repository:

1. Public storefront website
2. Customer account website area
3. Private admin dashboard
4. Studio cutter tool
5. Legacy admin surfaces still present in codebase
6. Data and operations layer (Supabase + scripts)

## 2. Domains and Base URLs

1. Canonical production domain from CNAME:
   - https://www.farmhouseframes.com
2. Alternate naked domain (recommended redirect target):
   - https://farmhouseframes.com
3. Repository root local reference:
   - `/workspaces/ff`

## 3. Full URL Inventory (Production)

All URLs below assume `https://www.farmhouseframes.com` as base.

### 3.1 Public Storefront Pages (Primary)

1. `/` - Home
2. `/index.html` - Home (explicit file path)
3. `/gallery.html` - Gallery
4. `/splits.html` - Split canvas showcase
5. `/catalog.html` - Catalog overview
6. `/collections.html` - Collections landing
7. `/products/index.html` - Product listing (query-driven)
8. `/products/product.html` - Product details (query-driven)
9. `/cart.html` - Cart
10. `/checkout.html` - Checkout
11. `/pickup.html` - Pickup and shipping info
12. `/contact.html` - Contact
13. `/certificates.html` - Certificates

### 3.2 Customer Account Pages

1. `/account-login.html` - Sign in, sign up, reset
2. `/account.html` - Account landing and order history

Customer account URL parameters:

1. `/account-login.html?mode=signin`
2. `/account-login.html?mode=signup`

### 3.3 Product and Category Surfaces (Current + Legacy category pages)

1. `/products/index.html` - Current product index
2. `/products/product.html?id=<product-slug-or-id>&category=<category>`
3. `/products/canvas.html`
4. `/products/mounted-canvas.html`
5. `/products/desk-canvas.html`
6. `/products/puzzles.html`

### 3.4 Collections Pages (Legacy but published)

1. `/COLLECTIONS/falls.html`
2. `/COLLECTIONS/giants.html`
3. `/COLLECTIONS/lakeside.html`
4. `/COLLECTIONS/springs.html`
5. `/COLLECTIONS/structures.html`
6. `/COLLECTIONS/winter.html`

### 3.5 Legal Pages

1. `/legal/privacy.html`
2. `/legal/shipping.html`
3. `/legal/terms.html`

### 3.6 Admin URLs (Authenticated)

1. `/dashboard/login.html` - Admin login
2. `/dashboard/index.html` - Admin app shell
3. `/dashboard/#dashboard` - Dashboard route
4. `/dashboard/#products` - Product management
5. `/dashboard/#sourcing` - Sourcing workspace
6. `/dashboard/#uploads` - Uploads
7. `/dashboard/#orders` - Order queue and statuses
8. `/dashboard/#clients` - Client rollup
9. `/dashboard/#logs` - Activity logs
10. `/dashboard/#settings` - Store settings

### 3.7 Admin Tools

1. `/admin-dashboard.html` - Studio cutter tool
2. `/admin/splitter-tool.html` - Redirect to studio cutter
3. `/admin/manual-entry.html` - Manual order entry
4. `/admin/dashboard.html` - Redirect to `/dashboard/index.html`

Studio cutter URL parameters:

1. `/admin-dashboard.html?imageUrl=<encoded-url>`
2. `/admin-dashboard.html?preset=<preset>&supplierUrl=<encoded-url>&productName=<name>&returnTo=<encoded-url>&imageUrl=<encoded-url>`

### 3.8 Legacy Admin Surface (Do not use for normal operations)

1. `/dashboard.html` - Legacy login/upload page

## 4. Website Parts and What Each Part Owns

## 4.1 Public Storefront Website

Purpose:

1. Marketing pages and customer-facing shopping flow
2. Cart and checkout
3. Customer-safe product display (no supplier internals)

Core files:

1. `index.html`, `gallery.html`, `splits.html`, `catalog.html`, `collections.html`
2. `cart.html`, `checkout.html`, `pickup.html`, `contact.html`, `certificates.html`
3. `products/index.html`, `products/product.html`
4. `css/commerce.css`, `css/style.css`, `assets/css/site.css`

Data and script parts:

1. `js/commerce.js` - cart totals, config load, order summary
2. `js/supabasePublic.js` - public Supabase client
3. `products/products.js` - catalog normalization and rendering
4. `data/config.json`, `data/products.json`, `products/products.json`

## 4.2 Customer Account Website Area

Purpose:

1. Customer sign in and account access
2. Show customer-owned order history

Core files:

1. `account-login.html`
2. `account.html`
3. `js/supabasePublic.js`

Data dependencies:

1. `order_requests.customer_user_id`
2. RLS policies in `supabase/policies.sql`

## 4.3 Private Admin Website

Purpose:

1. Internal operations: products, orders, uploads, settings, sourcing, logs

Core files:

1. `dashboard/login.html`
2. `dashboard/index.html`
3. `dashboard/js/auth.js`
4. `dashboard/js/supabaseClient.js`
5. `dashboard/css/admin.css`

Admin auth and access rules:

1. User must authenticate with Supabase Auth
2. User must be allowlisted in `public.admin_users`
3. Admin CRUD is controlled by RLS policies using `public.is_admin()`

## 4.4 Studio Cutter Website Tool

Purpose:

1. Image preparation and split layout preview
2. Used from admin uploads and product workflows

Core files:

1. `admin-dashboard.html`
2. `admin/splitter-tool.html` (redirect)

## 4.5 Legacy Website Parts

Purpose:

1. Historical workflow references only

Core files:

1. `dashboard.html`
2. `app.js`

Operational rule:

1. Do not build new features here unless migration work is explicitly planned.

## 5. End-to-End Operational Flows

## 5.1 Product Creation Flow

1. Admin signs in at `/dashboard/login.html`
2. Admin uploads source image at `/dashboard/#uploads`
3. Upload stores file in `photo-uploads` bucket and row in `public.uploads`
4. Admin is redirected to studio cutter (`/admin-dashboard.html?imageUrl=...`)
5. Admin creates product at `/dashboard/#products`
6. Product appears on storefront `/products/index.html`

## 5.2 Customer Checkout Flow

1. Customer browses products (`/products/index.html`)
2. Adds item from `/products/product.html?id=...`
3. Reviews cart at `/cart.html`
4. Completes checkout at `/checkout.html`
5. System inserts into `order_requests` and `order_request_items`
6. Admin reviews order at `/dashboard/#orders`

## 5.3 Customer Account Flow

1. Customer signs in at `/account-login.html`
2. Account page `/account.html` loads current session
3. Account history reads orders where `customer_user_id = auth.uid()`

## 5.4 Fulfillment and Status Flow

1. Admin opens `/dashboard/#orders`
2. Updates status through lifecycle: `new -> ordered -> received -> ready -> completed`
3. Supplier packet generation and save happen in Orders screen

## 6. Data Layer and Operational Components

## 6.1 Supabase SQL Sources

1. `supabase/schema.sql` - schema
2. `supabase/policies.sql` - canonical policy set
3. `supabase/policies-core.sql` - reconciled core policy set
4. `supabase/storage-policies-ui.md` - storage policy guidance

## 6.2 Key Public Tables

1. `products`
2. `order_requests`
3. `order_request_items`
4. `store_settings`

## 6.3 Key Admin/Internal Tables

1. `admin_users`
2. `uploads`
3. `supplier_order_packets`
4. `sourcing_records`
5. `activity_logs`
6. `clients`
7. `orders`
8. `order_items`
9. `product_photos`
10. `categories`
11. `cases`
12. `case_files`
13. `case_templates`
14. `evidence_index`
15. `hours_log`
16. `mileage_log`
17. `expenses`
18. `payments`

## 7. Scripts and Environment

## 7.1 SQL Apply Script

1. `scripts/apply-supabase-sql.sh`

Required environment:

1. `SUPABASE_DB_URL` or `DATABASE_URL`
2. `psql` installed

Execution:

1. `./scripts/apply-supabase-sql.sh`

## 8. Go-Live and Daily Operations

## 8.1 Go-Live Essentials

1. Apply `supabase/schema.sql`
2. Apply `supabase/policies.sql`
3. Insert allowlisted admin in `public.admin_users`
4. Confirm GitHub Pages publishing and DNS CNAME

## 8.2 Daily Operations Checklist

1. Product updates: `/dashboard/#products`
2. Upload source images: `/dashboard/#uploads`
3. Review incoming orders: `/dashboard/#orders`
4. Update fulfillment statuses
5. Verify customer-facing catalog and product pages

## 9. Privacy and Content Boundaries

Rules to preserve:

1. Public storefront shows customer-facing finished products only
2. Supplier/vendor links and internal sourcing details stay admin-only
3. Customer account only shows order data tied to signed-in customer

## 10. URL QA Checklist

Run before release:

1. Verify all primary public URLs return 200
2. Verify account URLs load and auth transitions work
3. Verify admin login and each hash route loads
4. Verify studio cutter URL params (`imageUrl`, `preset`, `supplierUrl`, `productName`, `returnTo`)
5. Verify legal pages are accessible
6. Verify collections and category legacy pages still resolve if retained

## 11. File Map Reference

Public website files:

1. `index.html`
2. `gallery.html`
3. `splits.html`
4. `catalog.html`
5. `collections.html`
6. `products/index.html`
7. `products/product.html`
8. `cart.html`
9. `checkout.html`
10. `pickup.html`
11. `contact.html`
12. `certificates.html`
13. `legal/privacy.html`
14. `legal/shipping.html`
15. `legal/terms.html`
16. `COLLECTIONS/*.html`

Customer account files:

1. `account-login.html`
2. `account.html`

Admin files:

1. `dashboard/login.html`
2. `dashboard/index.html`
3. `dashboard/js/auth.js`
4. `dashboard/js/supabaseClient.js`
4. `dashboard/css/admin.css`
5. `admin/manual-entry.html`
6. `admin/splitter-tool.html`
7. `admin-dashboard.html`

Legacy files:

1. `dashboard.html`
2. `app.js`
