-- Add RLS policies to customer_profiles table
-- The table already exists from schema.sql, this migration adds security policies and triggers

-- Enable row-level security
alter table public.customer_profiles enable row level security;

-- Drop existing policies if they exist (idempotent approach)
drop policy if exists "Customers can view own profile" on public.customer_profiles;
drop policy if exists "Customers can update own profile" on public.customer_profiles;
drop policy if exists "Customers can insert their own profile" on public.customer_profiles;
drop policy if exists "Admin can read all profiles" on public.customer_profiles;

-- RLS policies: customers can read/write only their own profiles, admins can read all
create policy "Customers can view own profile"
  on public.customer_profiles for select
  using (auth.uid() = user_id);

create policy "Customers can update own profile"
  on public.customer_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Customers can insert their own profile"
  on public.customer_profiles for insert
  with check (auth.uid() = user_id);

create policy "Admin can read all profiles"
  on public.customer_profiles for select
  using (auth.jwt() ->> 'role' = 'service_role' or exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ));

-- Create index on user_id for fast lookups if not exists
create index if not exists idx_customer_profiles_user_id on public.customer_profiles(user_id);

-- Create or replace trigger to update updated_at timestamp
drop trigger if exists trigger_customer_profiles_updated_at on public.customer_profiles;

create or replace function public.update_customer_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_customer_profiles_updated_at
  before update on public.customer_profiles
  for each row
  execute function public.update_customer_profiles_updated_at();
