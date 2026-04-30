-- ─────────────────────────────────────────────────────────────────────────────
-- SIRAJ — Categories v2: additive migration, zero data loss
-- Run in Supabase SQL Editor AFTER the v1 migration.
-- Every statement is idempotent (safe to run multiple times).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Ensure tables exist (idempotent — safe if already created by v1)
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.category_suppliers (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references public.categories (id) on delete cascade,
  supplier_email text not null,
  created_at     timestamptz not null default now()
);

-- 2. Add supplier_name column for display without extra joins (safe if exists)
alter table public.category_suppliers
  add column if not exists supplier_name text;

-- 3. Ensure unique constraint on (category_id, supplier_email)
--    Creates only if not already present.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'category_suppliers_category_id_supplier_email_key'
      and conrelid = 'public.category_suppliers'::regclass
  ) then
    alter table public.category_suppliers
      add constraint category_suppliers_category_id_supplier_email_key
      unique (category_id, supplier_email);
  end if;
end $$;

-- 4. Performance indexes
create index if not exists categories_user_id_idx
  on public.categories (user_id);

create index if not exists category_suppliers_category_id_idx
  on public.category_suppliers (category_id);

create index if not exists category_suppliers_email_idx
  on public.category_suppliers (supplier_email);

-- 5. Ensure suppliers table has the right shape for upsert
--    (already created by RFQ flow; this is a safety net)
create table if not exists public.suppliers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  name       text not null default '',
  email      text not null,
  created_at timestamptz not null default now(),
  unique (user_id, email)
);

create index if not exists suppliers_user_id_email_idx
  on public.suppliers (user_id, email);

-- 6. Disable RLS (matches existing dev-mode config)
alter table public.categories          disable row level security;
alter table public.category_suppliers  disable row level security;
alter table public.suppliers           disable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- Aggregate view for category stats — used by the detail API
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.category_stats as
select
  cs.category_id,
  count(distinct cs.supplier_email)                              as supplier_count,
  round(avg(r.price)::numeric, 0)                               as avg_price,
  round(avg(r.delivery_days)::numeric, 1)                       as avg_delivery_days,
  max(r.created_at)                                             as last_response_at
from public.category_suppliers cs
left join public.responses r on r.supplier_email = cs.supplier_email
group by cs.category_id;
