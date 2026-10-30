-- Machining Desk V1.12.3: community proposals, voting, private bug reports,
-- and opt-in publication of reviewed spindle-load shop observations.
-- Applies to the existing V1.12.2 project; no cloud snapshot changes.
-- Idempotent for safe reruns. Reviewed data is NOT manufacturer certification.

-- Extend the existing moderated queue and approved reference catalog.
alter table public.md_community_submissions drop constraint if exists md_community_submissions_category_check;
alter table public.md_community_submissions add constraint md_community_submissions_category_check
  check (category in ('machines','tools','materials','coatings','spindle_tests'));
alter table public.md_community_entries drop constraint if exists md_community_entries_category_check;
alter table public.md_community_entries add constraint md_community_entries_category_check
  check (category in ('machines','tools','materials','coatings','spindle_tests'));

create table if not exists public.md_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null check (category in ('calculator','chart','machining','database','interface','machine','other')),
  title text not null check (char_length(title) between 5 and 140),
  description text not null check (char_length(description) between 20 and 4000),
  status text not null default 'submitted' check (status in ('submitted','under_review','planned','in_progress','completed','declined')),
  planned_version text not null default '' check (char_length(planned_version)<=32),
  owner_note text not null default '' check (char_length(owner_note)<=1000),
  vote_count integer not null default 0 check (vote_count>=0),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists md_ideas_date_idx on public.md_ideas(submitted_at desc);
create index if not exists md_ideas_votes_idx on public.md_ideas(vote_count desc,submitted_at desc);
alter table public.md_ideas enable row level security;
revoke all on public.md_ideas from public,anon,authenticated;
grant select,insert on public.md_ideas to authenticated;
grant update(status,planned_version,owner_note,updated_at) on public.md_ideas to authenticated;
drop policy if exists md_ideas_read on public.md_ideas;
drop policy if exists md_ideas_insert on public.md_ideas;
drop policy if exists md_ideas_review on public.md_ideas;
create policy md_ideas_read on public.md_ideas for select to authenticated using (true);
create policy md_ideas_insert on public.md_ideas for insert to authenticated with check (
  user_id=(select auth.uid()) and status='submitted' and planned_version='' and
  owner_note='' and vote_count=0
);
create policy md_ideas_review on public.md_ideas for update to authenticated
  using(exists(select 1 from public.md_community_admins a where a.user_id=(select auth.uid())))
  with check(exists(select 1 from public.md_community_admins a where a.user_id=(select auth.uid())));

create table if not exists public.md_idea_votes (
  idea_id uuid not null references public.md_ideas(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  voted_at timestamptz not null default now(),
  primary key (idea_id,user_id)
);
create index if not exists md_idea_votes_user_idx on public.md_idea_votes(user_id);
alter table public.md_idea_votes enable row level security;
revoke all on public.md_idea_votes from public,anon,authenticated;
grant select,insert,delete on public.md_idea_votes to authenticated;
drop policy if exists md_idea_votes_own_read on public.md_idea_votes;
drop policy if exists md_idea_votes_own_insert on public.md_idea_votes;
drop policy if exists md_idea_votes_own_delete on public.md_idea_votes;
create policy md_idea_votes_own_read on public.md_idea_votes for select to authenticated using(user_id=(select auth.uid()));
create policy md_idea_votes_own_insert on public.md_idea_votes for insert to authenticated with check(user_id=(select auth.uid()));
create policy md_idea_votes_own_delete on public.md_idea_votes for delete to authenticated using(user_id=(select auth.uid()));

-- Public vote totals are maintained transactionally without revealing individual
-- voter IDs. The trigger has narrowly defined privileges and is inaccessible
-- as an exposed RPC function (md_internal is not an exposed API schema).
create schema if not exists md_internal;
revoke all on schema md_internal from public, anon, authenticated;
create or replace function md_internal.md_adjust_vote_count()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    update public.md_ideas set vote_count=vote_count+1 where id=new.idea_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.md_ideas set vote_count=greatest(0,vote_count-1) where id=old.idea_id;
    return old;
  end if;
  return null;
end;
$$;
revoke all on function md_internal.md_adjust_vote_count() from public, anon, authenticated;
drop trigger if exists md_vote_count_sync on public.md_idea_votes;
create trigger md_vote_count_sync after insert or delete on public.md_idea_votes
  for each row execute function md_internal.md_adjust_vote_count();

-- Private, owner-reviewed bug and data-error reports.
create table if not exists public.md_community_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null check(category in ('technical_data','calculation','bug','other')),
  location text not null default '' check(char_length(location)<=140),
  title text not null check(char_length(title) between 5 and 140),
  details text not null check(char_length(details) between 15 and 4000),
  app_version text not null default '' check(char_length(app_version)<=32),
  status text not null default 'submitted' check(status in ('submitted','under_review','resolved','declined')),
  owner_note text not null default '' check(char_length(owner_note)<=1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists md_reports_owner_idx on public.md_community_reports(user_id,created_at desc);
create index if not exists md_reports_review_idx on public.md_community_reports(status,created_at asc);
alter table public.md_community_reports enable row level security;
revoke all on public.md_community_reports from public,anon,authenticated;
grant select,insert on public.md_community_reports to authenticated;
grant update(status,owner_note,updated_at) on public.md_community_reports to authenticated;
drop policy if exists md_reports_read on public.md_community_reports;
drop policy if exists md_reports_insert on public.md_community_reports;
drop policy if exists md_reports_review on public.md_community_reports;
create policy md_reports_read on public.md_community_reports for select to authenticated using (
  user_id=(select auth.uid()) or exists(select 1 from public.md_community_admins a where a.user_id=(select auth.uid()))
);
create policy md_reports_insert on public.md_community_reports for insert to authenticated with check (
  user_id=(select auth.uid()) and status='submitted' and owner_note=''
);
create policy md_reports_review on public.md_community_reports for update to authenticated
  using(exists(select 1 from public.md_community_admins a where a.user_id=(select auth.uid())))
  with check(exists(select 1 from public.md_community_admins a where a.user_id=(select auth.uid())));
