create extension if not exists pgcrypto;
create table if not exists public.proms_sync_accounts (
  sync_id text primary key,
  secret_hash text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.proms_sync_accounts enable row level security;
insert into storage.buckets (id,name,public) values ('proms-tickets','proms-tickets',false)
on conflict (id) do update set public=false;
