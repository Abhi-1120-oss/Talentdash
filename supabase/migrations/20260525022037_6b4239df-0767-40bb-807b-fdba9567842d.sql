
create table public.user_career_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  role text not null,
  level text,
  location text,
  experience_years numeric not null default 0,
  base_salary bigint not null,
  bonus bigint not null default 0,
  stock bigint not null default 0,
  total_compensation bigint generated always as (base_salary + bonus + stock) stored,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_career_entries_user_idx on public.user_career_entries(user_id, start_date desc);

alter table public.user_career_entries enable row level security;

create policy "users select own career"
  on public.user_career_entries for select to authenticated
  using (auth.uid() = user_id);

create policy "users insert own career"
  on public.user_career_entries for insert to authenticated
  with check (auth.uid() = user_id);

create policy "users update own career"
  on public.user_career_entries for update to authenticated
  using (auth.uid() = user_id);

create policy "users delete own career"
  on public.user_career_entries for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger user_career_entries_touch
before update on public.user_career_entries
for each row execute function public.touch_updated_at();
