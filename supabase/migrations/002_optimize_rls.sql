-- Optimize RLS policies to prevent unnecessary re-evaluation
-- Replace auth.uid() with (select auth.uid()) to improve query performance
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Drop existing policies
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "daily_orientations_select_own" on public.daily_orientations;
drop policy if exists "daily_orientations_insert_own" on public.daily_orientations;
drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;

-- Recreate profiles policies with optimization
create policy "profiles_select_own"
on public.profiles
for select
using ((select auth.uid()) = user_id);

create policy "profiles_update_own"
on public.profiles
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Recreate daily_orientations policies with optimization
create policy "daily_orientations_select_own"
on public.daily_orientations
for select
using ((select auth.uid()) = user_id);

create policy "daily_orientations_insert_own"
on public.daily_orientations
for insert
with check ((select auth.uid()) = user_id);

-- Recreate push_subscriptions policies with optimization
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
