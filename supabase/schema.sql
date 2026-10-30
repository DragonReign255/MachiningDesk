-- Machining Desk private cloud snapshots, V1.12.0.
-- Execute once in the Supabase project's SQL Editor. Do not run it in GitHub Actions.
create table if not exists public.md_cloud_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) < 8388608),
  updated_at timestamptz not null default now()
);

alter table public.md_cloud_snapshots enable row level security;
revoke all on public.md_cloud_snapshots from public, anon, authenticated;
grant select, insert, update on public.md_cloud_snapshots to authenticated;

create policy "md_snapshot_read_own" on public.md_cloud_snapshots
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "md_snapshot_insert_own" on public.md_cloud_snapshots
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "md_snapshot_update_own" on public.md_cloud_snapshots
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Atomic optimistic-concurrency write: prevents a stale device overwriting another.
create or replace function public.md_save_snapshot(p_expected bigint,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare new_rev bigint;
begin
  if (select auth.uid()) is null then raise exception 'Sign in required'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text) >= 8388608 then
    raise exception 'Invalid or oversized snapshot';
  end if;
  update public.md_cloud_snapshots
  set payload=p_payload, revision=revision+1, updated_at=now()
  where user_id=(select auth.uid()) and revision=p_expected
  returning revision into new_rev;
  if new_rev is not null then return jsonb_build_object('ok',true,'revision',new_rev); end if;
  if p_expected=0 then
    insert into public.md_cloud_snapshots(user_id,revision,payload)
    values ((select auth.uid()),1,p_payload)
    on conflict (user_id) do nothing returning revision into new_rev;
    if new_rev is not null then return jsonb_build_object('ok',true,'revision',new_rev); end if;
  end if;
  return jsonb_build_object('ok',false,'conflict',true);
end;
$$;
revoke all on function public.md_save_snapshot(bigint,jsonb) from public, anon;
grant execute on function public.md_save_snapshot(bigint,jsonb) to authenticated;
