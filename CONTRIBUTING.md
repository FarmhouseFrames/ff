# Contributing

This repository is a static-first storefront with a Supabase-backed admin area. Keep changes simple, data-driven, and compatible with GitHub Pages.

## Core Rules

- Prefer extending the current HTML, CSS, and JavaScript structure instead of introducing frameworks.
- Keep public storefront code static-hosting friendly.
- Put shared product logic in reusable files under [products](/workspaces/ff/products), not inline scripts duplicated across pages.
- Treat [PROJECT-DEFINITION.md](/workspaces/ff/PROJECT-DEFINITION.md) as the architectural source of truth.
- Keep admin-facing code under [dashboard](/workspaces/ff/dashboard) unless a standalone tool is intentionally public or operationally separate.

## Data Conventions

- Update product data before editing product markup.
- Prefer normalized product objects with: `id`, `title`, `category`, `price`, `currency`, `description`, `image`, `sizes`, `tags`, `inventory`.
- If legacy data sources use different field names, normalize them in shared JavaScript rather than duplicating mapping logic in each page.
- Keep business configuration in [data/config.json](/workspaces/ff/data/config.json).
- Keep schema and policy changes in [supabase](/workspaces/ff/supabase).

## Frontend Conventions

- Use shared styles for product pages.
- Use query-parameter driven product detail pages where appropriate.
- Preserve responsive behavior on mobile and desktop.
- Avoid hard-coded product cards when a listing can be rendered from JSON.
- Prefer semantic HTML and small, focused JavaScript modules.

## Admin Conventions

- Use [dashboard/js/supabaseClient.js](/workspaces/ff/dashboard/js/supabaseClient.js) as the Supabase entry point.
- Enforce admin access through authenticated sessions and allowlisting.
- Keep storage, upload, and future CRUD operations consistent with the dashboard structure.

## Naming Conventions

- Use lowercase file names with hyphens for new public pages.
- Use descriptive IDs and slugs for products.
- Use camelCase for JavaScript variables and functions.
- Use singular names for object models and plural names for collections where it improves clarity.

## Before Opening a PR

- Check the impacted pages in a browser if the change affects UI.
- Validate that new product pages still render when JSON data is missing optional fields.
- Avoid unrelated refactors in the same change.
- Update [PROJECT-DEFINITION.md](/workspaces/ff/PROJECT-DEFINITION.md) if the architecture changes.