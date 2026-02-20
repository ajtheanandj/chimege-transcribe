# Хурлын Тэмдэглэл — Mongolian Meeting Transcriber

AI-powered Mongolian speech-to-text SaaS with speaker diarization. Upload meeting recordings, get speaker-labeled transcripts with timestamps.

## Stack

- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, Framer Motion
- **Auth:** Supabase Auth (email/password)
- **Database:** Supabase Postgres with RLS
- **Storage:** Supabase Storage (audio files)
- **Backend:** Python FastAPI (pyannote + Chimege API)
- **Payments:** Polar.sh

## Features

- Drag & drop audio upload (MP3, WAV, OGG, M4A, WebM)
- AI speaker diarization (pyannote 3.1)
- Mongolian speech-to-text (Chimege API)
- Real-time processing status updates
- Speaker-labeled transcripts with timestamps
- Copy to clipboard / download as TXT
- Bilingual UI (Mongolian + English)
- Dark/light theme
- Usage tracking per month

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd chimege-transcribe
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration: `supabase/migrations/001_init.sql`
3. Create an `audio` storage bucket (the migration handles this)

### 3. Configure environment

```bash
cp .env.example .env.local
# Fill in all values
```

### 4. Run the Next.js app

```bash
npm run dev
```

### 5. Run the Python backend

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Project Structure

```
app/
  page.tsx                          # Landing page
  protected/
    page.tsx                        # Dashboard
    transcribe/page.tsx             # Upload + processing
    transcription/[id]/page.tsx     # View transcript
  api/
    transcribe/route.ts             # POST: start transcription
    transcribe/[id]/route.ts        # GET: check status
    process-callback/route.ts       # POST: Python backend callback
    webhook/polar/route.ts          # POST: Polar.sh webhooks
api/
  main.py                          # Python FastAPI backend
  requirements.txt
components/
  transcript-viewer.tsx             # Interactive transcript display
  ui/                               # shadcn/ui components
supabase/
  migrations/001_init.sql           # Database schema
```

## API Tokens Required

| Token | Source | Purpose |
|-------|--------|---------|
| `CHIMEGE_TOKEN` | [chimege.com](https://chimege.com) | Mongolian speech-to-text |
| `HF_TOKEN` | [huggingface.co](https://huggingface.co) | Pyannote speaker diarization |
| `POLAR_ACCESS_TOKEN` | [polar.sh](https://polar.sh) | Payment processing |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard | Backend database access |

## Processing Pipeline

1. User uploads audio file to Supabase Storage
2. Next.js API creates transcription record and triggers Python backend
3. Python backend:
   - Downloads audio via signed URL
   - Converts to 16kHz mono WAV (ffmpeg)
   - Runs pyannote speaker diarization
   - Merges consecutive same-speaker segments
   - Splits long segments into 15s chunks
   - Transcribes each chunk via Chimege API (UTF-8)
   - Renames speakers (Илтгэгч 1, 2, 3...)
4. Results posted back to Next.js callback endpoint
5. Frontend polls for status and displays results

## License

MIT
