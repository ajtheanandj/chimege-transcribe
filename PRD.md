# PRD: Хурлын Тэмдэглэл — Mongolian Meeting Transcriber SaaS

## Stack
- **Frontend:** Next.js 14+ (App Router) with Supabase starter kit (already set up)
- **Auth:** Supabase Auth (already in place — login, signup, password reset all working)
- **DB:** Supabase Postgres (use Supabase client, NOT Prisma)
- **UI:** Tailwind CSS + shadcn/ui (already configured)
- **Backend processing:** Python FastAPI (separate api/ directory)
- **Payments:** Polar.sh (@polar-sh/sdk)

## What EXISTS (do NOT rebuild)
- Auth flow (login, signup, forgot password, update password)
- Supabase client setup (lib/supabase/client.ts, server.ts)
- Protected route layout (app/protected/)
- Theme switcher (dark/light mode)
- shadcn/ui components (button, card, badge, input, label, etc.)
- Tailwind config
- Basic layout with header/footer

## What to BUILD

### 1. Landing Page (replace app/page.tsx)
- Professional, stunning landing page for Mongolian businesses
- Hero: "Хурлын бичлэгээ текст болго" / "Turn meeting recordings into text"
- Bilingual (Mongolian primary, English secondary)
- How it works: 3 steps (Upload → AI Processes → Download)
- Features: Speaker diarization, Mongolian accuracy, timestamps
- Pricing section (pay-per-minute + subscription)
- FAQ
- CTA buttons linking to /auth/sign-up
- Color: indigo/blue primary, professional dark/light
- Mobile responsive, smooth animations

### 2. Database Tables (Supabase SQL)
Create a migration file (supabase/migrations/001_init.sql):
```sql
-- Transcriptions table
create table transcriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  file_name text not null,
  file_url text,
  duration_seconds integer,
  status text default 'pending' check (status in ('pending', 'processing', 'converting', 'diarizing', 'transcribing', 'complete', 'failed')),
  result jsonb,
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Usage tracking
create table usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  minutes_used numeric default 0,
  month text not null, -- '2026-02'
  unique(user_id, month)
);

-- RLS policies
alter table transcriptions enable row level security;
create policy "Users see own transcriptions" on transcriptions for select using (auth.uid() = user_id);
create policy "Users insert own transcriptions" on transcriptions for insert with check (auth.uid() = user_id);

alter table usage enable row level security;
create policy "Users see own usage" on usage for select using (auth.uid() = user_id);
```

### 3. Dashboard (app/protected/page.tsx — replace existing)
- List of past transcriptions with status badges
- Click to view full transcript
- Usage stats (minutes used this month)
- "New Transcription" button → /protected/transcribe

### 4. Transcribe Page (app/protected/transcribe/page.tsx)
- Drag & drop file upload (mp3, wav, ogg, m4a, webm)
- Upload to Supabase Storage bucket
- Show processing status with steps: Converting → Detecting speakers → Transcribing
- Poll for status updates
- Results view: formatted transcript with speaker labels + timestamps
- Download as TXT, copy to clipboard
- Audio player synced with transcript

### 5. Transcript View (app/protected/transcription/[id]/page.tsx)
- View completed transcription
- Speaker-labeled, timestamped output
- Audio player
- Download/share options

### 6. API Routes
- POST /api/transcribe — accept file, save to Supabase Storage, trigger Python backend
- GET /api/transcribe/[id] — get transcription status from Supabase
- POST /api/webhook/polar — Polar.sh payment webhooks
- POST /api/process-callback — Python backend calls this when done

### 7. Python Backend (api/ directory)
- FastAPI app
- POST /process — receives job_id + audio_url, runs:
  1. Download audio from Supabase Storage URL
  2. Convert to 16kHz mono WAV via ffmpeg
  3. Run pyannote speaker diarization (speaker-diarization-3.1)
  4. Split into segments, merge consecutive same-speaker
  5. Transcribe each segment via Chimege API (max 15s chunks)
  6. Handle UTF-8 properly (use resp.content.decode('utf-8'))
  7. POST result back to Next.js callback endpoint (or update Supabase directly)
- GET /status/{job_id}
- Include requirements.txt: fastapi, uvicorn, pyannote.audio, requests, python-multipart
- HF_TOKEN for pyannote: in .env
- CHIMEGE_TOKEN for STT: in .env

### 8. Payments (Polar.sh)
- Checkout integration using @polar-sh/sdk
- Org slug: "ananda"
- Pricing page component
- Webhook handler
- DO NOT create actual products — just wire up the code
- Track credits in usage table

### 9. Supabase Storage
- Create 'audio' bucket for uploaded files
- Generate signed URLs for Python backend to download

## .env.example additions
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CHIMEGE_TOKEN=
CHIMEGE_LONG_TOKEN=
HF_TOKEN=
POLAR_ACCESS_TOKEN=
PYTHON_API_URL=http://localhost:8000
```

## Design
- Professional, clean — for Mongolian businesses (not playful)
- Mongolian text must render beautifully
- indigo/blue primary, slate neutrals
- Use existing theme switcher for dark/light mode
