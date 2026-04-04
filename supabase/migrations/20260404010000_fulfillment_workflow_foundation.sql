create table if not exists public.provider_products (
  provider_product_id text primary key,
  provider_name text not null,
  provider_product_url text,
  product_type text,
  available_sizes text[] not null default '{}'::text[],
  available_frame_styles text[] not null default '{}'::text[],
  paper_type text,
  print_method text,
  base_cost numeric not null default 0,
  production_time_min_days integer not null default 0,
  production_time_max_days integer not null default 0,
  shipping_time_min_days integer not null default 0,
  shipping_time_max_days integer not null default 0,
  fulfillment_method text not null default 'ship_to_studio',
  provider_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_products_fulfillment_method_chk
    check (fulfillment_method in ('ship_to_studio'))
);

alter table public.products add column if not exists sku text;
alter table public.products add column if not exists size text;
alter table public.products add column if not exists frame_style text;
alter table public.products add column if not exists provider_product_reference text;
alter table public.products add column if not exists production_time_display_min_days integer;
alter table public.products add column if not exists production_time_display_max_days integer;
alter table public.products add column if not exists fulfillment_options text[] not null default '{pickup,ship_after_branding}'::text[];
alter table public.products add column if not exists status text not null default 'draft';
alter table public.products add column if not exists updated_at timestamptz not null default now();

create table if not exists public.photos (
  photo_id uuid primary key default gen_random_uuid(),
  file_name text,
  file_path text not null,
  category text,
  case_id uuid references public.cases(id) on delete set null,
  date_uploaded timestamptz not null default now(),
  notes text,
  status text not null default 'raw',
  width_px integer,
  height_px integer,
  aspect_ratio text,
  orientation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint photos_status_chk
    check (status in ('raw', 'unreviewed', 'approved', 'rejected')),
  constraint photos_orientation_chk
    check (orientation in ('landscape', 'portrait', 'square') or orientation is null)
);

create table if not exists public.photo_product_compatibility (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(photo_id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  product_type text,
  size text,
  fits boolean not null default false,
  reason text,
  auto_generated boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (photo_id, product_id, size)
);

create table if not exists public.photo_derivatives (
  derivative_id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(photo_id) on delete cascade,
  type text not null,
  provider_name text,
  size text,
  file_path text not null,
  created_at timestamptz not null default now(),
  constraint photo_derivatives_type_chk
    check (type in ('print_ready', 'provider_specific', 'web'))
);

create table if not exists public.mockups (
  mockup_id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(photo_id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  frame_style text,
  size text,
  mockup_file_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.product_images (
  product_image_id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  mockup_id uuid not null references public.mockups(mockup_id) on delete cascade,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists customer_id uuid;
alter table public.orders add column if not exists order_status text not null default 'new';
alter table public.orders add column if not exists payment_status text not null default 'paid';
alter table public.orders add column if not exists fulfillment_method text;
alter table public.orders add column if not exists completed_at timestamptz;
alter table public.orders add column if not exists updated_at timestamptz not null default now();

alter table public.order_items add column if not exists order_item_id uuid;
alter table public.order_items add column if not exists quantity integer not null default 1;
alter table public.order_items add column if not exists unit_price numeric not null default 0;
alter table public.order_items add column if not exists total_price numeric not null default 0;

create table if not exists public.order_fulfillment (
  order_fulfillment_id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider_name text not null,
  provider_order_id text,
  provider_product_id text references public.provider_products(provider_product_id) on delete set null,
  photo_id uuid references public.photos(photo_id) on delete set null,
  print_file_path text,
  ship_to text not null default 'studio',
  submission_date timestamptz,
  expected_arrival_min_days integer,
  expected_arrival_max_days integer,
  tracking_number text,
  carrier text,
  ship_date timestamptz,
  status text not null default 'in_production',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_issues (
  order_issue_id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_fulfillment_id uuid references public.order_fulfillment(order_fulfillment_id) on delete set null,
  issue_type text,
  issue_status text not null default 'open',
  details text,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_shipping (
  order_shipping_id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  carrier text,
  tracking_number text,
  ship_date timestamptz,
  estimated_delivery_date timestamptz,
  delivery_method text not null default 'studio_shipping',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  log_id uuid primary key default gen_random_uuid(),
  action_type text not null,
  actor uuid references auth.users(id) on delete set null,
  target_type text,
  target_id text,
  timestamp timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_provider_products_provider_name on public.provider_products(provider_name);
create index if not exists idx_photos_status on public.photos(status);
create index if not exists idx_photos_uploaded_desc on public.photos(date_uploaded desc);
create index if not exists idx_photo_derivatives_photo_id on public.photo_derivatives(photo_id);
create index if not exists idx_photo_product_compatibility_photo_id on public.photo_product_compatibility(photo_id);
create index if not exists idx_photo_product_compatibility_product_id on public.photo_product_compatibility(product_id);
create index if not exists idx_order_fulfillment_order_id on public.order_fulfillment(order_id);
create index if not exists idx_order_shipping_order_id on public.order_shipping(order_id);
create index if not exists idx_order_issues_order_id on public.order_issues(order_id);
create index if not exists idx_audit_log_timestamp_desc on public.audit_log(timestamp desc);