# Farmhouse Frames

This repository contains the Farmhouse Frames storefront, product data, and admin tooling.

Primary project documentation:

- [PROJECT-DEFINITION.md](/workspaces/ff/PROJECT-DEFINITION.md)
- [PRODUCTS-PHOTO-QUICKSTART.md](/workspaces/ff/PRODUCTS-PHOTO-QUICKSTART.md)

Current implementation highlights:

- Public storefront pages live at the repository root, with product-category pages under [products](/workspaces/ff/products).
- The authenticated admin lives under [dashboard](/workspaces/ff/dashboard), including the Uploads route for image ingestion.
- Customer account pages are available at [account-login.html](/workspaces/ff/account-login.html) and [account.html](/workspaces/ff/account.html).
- Legacy admin upload flow still exists in [dashboard.html](/workspaces/ff/dashboard.html) and [app.js](/workspaces/ff/app.js).
- Product and business data currently live in [data](/workspaces/ff/data) and [products/products.json](/workspaces/ff/products/products.json).

## Admin Upload To Editor Flow

Use this URL to go directly to uploads:

- https://farmhouseframes.com/dashboard/#uploads

Current flow:

- Upload an image in [dashboard/index.html](/workspaces/ff/dashboard/index.html) on the Uploads route.
- File is uploaded to Supabase Storage bucket `photo-uploads`.
- Metadata is written to `public.uploads`.
- User is redirected to [admin-dashboard.html](/workspaces/ff/admin-dashboard.html) with `imageUrl` query param.
- Studio cutter auto-loads that image for crop/split/product prep.

Required Supabase objects:

- Storage bucket: `photo-uploads` (public)
- RLS policy allowlist includes bucket: `photo-uploads`
- Tables: `order_requests` with `customer_user_id`, `store_settings`, and `activity_logs`

## Automatic SQL Apply Setup

To let coding sessions execute Supabase SQL updates automatically:

1. Install PostgreSQL client tools so psql is available in the terminal.
2. Export one database connection variable in your shell startup:
	- SUPABASE_DB_URL
	- or DATABASE_URL
3. Run the helper script from the repository root:

	./scripts/apply-supabase-sql.sh

The script applies:

- [supabase/schema.sql](/workspaces/ff/supabase/schema.sql)
- [supabase/policies.sql](/workspaces/ff/supabase/policies.sql)

If you keep the DB URL set in the environment, future coding sessions can run this script directly without manual SQL copy and paste.