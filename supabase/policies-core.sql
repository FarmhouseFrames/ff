create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.product_photos enable row level security;
alter table public.categories enable row level security;
alter table public.cases enable row level security;
alter table public.uploads enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.order_requests enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.order_request_items enable row level security;
alter table public.supplier_order_packets enable row level security;
alter table public.sourcing_records enable row level security;
alter table public.order_items enable row level security;
alter table public.hours_log enable row level security;
alter table public.mileage_log enable row level security;
alter table public.expenses enable row level security;
alter table public.payments enable row level security;
alter table public.case_files enable row level security;
alter table public.case_templates enable row level security;
alter table public.evidence_index enable row level security;

drop policy if exists "Admins can read admin_users" on public.admin_users;
create policy "Admins can read admin_users"
on public.admin_users for select
to authenticated
using (public.is_admin());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (active = true);

-- Admin-only CRUD policies
do $$
declare
  t text;
begin
  foreach t in array array[
    'products','product_photos','categories','cases','uploads',
    'clients','orders','order_requests','customer_profiles','order_request_items','supplier_order_packets','sourcing_records','order_items',
    'hours_log','mileage_log','expenses','payments',
    'case_files','case_templates','evidence_index'
  ]
  loop
    execute format('drop policy if exists "Admin CRUD %s" on public.%I;', t, t);
    execute format($p$
      create policy "Admin CRUD %s"
      on public.%I for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
    $p$, t, t);
  end loop;
end $$;

drop policy if exists "Public can create order requests" on public.order_requests;
create policy "Public can create order requests"
on public.order_requests for insert
to anon, authenticated
with check (
  char_length(trim(customer_name)) > 0
  and position('@' in customer_email) > 1
  and total >= 0
);

drop policy if exists "Public can create order request items" on public.order_request_items;
create policy "Public can create order request items"
on public.order_request_items for insert
to anon, authenticated
with check (
  quantity > 0
  and unit_price >= 0
  and char_length(trim(title)) > 0
);

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
