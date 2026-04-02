create extension if not exists "uuid-ossp";

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null default 0,
  internal_cost numeric not null default 0,
  internal_shipping numeric not null default 0,
  customer_shipping numeric not null default 0,
  category text,
  supplier_name text,
  supplier_url text,
  image text,
  sizes text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  inventory integer not null default 0,
  source_upload_id uuid,
  production_preset text not null default 'custom',
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists supplier_name text;
alter table public.products add column if not exists supplier_url text;
alter table public.products add column if not exists image text;
alter table public.products add column if not exists sizes text[] not null default '{}'::text[];
alter table public.products add column if not exists tags text[] not null default '{}'::text[];
alter table public.products add column if not exists inventory integer not null default 0;
alter table public.products add column if not exists source_upload_id uuid;
alter table public.products add column if not exists production_preset text not null default 'custom';
alter table public.products add column if not exists internal_cost numeric not null default 0;
alter table public.products add column if not exists internal_shipping numeric not null default 0;
alter table public.products add column if not exists customer_shipping numeric not null default 0;

create table if not exists public.product_photos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  file_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  file_url text not null,
  label text,
  category text,
  case_id uuid references public.cases(id) on delete set null,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'pending',
  total numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_requests (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  fulfillment_method text not null default 'Pickup',
  notes text,
  status text not null default 'new',
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.order_requests add column if not exists customer_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  full_name text,
  date_of_birth date,
  phone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_region text,
  postal_code text,
  country text not null default 'United States',
  preferred_fulfillment text not null default 'Pickup',
  saved_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_profiles_preferred_fulfillment_chk
    check (preferred_fulfillment in ('Pickup', 'Shipping'))
);

alter table public.customer_profiles add column if not exists first_name text;
alter table public.customer_profiles add column if not exists last_name text;
alter table public.customer_profiles add column if not exists full_name text;
alter table public.customer_profiles add column if not exists date_of_birth date;
alter table public.customer_profiles add column if not exists phone text;
alter table public.customer_profiles add column if not exists address_line_1 text;
alter table public.customer_profiles add column if not exists address_line_2 text;
alter table public.customer_profiles add column if not exists city text;
alter table public.customer_profiles add column if not exists state_region text;
alter table public.customer_profiles add column if not exists postal_code text;
alter table public.customer_profiles add column if not exists country text not null default 'United States';
alter table public.customer_profiles add column if not exists preferred_fulfillment text not null default 'Pickup';
alter table public.customer_profiles add column if not exists saved_notes text;
alter table public.customer_profiles add column if not exists created_at timestamptz not null default now();
alter table public.customer_profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.order_request_items (
  id uuid primary key default gen_random_uuid(),
  order_request_id uuid not null references public.order_requests(id) on delete cascade,
  product_id text,
  title text not null,
  size text,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.supplier_order_packets (
  id uuid primary key default gen_random_uuid(),
  order_request_id uuid references public.order_requests(id) on delete cascade,
  supplier_name text not null,
  supplier_url text,
  packet_text text not null,
  customer_total numeric not null default 0,
  customer_shipping numeric not null default 0,
  supplier_estimate numeric not null default 0,
  internal_shipping numeric not null default 0,
  status text not null default 'prepared',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.supplier_order_packets alter column order_request_id drop not null;

create table if not exists public.sourcing_records (
  id uuid primary key default gen_random_uuid(),
  catalog_product_key text not null unique,
  catalog_product_id text not null,
  catalog_source_file text not null,
  title text,
  category text,
  supplier_item_type text,
  supplier_item_label text,
  supplier_url text,
  artwork_url text,
  mockup_url text,
  storefront_image_url text,
  layout_name text,
  workflow_status text not null default 'draft',
  specs text,
  production_checklist text,
  supplier_description text,
  store_description text,
  base_cost numeric not null default 0,
  shipping_cost numeric not null default 0,
  delivery_fee numeric not null default 0,
  profit_amount numeric not null default 0,
  retail_before_shipping numeric not null default 0,
  retail_after_shipping numeric not null default 0,
  profit_percent numeric not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sourcing_records add column if not exists supplier_item_type text;
alter table public.sourcing_records add column if not exists supplier_item_label text;
alter table public.sourcing_records add column if not exists mockup_url text;
alter table public.sourcing_records add column if not exists storefront_image_url text;
alter table public.sourcing_records add column if not exists workflow_status text not null default 'draft';
alter table public.sourcing_records add column if not exists production_checklist text;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  qty integer not null default 1,
  unit_price numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.hours_log (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  hours numeric not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.mileage_log (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  miles numeric not null default 0,
  purpose text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount numeric not null default 0,
  category text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount numeric not null default 0,
  method text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.case_files (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  file_url text not null,
  label text,
  created_at timestamptz not null default now()
);

create table if not exists public.case_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_index (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade,
  entry jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id text primary key,
  business_email text,
  tax_rate numeric not null default 0,
  currency text not null default 'USD',
  hosted_payment_url text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_uploads_created_at on public.uploads(created_at desc);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_products_created_at on public.products(created_at desc);
create index if not exists idx_order_requests_created_at on public.order_requests(created_at desc);
create index if not exists idx_order_requests_customer_user_id on public.order_requests(customer_user_id);
create index if not exists idx_customer_profiles_full_name on public.customer_profiles(full_name);
create index if not exists idx_customer_profiles_updated_at on public.customer_profiles(updated_at desc);
create index if not exists idx_order_request_items_order_id on public.order_request_items(order_request_id);
create index if not exists idx_supplier_order_packets_order_id on public.supplier_order_packets(order_request_id);
create index if not exists idx_supplier_order_packets_created_at on public.supplier_order_packets(created_at desc);
create index if not exists idx_sourcing_records_updated_at on public.sourcing_records(updated_at desc);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);

insert into public.store_settings (id, business_email, tax_rate, currency)
values ('storefront', 'kristin@farmhouseframes.com', 0.06, 'USD')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('photo-uploads', 'photo-uploads', true)
on conflict (id) do nothing;
