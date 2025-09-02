-- Migration: create lists and list_items for Saved Lists feature

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  item_type text not null check (item_type in ('project','stay')),
  item_id text not null,
  added_at timestamptz default now(),
  unique (list_id, item_type, item_id)
);

-- Enable Row Level Security
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- Policies: lists - only owner can read/write
create policy lists_user_is_owner on public.lists
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies: list_items - only allow actions if the parent list belongs to the current user
create policy list_items_select_for_owner on public.list_items
  for select
  using (
    exists (select 1 from public.lists l where l.id = public.list_items.list_id and l.user_id = auth.uid())
  );

create policy list_items_insert_if_owner_of_list on public.list_items
  for insert
  with check (
    exists (select 1 from public.lists l where l.id = public.list_items.list_id and l.user_id = auth.uid())
  );

create policy list_items_update_if_owner_of_list on public.list_items
  for update
  using (
    exists (select 1 from public.lists l where l.id = public.list_items.list_id and l.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.lists l where l.id = public.list_items.list_id and l.user_id = auth.uid())
  );

create policy list_items_delete_if_owner_of_list on public.list_items
  for delete
  using (
    exists (select 1 from public.lists l where l.id = public.list_items.list_id and l.user_id = auth.uid())
  );

-- Indexes for performance
create index if not exists idx_list_items_item on public.list_items(item_type, item_id);
create index if not exists idx_lists_user on public.lists(user_id);
