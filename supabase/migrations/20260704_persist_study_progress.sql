alter table public.subjects
  add column if not exists color text,
  add column if not exists progress numeric not null default 0;

alter table public.topics
  add column if not exists due_date date;

alter table public.study_sessions
  add column if not exists subject_name text;
