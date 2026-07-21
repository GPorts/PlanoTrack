-- Adaptive study loop: execution, FSRS reviews, errors, simulations and audit history.

alter table public.schedule_items
  add column if not exists status text not null default 'planned',
  add column if not exists rescheduled_from_id uuid references public.schedule_items(id) on delete set null,
  add column if not exists completion_percent integer not null default 0,
  add column if not exists completed_at timestamptz;

alter table public.schedule_items drop constraint if exists schedule_items_status_check;
alter table public.schedule_items add constraint schedule_items_status_check
  check (status in ('planned', 'in_progress', 'completed', 'partial', 'postponed', 'missed'));
alter table public.schedule_items drop constraint if exists schedule_items_completion_percent_check;
alter table public.schedule_items add constraint schedule_items_completion_percent_check
  check (completion_percent between 0 and 100);

update public.schedule_items
set status = 'completed', completion_percent = 100, completed_at = coalesce(completed_at, created_at)
where done = true and status <> 'completed';

alter table public.study_sessions
  add column if not exists topic_id uuid references public.topics(id) on delete set null,
  add column if not exists topic_title text,
  add column if not exists kind text,
  add column if not exists difficulty integer,
  add column if not exists confidence integer,
  add column if not exists completion_percent integer not null default 100,
  add column if not exists recall_rating text;

alter table public.study_sessions drop constraint if exists study_sessions_kind_check;
alter table public.study_sessions add constraint study_sessions_kind_check
  check (kind is null or kind in ('teoria', 'questoes', 'revisao', 'simulado'));
alter table public.study_sessions drop constraint if exists study_sessions_difficulty_check;
alter table public.study_sessions add constraint study_sessions_difficulty_check
  check (difficulty is null or difficulty between 1 and 4);
alter table public.study_sessions drop constraint if exists study_sessions_confidence_check;
alter table public.study_sessions add constraint study_sessions_confidence_check
  check (confidence is null or confidence between 1 and 5);
alter table public.study_sessions drop constraint if exists study_sessions_recall_rating_check;
alter table public.study_sessions add constraint study_sessions_recall_rating_check
  check (recall_rating is null or recall_rating in ('forgot', 'hard', 'good', 'easy'));

alter table public.topics
  add column if not exists mastery_score numeric not null default 0,
  add column if not exists manual_progress numeric,
  add column if not exists last_studied_at timestamptz,
  add column if not exists next_review_at timestamptz;

create table if not exists public.topic_review_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  due_at timestamptz not null default now(),
  stability numeric not null default 0,
  difficulty numeric not null default 0,
  scheduled_days integer not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  state integer not null default 0,
  last_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id)
);

create table if not exists public.review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  rating text not null check (rating in ('forgot', 'hard', 'good', 'easy')),
  previous_due_at timestamptz,
  next_due_at timestamptz not null,
  reviewed_at timestamptz not null default now()
);

create table if not exists public.error_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  subject_name text not null,
  topic_title text,
  title text not null,
  details text,
  error_type text not null check (error_type in ('content', 'interpretation', 'attention', 'calculation')),
  source text,
  resolved boolean not null default false,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.plan_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  reason text not null,
  before_schedule jsonb not null,
  after_schedule jsonb not null,
  applied boolean not null default false,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  reverted_at timestamptz
);

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  title text not null,
  simulated_at date not null default current_date,
  total_questions integer not null default 0,
  correct integer not null default 0,
  duration_minutes integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.simulation_results (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  subject_name text not null,
  questions integer not null default 0,
  correct integer not null default 0
);

create table if not exists public.study_events (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.study_plans(id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage_events (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.study_plans(id) on delete set null,
  operation text not null,
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.study_material_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  subject_name text not null,
  topic_title text,
  source_name text not null,
  generated_content jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default false,
  browser_enabled boolean not null default false,
  timezone text not null default 'America/Sao_Paulo',
  updated_at timestamptz not null default now()
);

alter table public.topic_review_states enable row level security;
alter table public.review_events enable row level security;
alter table public.error_entries enable row level security;
alter table public.plan_adjustments enable row level security;
alter table public.simulations enable row level security;
alter table public.simulation_results enable row level security;
alter table public.study_events enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.study_material_packs enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "review states own rows" on public.topic_review_states;
create policy "review states own rows" on public.topic_review_states for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "review events own rows" on public.review_events;
create policy "review events own rows" on public.review_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "error entries own rows" on public.error_entries;
create policy "error entries own rows" on public.error_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "plan adjustments own rows" on public.plan_adjustments;
create policy "plan adjustments own rows" on public.plan_adjustments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "simulations own rows" on public.simulations;
create policy "simulations own rows" on public.simulations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "simulation results through owned simulation" on public.simulation_results;
create policy "simulation results through owned simulation" on public.simulation_results for all
  using (exists (select 1 from public.simulations s where s.id = simulation_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.simulations s where s.id = simulation_id and s.user_id = auth.uid()));
drop policy if exists "study events own rows" on public.study_events;
create policy "study events own rows" on public.study_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "ai usage own rows" on public.ai_usage_events;
create policy "ai usage own rows" on public.ai_usage_events for select
  using (auth.uid() = user_id);
drop policy if exists "study material packs own rows" on public.study_material_packs;
create policy "study material packs own rows" on public.study_material_packs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "notification preferences own row" on public.notification_preferences;
create policy "notification preferences own row" on public.notification_preferences for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists schedule_items_plan_status_date_idx on public.schedule_items(plan_id, status, date);
create index if not exists topic_review_states_user_due_idx on public.topic_review_states(user_id, due_at);
create index if not exists error_entries_user_resolved_idx on public.error_entries(user_id, resolved, next_review_at);
create index if not exists simulations_plan_date_idx on public.simulations(plan_id, simulated_at desc);
create index if not exists study_events_user_name_date_idx on public.study_events(user_id, event_name, created_at desc);
create index if not exists ai_usage_events_user_operation_date_idx on public.ai_usage_events(user_id, operation, created_at desc);
create index if not exists study_material_packs_plan_date_idx on public.study_material_packs(plan_id, created_at desc);
