-- ============================================
-- Chimege Transcribe: Database Schema
-- ============================================

-- Storage bucket for audio files
insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do nothing;

-- Storage policy: users can upload to their own folder
create policy "Users upload own audio"
on storage.objects for insert
with check (
  bucket_id = 'audio'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: users can read their own audio
create policy "Users read own audio"
on storage.objects for select
using (
  bucket_id = 'audio'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: service role can read all audio (for Python backend)
create policy "Service role reads all audio"
on storage.objects for select
using (
  bucket_id = 'audio'
  and auth.role() = 'service_role'
);

-- ============================================
-- Transcriptions table
-- ============================================
create table transcriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  file_url text,
  duration_seconds integer,
  status text default 'pending' check (status in ('pending', 'processing', 'converting', 'diarizing', 'transcribing', 'complete', 'failed')),
  result jsonb,
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- RLS policies for transcriptions
alter table transcriptions enable row level security;

create policy "Users see own transcriptions"
on transcriptions for select
using (auth.uid() = user_id);

create policy "Users insert own transcriptions"
on transcriptions for insert
with check (auth.uid() = user_id);

create policy "Users update own transcriptions"
on transcriptions for update
using (auth.uid() = user_id);

-- Service role policy for Python backend callbacks
create policy "Service role manages all transcriptions"
on transcriptions for all
using (auth.role() = 'service_role');

-- ============================================
-- Usage tracking table
-- ============================================
create table usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  minutes_used numeric default 0,
  month text not null, -- format: '2026-02'
  unique(user_id, month)
);

-- RLS policies for usage
alter table usage enable row level security;

create policy "Users see own usage"
on usage for select
using (auth.uid() = user_id);

create policy "Users insert own usage"
on usage for insert
with check (auth.uid() = user_id);

create policy "Service role manages all usage"
on usage for all
using (auth.role() = 'service_role');

-- ============================================
-- Indexes
-- ============================================
create index idx_transcriptions_user_id on transcriptions(user_id);
create index idx_transcriptions_status on transcriptions(status);
create index idx_transcriptions_created_at on transcriptions(created_at desc);
create index idx_usage_user_month on usage(user_id, month);
