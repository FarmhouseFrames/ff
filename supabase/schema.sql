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
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists supplier_name text;
alter table public.products add column if not exists supplier_url text;
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
  order_request_id uuid not null references public.order_requests(id) on delete cascade,
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

create index if not exists idx_uploads_created_at on public.uploads(created_at desc);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_products_created_at on public.products(created_at desc);
create index if not exists idx_order_requests_created_at on public.order_requests(created_at desc);
create index if not exists idx_order_request_items_order_id on public.order_request_items(order_request_id);
create index if not exists idx_supplier_order_packets_order_id on public.supplier_order_packets(order_request_id);
create index if not exists idx_supplier_order_packets_created_at on public.supplier_order_packets(created_at desc);

insert into storage.buckets (id, name, public)
values ('photo-uploads', 'photo-uploads', true)
on conflict (id) do nothing;
