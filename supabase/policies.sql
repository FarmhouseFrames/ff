create or replace function public.is_admin()
returns boolean
language sql
stable
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

-- Admin-only CRUD policies
do $$
declare
  t text;
begin
  foreach t in array array[
    'products','product_photos','categories','cases','uploads',
    'clients','orders','order_items',
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

-- Storage (run after creating buckets)
alter table storage.objects enable row level security;

create or replace function public.is_admin_bucket(bucket text)
returns boolean
language sql
stable
as $$
  select bucket = any(array['product-images','uploads','order-files','case-files']);
$$;

drop policy if exists "Admin can manage objects in admin buckets" on storage.objects;
create policy "Admin can manage objects in admin buckets"
on storage.objects for all
to authenticated
using (
  public.is_admin()
  and public.is_admin_bucket(bucket_id)
)
with check (
  public.is_admin()
  and public.is_admin_bucket(bucket_id)
);
