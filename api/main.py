"""
Chimege Transcribe — Python FastAPI Backend
Speaker diarization (pyannote) + Mongolian STT (Chimege API)
"""

import os
import uuid
import time
import tempfile
import subprocess
import logging
from pathlib import Path

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chimege Transcribe API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
HF_TOKEN = os.getenv("HF_TOKEN", "")
CHIMEGE_TOKEN = os.getenv("CHIMEGE_TOKEN", "")
CHIMEGE_LONG_TOKEN = os.getenv("CHIMEGE_LONG_TOKEN", "")

# Chimege API endpoint
CHIMEGE_API_URL = "https://api.chimege.com/v1.2/transcribe"

# Max segment length for Chimege (15 seconds)
MAX_SEGMENT_SECONDS = 15.0


class ProcessRequest(BaseModel):
    job_id: str
    audio_url: str
    callback_url: str


class StatusResponse(BaseModel):
    job_id: str
    status: str


# In-memory job status tracking
job_statuses: dict[str, str] = {}


def update_status(job_id: str, status: str, callback_url: str, **kwargs):
    """Update job status locally and notify the callback URL with retries."""
    job_statuses[job_id] = status
    payload = {"job_id": job_id, "status": status, **kwargs}
    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = requests.post(callback_url, json=payload, timeout=15)
            resp.raise_for_status()
            return
        except Exception as e:
            logger.error(f"Callback attempt {attempt + 1}/{max_retries} failed for {job_id}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # 1s, 2s backoff
    logger.error(f"All callback retries exhausted for {job_id} (status={status})")


def download_audio(url: str, dest: str) -> None:
    """Download audio file from signed URL."""
    resp = requests.get(url, stream=True, timeout=300)
    resp.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)


def convert_to_wav(input_path: str, output_path: str) -> float:
    """Convert audio to 16kHz mono WAV using ffmpeg. Returns duration in seconds."""
    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-ar", "16000", "-ac", "1", "-f", "wav",
        output_path,
    ]
    subprocess.run(cmd, capture_output=True, check=True)

    # Get duration
    probe_cmd = [
        "ffprobe", "-v", "quiet", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", output_path,
    ]
    result = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
    return float(result.stdout.strip())


def run_diarization(wav_path: str) -> list[dict]:
    """Run pyannote speaker diarization."""
    import torch
    from pyannote.audio import Pipeline

    # PyTorch 2.6+ defaults weights_only=True which breaks pyannote model loading.
    # These are trusted HuggingFace checkpoints, so override with weights_only=False.
    _original_load = torch.load
    torch.load = lambda *args, **kwargs: _original_load(*args, **{**kwargs, "weights_only": False})

    try:
        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=HF_TOKEN,
        )
    finally:
        torch.load = _original_load

    diarization = pipeline(wav_path)

    segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        segments.append({
            "speaker": speaker,
            "start": turn.start,
            "end": turn.end,
        })

    return segments


def merge_consecutive_segments(segments: list[dict], gap_threshold: float = 0.5) -> list[dict]:
    """Merge consecutive segments from the same speaker."""
    if not segments:
        return []

    merged = [segments[0].copy()]
    for seg in segments[1:]:
        last = merged[-1]
        if (
            seg["speaker"] == last["speaker"]
            and seg["start"] - last["end"] < gap_threshold
        ):
            last["end"] = seg["end"]
        else:
            merged.append(seg.copy())

    return merged


def split_long_segments(segments: list[dict], max_seconds: float = MAX_SEGMENT_SECONDS) -> list[dict]:
    """Split segments longer than max_seconds into smaller chunks."""
    result = []
    for seg in segments:
        duration = seg["end"] - seg["start"]
        if duration <= max_seconds:
            result.append(seg)
        else:
            start = seg["start"]
            while start < seg["end"]:
                end = min(start + max_seconds, seg["end"])
                result.append({
                    "speaker": seg["speaker"],
                    "start": start,
                    "end": end,
                })
                start = end
    return result


def extract_audio_segment(wav_path: str, start: float, end: float, output_path: str) -> None:
    """Extract a segment from a WAV file using ffmpeg."""
    duration = end - start
    cmd = [
        "ffmpeg", "-y", "-i", wav_path,
        "-ss", str(start), "-t", str(duration),
        "-ar", "16000", "-ac", "1", "-f", "wav",
        output_path,
    ]
    subprocess.run(cmd, capture_output=True, check=True)


def transcribe_segment(audio_path: str) -> str:
    """Transcribe a single audio segment using Chimege API."""
    token = CHIMEGE_LONG_TOKEN or CHIMEGE_TOKEN
    if not token:
        raise ValueError("CHIMEGE_TOKEN or CHIMEGE_LONG_TOKEN not set")

    with open(audio_path, "rb") as f:
        headers = {"token": token}
        resp = requests.post(
            CHIMEGE_API_URL,
            headers=headers,
            files={"file": ("audio.wav", f, "audio/wav")},
            timeout=60,
        )

    resp.raise_for_status()
    # Chimege returns Mongolian text — must decode as UTF-8
    return resp.content.decode("utf-8").strip()


def rename_speakers(segments: list[dict]) -> list[dict]:
    """Rename speakers from SPEAKER_00 to Илтгэгч 1, etc."""
    speaker_map: dict[str, str] = {}
    counter = 1
    for seg in segments:
        raw = seg["speaker"]
        if raw not in speaker_map:
            speaker_map[raw] = f"Илтгэгч {counter}"
            counter += 1
        seg["speaker"] = speaker_map[raw]
    return segments


@app.post("/process")
async def process_audio(req: ProcessRequest):
    """Main processing endpoint — downloads, diarizes, transcribes."""
    job_id = req.job_id
    job_statuses[job_id] = "processing"

    # Run in background (for production, use Celery/ARQ)
    import threading

    def _process():
        tmp_dir = tempfile.mkdtemp()
        try:
            # 1. Download
            update_status(job_id, "converting", req.callback_url)
            raw_path = os.path.join(tmp_dir, "raw_audio")
            download_audio(req.audio_url, raw_path)

            # 2. Convert to WAV
            wav_path = os.path.join(tmp_dir, "audio.wav")
            duration = convert_to_wav(raw_path, wav_path)
            logger.info(f"Job {job_id}: converted, duration={duration:.1f}s")

            # 3. Speaker diarization
            update_status(job_id, "diarizing", req.callback_url)
            raw_segments = run_diarization(wav_path)
            logger.info(f"Job {job_id}: diarization found {len(raw_segments)} segments")

            # 4. Merge and split
            merged = merge_consecutive_segments(raw_segments)
            chunks = split_long_segments(merged)
            logger.info(f"Job {job_id}: {len(chunks)} chunks after merge/split")

            # 5. Transcribe each chunk
            update_status(job_id, "transcribing", req.callback_url)
            results = []
            for i, chunk in enumerate(chunks):
                seg_path = os.path.join(tmp_dir, f"seg_{i}.wav")
                extract_audio_segment(wav_path, chunk["start"], chunk["end"], seg_path)
                try:
                    text = transcribe_segment(seg_path)
                    if text:
                        results.append({
                            "speaker": chunk["speaker"],
                            "start": round(chunk["start"], 2),
                            "end": round(chunk["end"], 2),
                            "text": text,
                        })
                except Exception as e:
                    logger.error(f"Job {job_id}: segment {i} transcription failed: {e}")
                    results.append({
                        "speaker": chunk["speaker"],
                        "start": round(chunk["start"], 2),
                        "end": round(chunk["end"], 2),
                        "text": f"[Алдаа: текст таних боломжгүй]",
                    })

            # 6. Rename speakers
            results = rename_speakers(results)

            # 7. Done
            update_status(
                job_id, "complete", req.callback_url,
                result={"segments": results},
                duration_seconds=duration,
            )
            logger.info(f"Job {job_id}: complete, {len(results)} segments")

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            update_status(
                job_id, "failed", req.callback_url,
                error_message=str(e),
            )
        finally:
            # Cleanup
            import shutil
            shutil.rmtree(tmp_dir, ignore_errors=True)

    thread = threading.Thread(target=_process, daemon=True)
    thread.start()

    return {"job_id": job_id, "status": "processing"}


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Get the current status of a job."""
    status = job_statuses.get(job_id, "unknown")
    return {"job_id": job_id, "status": status}


@app.get("/health")
async def health():
    return {"status": "ok"}
