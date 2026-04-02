# Farmhouse Frames

This repository contains the Farmhouse Frames storefront, product data, and admin tooling.

Primary project documentation:

- [PROJECT-DEFINITION.md](/workspaces/ff/PROJECT-DEFINITION.md)

Current implementation highlights:

- Public storefront pages live at the repository root, with product-category pages under [products](/workspaces/ff/products).
- The authenticated admin lives under [dashboard](/workspaces/ff/dashboard).
- Legacy admin upload flow still exists in [dashboard.html](/workspaces/ff/dashboard.html) and [app.js](/workspaces/ff/app.js).
- Product and business data currently live in [data](/workspaces/ff/data) and [products/products.json](/workspaces/ff/products/products.json).

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