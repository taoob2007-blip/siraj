-- ─────────────────────────────────────────────────────────────────────────────
-- SIRAJ — Supplier Categories
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. categories
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- Index for per-user lookups
create index if not exists categories_user_id_idx on public.categories (user_id);

-- 2. category_suppliers  (junction table)
create table if not exists public.category_suppliers (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references public.categories (id) on delete cascade,
  supplier_email  text not null,
  created_at      timestamptz not null default now(),

  -- Prevent duplicate supplier in same category
  unique (category_id, supplier_email)
);

create index if not exists category_suppliers_category_id_idx
  on public.category_suppliers (category_id);

-- 3. Disable RLS for now (matches existing tables in dev mode)
--    Remove these lines and add proper policies when auth is enabled.
alter table public.categories         disable row level security;
alter table public.category_suppliers disable row level security;
