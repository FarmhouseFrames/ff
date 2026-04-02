-- Phase 2: Allow supplier_order_packets to be created from sourcing workflow
-- without requiring an order_request_id (i.e. standalone sourcing packets).
alter table public.supplier_order_packets
  alter column order_request_id drop not null;

-- Add notes column if somehow missing (idempotent safeguard)
alter table public.supplier_order_packets
  add column if not exists notes text;
