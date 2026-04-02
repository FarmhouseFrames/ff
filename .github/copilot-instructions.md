# Farmhouse Frames Copilot Instructions

Apply these instructions to all work in this repository.

## Project Context

- Farmhouse Frames is a static GitHub Pages storefront with a Supabase-backed admin area.
- The canonical architecture and data model live in [PROJECT-DEFINITION.md](/workspaces/ff/PROJECT-DEFINITION.md).
- Public storefront pages live at the repository root and under [products](/workspaces/ff/products).
- The active authenticated admin lives under [dashboard](/workspaces/ff/dashboard).
- [dashboard.html](/workspaces/ff/dashboard.html) and [app.js](/workspaces/ff/app.js) are legacy unless a task explicitly targets them.

## Implementation Rules

- Prefer plain HTML, CSS, and JavaScript over introducing frameworks.
- Prefer shared modules over inline page-specific duplication.
- Keep public pages static-hosting friendly and avoid server-only assumptions.
- Prefer data-driven rendering from JSON or Supabase instead of duplicating product content in markup.
- When product data uses legacy field names, normalize it in one shared module.
- Preserve existing URLs when possible.
- Keep new file names lowercase and hyphenated.

## Product System Rules

- Treat [products/products.json](/workspaces/ff/products/products.json) and [data/products.json](/workspaces/ff/data/products.json) as current catalog sources.
- Normalize product objects to: `id`, `title`, `category`, `price`, `currency`, `description`, `image`, `sizes`, `tags`, `inventory`.
- Link product listings to a query-parameter detail page rather than duplicating full detail markup across category pages.

## Admin Rules

- Put authenticated admin work under [dashboard](/workspaces/ff/dashboard) unless a standalone tool is intentional.
- Reuse [dashboard/js/supabaseClient.js](/workspaces/ff/dashboard/js/supabaseClient.js) for Supabase access.
- Preserve allowlist-based admin access behavior in [dashboard/js/auth.js](/workspaces/ff/dashboard/js/auth.js).

## Change Discipline

- Make minimal, targeted changes.
- Do not rewrite unrelated pages just for style consistency.
- Update documentation when architectural behavior changes.
- Favor maintainable code that a static-site workflow can support easily.