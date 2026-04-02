# Project Definition

This document is the single source of truth for Farmhouse Frames. It describes the current system, the intended architecture, and the conventions GitHub Copilot should follow when expanding the project.

## 1. High-Level System Overview

Farmhouse Frames is a static website hosted on GitHub Pages with optional dynamic services provided by Supabase.

The system has three major parts:

- Public storefront: static HTML pages for browsing collections, products, shipping, cart, and checkout.
- Admin dashboard: private tooling for admin authentication, uploads, metrics, and internal utilities.
- Data layer: JSON files for product and business configuration, plus Supabase for auth, storage, and future structured records.

Current implementation notes:

- Public pages are served from the repository root and the [products](/workspaces/ff/products) folder.
- The active authenticated admin lives under [dashboard](/workspaces/ff/dashboard).
- There are legacy admin files at [dashboard.html](/workspaces/ff/dashboard.html) and [app.js](/workspaces/ff/app.js) that still reflect an earlier upload workflow.
- A standalone studio cutter tool currently lives at [admin-dashboard.html](/workspaces/ff/admin-dashboard.html).

## 2. Frontend Website Structure

The storefront is designed to stay simple, fast, static-first, and GitHub Pages compatible.

### Current public pages

- [index.html](/workspaces/ff/index.html): homepage.
- [pickup.html](/workspaces/ff/pickup.html): pickup and shipping details.
- [cart.html](/workspaces/ff/cart.html): cart flow.
- [checkout.html](/workspaces/ff/checkout.html): checkout flow.
- [products/index.html](/workspaces/ff/products/index.html): product listing entry point.
- [products/canvas.html](/workspaces/ff/products/canvas.html): canvas category page.
- [products/mounted-canvas.html](/workspaces/ff/products/mounted-canvas.html): mounted category page.
- [products/desk-canvas.html](/workspaces/ff/products/desk-canvas.html): desk canvas page.
- [products/puzzles.html](/workspaces/ff/products/puzzles.html): puzzle page.
- [COLLECTIONS](/workspaces/ff/COLLECTIONS): themed collection pages.
- [legal](/workspaces/ff/legal): privacy, shipping, and terms pages.

### Recommended page conventions

Use the following naming and behavior conventions as the project grows:

- Homepage: `index.html`
- Collections landing: `collections.html` or continue using the `COLLECTIONS/` folder with an index page
- Product categories: keep category pages under `products/`
- Product detail: use a query-parameter driven page such as `product.html?id=...` when implemented
- Informational pages: `pickup.html`, `about.html`, `contact.html`, `legal/*.html`

### Frontend behavior goals

- Product listing pages should render from JSON instead of hand-maintained HTML where practical.
- Product detail pages should load content by product `id`.
- Search, filtering, and sorting should be data-driven.
- Layouts must remain responsive and static-hosting friendly.

## 3. Product System Structure

The product system is JSON-driven and should remain content-first.

### Current product sources

- [products/products.json](/workspaces/ff/products/products.json): current product entry data.
- [data/products.json](/workspaces/ff/data/products.json): structured catalog and pricing data used for mounted print sets and other catalog definitions.
- [data/config.json](/workspaces/ff/data/config.json): business configuration, collections, tax, currency, and contact settings.

### Product system principles

- New products should be added to JSON first.
- HTML pages should render from product data rather than duplicating product content manually.
- Category pages should filter by category or tags.
- Product detail pages should derive title, pricing, description, image, sizing, and inventory from the data source.

### Recommended product fields

```json
{
  "id": "mounted-medium-trilogy-001",
  "title": "Mounted Medium Trilogy",
  "category": "Mounted Prints",
  "price": 44.88,
  "currency": "USD",
  "description": "Create your own gallery wall.",
  "image": "/ff/images/mounted-medium-trilogy.jpg",
  "sizes": ["11x14", "8x10"],
  "tags": ["mounted", "gallery-wall"],
  "inventory": 50,
  "notes": "Optional internal catalog notes"
}
```

### Product categories

- Canvas Prints
- Mounted Prints
- Desk Canvases
- Puzzles
- Seasonal or themed collections such as Spring, Fall, Winter, Structures, Giants, and Lakeside

## 4. Admin Dashboard Structure

The admin area is private and should use Supabase for authentication and protected data workflows.

### Current admin surfaces

- [dashboard/login.html](/workspaces/ff/dashboard/login.html): admin login UI.
- [dashboard/index.html](/workspaces/ff/dashboard/index.html): authenticated admin scaffold with metrics and navigation.
- [dashboard/js/auth.js](/workspaces/ff/dashboard/js/auth.js): sign-in, sign-out, current user lookup, and allowlist enforcement.
- [dashboard/js/supabaseClient.js](/workspaces/ff/dashboard/js/supabaseClient.js): Supabase client bootstrap.
- [dashboard/css/admin.css](/workspaces/ff/dashboard/css/admin.css): admin styling.
- [admin-dashboard.html](/workspaces/ff/admin-dashboard.html): standalone studio cutter and image preparation tool.

### Legacy admin files

- [dashboard.html](/workspaces/ff/dashboard.html)
- [app.js](/workspaces/ff/app.js)

These files still implement a direct login-and-upload flow and should be treated as legacy unless intentionally revived or migrated.

### Admin feature direction

- Login with Supabase Auth.
- Enforce admin allowlisting through an `admin_users` table.
- Upload and view images through Supabase Storage and related database records.
- Manage product catalog, inventory, and pricing in a future UI.
- Add order, client, and analytics views later without changing the overall dashboard entry point.

## 5. File and Folder Architecture

This is the GitHub-ready architecture for the current repository.

```text
ff/
├── index.html
├── pickup.html
├── cart.html
├── checkout.html
├── admin-dashboard.html
├── dashboard.html
├── app.js
├── css/
│   └── style.css
├── data/
│   ├── config.json
│   └── products.json
├── dashboard/
│   ├── index.html
│   ├── login.html
│   ├── css/
│   │   └── admin.css
│   └── js/
│       ├── auth.js
│       └── supabaseClient.js
├── products/
│   ├── index.html
│   ├── canvas.html
│   ├── mounted-canvas.html
│   ├── desk-canvas.html
│   ├── puzzles.html
│   └── products.json
├── COLLECTIONS/
├── images/
├── legal/
└── supabase/
    ├── policies.sql
    └── schema.sql
```

### Target architectural conventions

- Keep public storefront pages static and deployable on GitHub Pages.
- Keep admin-specific files under `dashboard/` unless there is a clear reason for a standalone tool.
- Keep reusable data in `data/` or `products/` JSON rather than duplicating product content in HTML.
- Keep SQL schema and policy definitions under `supabase/`.

## 6. Data Models

### Product model

```json
{
  "id": "string",
  "title": "string",
  "category": "string",
  "price": 0,
  "currency": "USD",
  "description": "string",
  "image": "string",
  "sizes": ["string"],
  "tags": ["string"],
  "inventory": 0,
  "notes": "string"
}
```

### Image model

Use this for public image records or Supabase-backed image metadata.

```json
{
  "name": "filename.jpg",
  "url": "public-or-signed-url",
  "storage_path": "photos/filename.jpg",
  "uploaded_at": "timestamp",
  "uploaded_by": "user-id",
  "category": "string",
  "alt": "string"
}
```

### Order model

```json
{
  "id": "string",
  "created_at": "timestamp",
  "status": "pending",
  "customer_name": "string",
  "customer_email": "string",
  "items": [
    {
      "product_id": "string",
      "title": "string",
      "quantity": 1,
      "unit_price": 0,
      "selected_size": "string"
    }
  ],
  "subtotal": 0,
  "tax": 0,
  "total": 0,
  "fulfillment_method": "pickup-or-shipping"
}
```

### Admin user model

```json
{
  "id": "uuid",
  "email": "string",
  "role": "admin",
  "is_allowlisted": true,
  "created_at": "timestamp"
}
```

### Business config model

Based on [data/config.json](/workspaces/ff/data/config.json):

```json
{
  "businessName": "Farmhouse Frames",
  "businessEmail": "string",
  "domain": "string",
  "stripePublishableKey": "string",
  "profitMargin": 0.5,
  "currency": "USD",
  "tax": 0.06,
  "collections": ["string"]
}
```

## 7. Future Expansion Hooks

The project should be expanded through clear extension points rather than rewrites.

### Storefront hooks

- Add a data-driven product detail page with query-parameter routing.
- Add search, filtering, sorting, and collection landing pages.
- Add image lazy loading, responsive sources, and stronger SEO metadata.

### Commerce hooks

- Expand [cart.html](/workspaces/ff/cart.html) and [checkout.html](/workspaces/ff/checkout.html).
- Introduce Stripe or Square checkout integrations.
- Add shipping rules, pickup scheduling, discount codes, and tax-region handling.

### Admin hooks

- Product create and edit UI.
- Inventory management.
- Order management.
- Client management.
- Upload tagging and library search.
- Analytics and activity logs.

### Data and backend hooks

- Migrate JSON-defined products into Supabase when editing workflows require it.
- Keep a stable data access layer so public pages can read from JSON or API without major page rewrites.
- Add order, client, and inventory tables in Supabase when needed.

## 8. Copilot-Ready Project Definition

The following section is intentionally short and operational. It can be reused directly in prompts, repo docs, or future Copilot instructions.

```md
# Project Definition: Farmhouse Frames

## Purpose
Farmhouse Frames is a static GitHub Pages storefront with a JSON-driven product catalog and a Supabase-powered admin area for authentication, uploads, and future catalog/order management.

## Architecture
- Public storefront pages live at the repository root and in `/products/`.
- Admin pages live primarily in `/dashboard/`.
- The standalone image-prep tool lives in `/admin-dashboard.html`.
- Product and business configuration currently live in `/data/` and `/products/products.json`.
- Supabase schema and policies live in `/supabase/`.

## Frontend Requirements
- Keep the public site static-hosting friendly.
- Prefer JSON-driven rendering over hard-coded product markup.
- Build responsive layouts with plain HTML, CSS, and JavaScript.
- Use query-parameter product detail loading when a dedicated product detail page is added.

## Admin Requirements
- Use Supabase Auth for login.
- Use allowlist-based admin access.
- Use Supabase Storage for uploaded images.
- Support image review, product management, and future order/inventory tooling.

## Data Models
- Product: `id, title, category, price, currency, description, image, sizes, tags, inventory, notes`
- Image: `name, url, storage_path, uploaded_at, uploaded_by, category, alt`
- Order: `id, created_at, status, customer fields, items, subtotal, tax, total, fulfillment_method`
- Admin user: `id, email, role, is_allowlisted, created_at`

## Copilot Guidance
- Prefer extending existing static pages over introducing frameworks.
- Keep new data in JSON or Supabase tables, not duplicated across HTML files.
- Preserve the current public/admin split.
- When adding product features, update both UI and data models.
- When adding admin features, integrate with the existing `/dashboard/` structure unless a standalone tool is intentional.
```