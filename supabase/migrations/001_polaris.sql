-- Polaris schema + RLS

create extension if not exists "pgcrypto";

-- 1) profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  timezone text not null default 'America/New_York',
  notification_time time not null default '07:00',
  notifications_enabled boolean not null default false,
  last_notified_on date null,
  onboarding_completed boolean not null default false
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using ((select auth.uid()) = user_id);

create policy "profiles_update_own"
on public.profiles
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 2) daily_orientations
create table if not exists public.daily_orientations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  text text not null check (char_length(text) between 1 and 100),
  locked_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint daily_orientations_user_date_unique unique (user_id, date)
);

create index if not exists daily_orientations_date_idx on public.daily_orientations (date);
create index if not exists daily_orientations_user_date_idx on public.daily_orientations (user_id, date);

alter table public.daily_orientations enable row level security;

create policy "daily_orientations_select_own"
on public.daily_orientations
for select
using ((select auth.uid()) = user_id);

create policy "daily_orientations_insert_own"
on public.daily_orientations
for insert
with check ((select auth.uid()) = user_id);

-- No update/delete policies (immutable)

-- 3) push_subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text null,
  created_at timestamptz not null default now(),
  is_active boolean not null default true,
  constraint push_subscriptions_user_endpoint_unique unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
on public.push_subscriptions
for select
using ((select auth.uid()) = user_id);

create policy "push_subscriptions_insert_own"
on public.push_subscriptions
for insert
with check ((select auth.uid()) = user_id);

create policy "push_subscriptions_update_own"
on public.push_subscriptions
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

