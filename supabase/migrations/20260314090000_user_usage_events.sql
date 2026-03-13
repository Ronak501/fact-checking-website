create table if not exists public.user_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  latency_ms integer not null default 0,
  status text not null check (status in ('success', 'error')),
  estimated boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_usage_events_user_created
  on public.user_usage_events (user_id, created_at desc);

alter table public.user_usage_events enable row level security;

create policy "Users can view own usage events"
  on public.user_usage_events
  for select
  using (auth.uid() = user_id);

create policy "Service role can insert usage events"
  on public.user_usage_events
  for insert
  with check (true);
