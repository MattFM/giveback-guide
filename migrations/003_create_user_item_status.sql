-- Create table to track per-user completion status for items (projects, stays)
create table if not exists public.user_item_status (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('project','stay')),
  item_id text not null,
  is_completed boolean not null default false,
  completed_at timestamptz null,
  completion_source text null default 'manual',
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_item_status_pk primary key (user_id, item_type, item_id)
);

-- Timestamp trigger for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_item_status_updated_at on public.user_item_status;
create trigger set_user_item_status_updated_at
before update on public.user_item_status
for each row execute function public.set_updated_at();

-- Enable Row Level Security
alter table public.user_item_status enable row level security;

-- Policies: each user manages only their own rows
drop policy if exists "Select own statuses" on public.user_item_status;
create policy "Select own statuses"
  on public.user_item_status for select
  using (auth.uid() = user_id);

drop policy if exists "Insert own statuses" on public.user_item_status;
create policy "Insert own statuses"
  on public.user_item_status for insert
  with check (auth.uid() = user_id);

drop policy if exists "Update own statuses" on public.user_item_status;
create policy "Update own statuses"
  on public.user_item_status for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Delete own statuses" on public.user_item_status;
create policy "Delete own statuses"
  on public.user_item_status for delete
  using (auth.uid() = user_id);

-- Helpful index (primary key already covers typical lookups)
create index if not exists user_item_status_user_type_id_idx
  on public.user_item_status (user_id, item_type, item_id);
