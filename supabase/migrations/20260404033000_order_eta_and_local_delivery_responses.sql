alter table public.store_settings
  add column if not exists outbound_shipping_min_days integer not null default 2;

alter table public.store_settings
  add column if not exists outbound_shipping_max_days integer not null default 5;

alter table public.store_settings
  drop constraint if exists store_settings_outbound_shipping_days_chk;

alter table public.store_settings
  add constraint store_settings_outbound_shipping_days_chk
  check (
    outbound_shipping_min_days >= 0
    and outbound_shipping_max_days >= outbound_shipping_min_days
  );

alter table public.order_requests
  add column if not exists eta_min_date date;

alter table public.order_requests
  add column if not exists eta_max_date date;

alter table public.order_requests
  add column if not exists local_delivery_slots jsonb not null default '[]'::jsonb;

alter table public.order_requests
  add column if not exists local_delivery_response_token text;

alter table public.order_requests
  add column if not exists customer_notification_sent_at timestamptz;

create table if not exists public.delivery_meetup_responses (
  id uuid primary key default gen_random_uuid(),
  order_request_id uuid not null references public.order_requests(id) on delete cascade,
  response_token text not null,
  customer_email text not null,
  selected_location text not null,
  selected_timeframe text not null,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_delivery_meetup_responses_order_email
  on public.delivery_meetup_responses(order_request_id, customer_email);

create index if not exists idx_delivery_meetup_responses_order_id
  on public.delivery_meetup_responses(order_request_id);

alter table public.delivery_meetup_responses enable row level security;

drop policy if exists "Admin CRUD delivery_meetup_responses" on public.delivery_meetup_responses;
create policy "Admin CRUD delivery_meetup_responses"
on public.delivery_meetup_responses for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can submit delivery meetup responses" on public.delivery_meetup_responses;
create policy "Public can submit delivery meetup responses"
on public.delivery_meetup_responses for insert
to anon, authenticated
with check (
  char_length(trim(response_token)) >= 20
  and position('@' in customer_email) > 1
  and char_length(trim(selected_location)) > 0
  and char_length(trim(selected_timeframe)) > 0
);
