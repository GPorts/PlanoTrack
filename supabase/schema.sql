-- PlanoTrack MVP schema
-- Run this in the Supabase SQL editor after creating the project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_email text,
  provider text not null default 'cakto',
  provider_subscription_id text,
  provider_customer_id text,
  plan_code text not null,
  billing_cycle text not null check (billing_cycle in ('monthly', 'quarterly', 'annual')),
  status text not null default 'pending',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_provider_subscription_id_key
  on public.subscriptions(provider_subscription_id)
  where provider_subscription_id is not null;

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  exam_date date not null,
  mode text not null default 'manual',
  source_file_path text,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  name text not null,
  questions integer,
  weight numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  status text not null default 'pending',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  date date not null,
  period text not null,
  kind text not null,
  minutes integer not null,
  subject_name text not null,
  topic_title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_item_id uuid references public.schedule_items(id) on delete set null,
  minutes integer not null default 0,
  questions integer not null default 0,
  correct integer not null default 0,
  notes text,
  studied_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text not null,
  provider_payment_id text,
  status text not null,
  customer_email text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.study_plans enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.schedule_items enable row level security;
alter table public.study_sessions enable row level security;
alter table public.payments enable row level security;

create policy "profiles own row"
  on public.profiles for select
  using (auth.uid() = id);

create policy "subscriptions own rows"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "study plans own rows"
  on public.study_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "subjects through owned plan"
  on public.subjects for all
  using (exists (select 1 from public.study_plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.study_plans p where p.id = plan_id and p.user_id = auth.uid()));

create policy "topics through owned plan"
  on public.topics for all
  using (
    exists (
      select 1
      from public.subjects s
      join public.study_plans p on p.id = s.plan_id
      where s.id = subject_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.subjects s
      join public.study_plans p on p.id = s.plan_id
      where s.id = subject_id and p.user_id = auth.uid()
    )
  );

create policy "schedule through owned plan"
  on public.schedule_items for all
  using (exists (select 1 from public.study_plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.study_plans p where p.id = plan_id and p.user_id = auth.uid()));

create policy "sessions own rows"
  on public.study_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create function public.has_active_subscription(target_user uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.subscriptions
    where user_id = target_user
      and status in ('active', 'paid', 'trialing')
      and (
        current_period_end is null
        or current_period_end > now()
      )
  );
$$;
