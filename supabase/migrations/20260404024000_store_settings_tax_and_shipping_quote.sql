alter table public.store_settings
  add column if not exists tax_mode text not null default 'destination_state';

alter table public.store_settings
  add column if not exists shipping_origin_zip text not null default '42701';

alter table public.store_settings
  add column if not exists shipping_quote_api_url text;

alter table public.store_settings
  drop constraint if exists store_settings_tax_mode_chk;

alter table public.store_settings
  add constraint store_settings_tax_mode_chk
  check (tax_mode in ('destination_state', 'flat'));

update public.store_settings
set tax_mode = coalesce(nullif(tax_mode, ''), 'destination_state')
where id = 'storefront';

update public.store_settings
set shipping_origin_zip = coalesce(nullif(shipping_origin_zip, ''), '42701')
where id = 'storefront';
