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

create index if not exists idx_customer_profiles_full_name
  on public.customer_profiles(full_name);

create index if not exists idx_customer_profiles_updated_at
  on public.customer_profiles(updated_at desc);

create or replace function public.touch_customer_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customer_profiles_updated_at on public.customer_profiles;
create trigger trg_customer_profiles_updated_at
before update on public.customer_profiles
for each row
execute function public.touch_customer_profiles_updated_at();

alter table public.customer_profiles enable row level security;

drop policy if exists "Customers can read own customer profile" on public.customer_profiles;
create policy "Customers can read own customer profile"
on public.customer_profiles for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Customers can create own customer profile" on public.customer_profiles;
create policy "Customers can create own customer profile"
on public.customer_profiles for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Customers can update own customer profile" on public.customer_profiles;
create policy "Customers can update own customer profile"
on public.customer_profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

insert into public.customer_profiles (
  user_id,
  first_name,
  last_name,
  full_name,
  date_of_birth,
  phone,
  address_line_1,
  address_line_2,
  city,
  state_region,
  postal_code,
  country,
  preferred_fulfillment,
  saved_notes
)
select
  u.id,
  nullif(trim(u.raw_user_meta_data ->> 'first_name'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'last_name'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'date_of_birth'), '')::date,
  nullif(trim(u.raw_user_meta_data ->> 'phone'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'address_line_1'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'address_line_2'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'city'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'state_region'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'postal_code'), ''),
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'country'), ''), 'United States'),
  case
    when u.raw_user_meta_data ->> 'preferred_fulfillment' in ('Pickup', 'Shipping')
      then u.raw_user_meta_data ->> 'preferred_fulfillment'
    else 'Pickup'
  end,
  nullif(trim(u.raw_user_meta_data ->> 'saved_notes'), '')
from auth.users u
where coalesce(u.raw_user_meta_data, '{}'::jsonb) <> '{}'::jsonb
on conflict (user_id) do update
set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  full_name = excluded.full_name,
  date_of_birth = excluded.date_of_birth,
  phone = excluded.phone,
  address_line_1 = excluded.address_line_1,
  address_line_2 = excluded.address_line_2,
  city = excluded.city,
  state_region = excluded.state_region,
  postal_code = excluded.postal_code,
  country = excluded.country,
  preferred_fulfillment = excluded.preferred_fulfillment,
  saved_notes = excluded.saved_notes,
  updated_at = now();