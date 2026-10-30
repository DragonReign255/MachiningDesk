-- Machining Desk V1.12.2: moderated community catalog.
-- Run once in the Supabase SQL Editor as project administrator.
-- Does not modify the existing md_cloud_snapshots or private sync function.
-- This migration is safe to re-run; it never grants admin access automatically.

create table if not exists public.md_community_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.md_community_admins enable row level security;
revoke all on public.md_community_admins from public, anon, authenticated;
grant select on public.md_community_admins to authenticated;
drop policy if exists md_community_admin_check_self on public.md_community_admins;
create policy md_community_admin_check_self on public.md_community_admins
  for select to authenticated using (user_id = (select auth.uid()));
-- Only the SQL Editor / privileged project owner can add administrator UUIDs.

create table if not exists public.md_community_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null check (category in ('machines', 'tools', 'materials', 'coatings')),
  name text not null check (char_length(name) between 1 and 140),
  record jsonb not null check (
    jsonb_typeof(record) = 'object' and octet_length(record::text) between 2 and 65536
  ),
  evidence_url text not null default '' check (
    char_length(evidence_url) <= 500 and
    (evidence_url = '' or evidence_url ~ '^https://[^[:space:]]+$')
  ),
  submitter_note text not null default '' check (char_length(submitter_note) <= 2000),
  submitted_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reviewer_note text not null default '' check (char_length(reviewer_note) <= 2000)
);
create index if not exists md_community_submissions_owner_idx on public.md_community_submissions (user_id, submitted_at desc);
create index if not exists md_community_submissions_review_idx on public.md_community_submissions (status, submitted_at asc);
alter table public.md_community_submissions enable row level security;
revoke all on public.md_community_submissions from public, anon, authenticated;
grant select, insert, update on public.md_community_submissions to authenticated;
drop policy if exists md_community_submissions_read on public.md_community_submissions;
drop policy if exists md_community_submissions_create on public.md_community_submissions;
drop policy if exists md_community_submissions_review on public.md_community_submissions;
create policy md_community_submissions_read on public.md_community_submissions
  for select to authenticated using (
    user_id = (select auth.uid()) or
    exists (select 1 from public.md_community_admins a where a.user_id = (select auth.uid()))
  );
create policy md_community_submissions_create on public.md_community_submissions
  for insert to authenticated with check (
    user_id = (select auth.uid()) and status = 'pending' and
    reviewed_by is null and reviewed_at is null and reviewer_note = ''
  );
create policy md_community_submissions_review on public.md_community_submissions
  for update to authenticated using (
    exists (select 1 from public.md_community_admins a where a.user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.md_community_admins a where a.user_id = (select auth.uid()))
  );

create table if not exists public.md_community_entries (
  submission_id uuid primary key references public.md_community_submissions(id) on delete cascade,
  category text not null check (category in ('machines', 'tools', 'materials', 'coatings')),
  name text not null check (char_length(name) between 1 and 140),
  record jsonb not null check (jsonb_typeof(record) = 'object' and octet_length(record::text) <= 65536),
  evidence_url text not null default '',
  approved_at timestamptz not null default now()
);
create index if not exists md_community_entries_category_idx on public.md_community_entries (category, approved_at desc);
alter table public.md_community_entries enable row level security;
revoke all on public.md_community_entries from public, anon, authenticated;
grant select, insert on public.md_community_entries to authenticated;
drop policy if exists md_community_entries_read on public.md_community_entries;
drop policy if exists md_community_entries_approve on public.md_community_entries;
create policy md_community_entries_read on public.md_community_entries
  for select to authenticated using (true);
create policy md_community_entries_approve on public.md_community_entries
  for insert to authenticated with check (
    exists (select 1 from public.md_community_admins a where a.user_id = (select auth.uid()))
  );

-- Review and publication are one transaction. SECURITY INVOKER means both
-- RLS and the explicit admin membership check apply to the caller.
create or replace function public.md_decide_submission(
  p_submission_id uuid, p_approve boolean, p_reviewer_note text default ''
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_row public.md_community_submissions%rowtype;
  v_uid uuid;
begin
  v_uid := (select auth.uid());
  if v_uid is null or not exists (
    select 1 from public.md_community_admins where user_id = v_uid
  ) then raise exception 'Only a Machining Desk administrator may review submissions'; end if;
  if p_approve is null then raise exception 'A review decision is required'; end if;
  if char_length(coalesce(p_reviewer_note,'')) > 2000 then raise exception 'Review note too long'; end if;
  select * into v_row from public.md_community_submissions
    where id=p_submission_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if v_row.status <> 'pending' then raise exception 'This submission has already been reviewed'; end if;
  if p_approve then
    insert into public.md_community_entries(submission_id,category,name,record,evidence_url)
    values(v_row.id,v_row.category,v_row.name,v_row.record,v_row.evidence_url);
  end if;
  update public.md_community_submissions set
    status = case when p_approve then 'approved' else 'rejected' end,
    reviewed_by = v_uid, reviewed_at = now(), reviewer_note = coalesce(p_reviewer_note,'')
  where id = v_row.id;
  return jsonb_build_object('ok',true,'status',case when p_approve then 'approved' else 'rejected' end);
end;
$$;
revoke all on function public.md_decide_submission(uuid,boolean,text) from public, anon;
grant execute on function public.md_decide_submission(uuid,boolean,text) to authenticated;

-- IMPORTANT: After running this migration, grant admin to YOUR AUTH USER UUID
-- via SQL Editor. Find it in Authentication -> Users, then run:
-- insert into public.md_community_admins (user_id)
-- values ('REPLACE_WITH_YOUR_AUTH_USER_UUID') on conflict do nothing;
-- Never put privileged credentials or admin UUIDs into JavaScript.
