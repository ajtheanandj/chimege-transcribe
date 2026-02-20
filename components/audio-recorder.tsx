"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type RecorderState = "idle" | "recording" | "paused" | "stopped";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(new Array(40).fill(0));
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startVisualization = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(data);
      // Sample 40 bars from frequency data
      const barCount = 40;
      const step = Math.floor(data.length / barCount);
      const newLevels: number[] = [];
      for (let i = 0; i < barCount; i++) {
        const val = data[i * step] / 255;
        newLevels.push(val);
      }
      setLevels(newLevels);
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      // Set up audio analyser for waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(blob, elapsed);
      };

      recorder.start(1000); // collect data every second
      mediaRecorderRef.current = recorder;

      // Start timer
      startTimeRef.current = Date.now();
      pausedElapsedRef.current = 0;
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const total =
          pausedElapsedRef.current +
          Math.floor((now - startTimeRef.current) / 1000);
        setElapsed(total);
      }, 200);

      setState("recording");
      startVisualization();

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Микрофон ашиглах зөвшөөрөл хэрэгтэй");
      } else {
        setError("Микрофон олдсонгүй");
      }
    }
  }, [elapsed, onRecordingComplete, startVisualization]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      pausedElapsedRef.current = elapsed;
      setLevels(new Array(40).fill(0));
      setState("paused");
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }, [elapsed]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const total =
          pausedElapsedRef.current +
          Math.floor((now - startTimeRef.current) / 1000);
        setElapsed(total);
      }, 200);

      setState("recording");
      startVisualization();
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }, [startVisualization]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setLevels(new Array(40).fill(0));
    setState("stopped");
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Waveform visualization */}
      <div className="w-full h-24 flex items-center justify-center gap-[2px] px-4">
        {levels.map((level, i) => (
          <motion.div
            key={i}
            className={`w-1.5 rounded-full ${
              state === "recording"
                ? "bg-primary"
                : state === "paused"
                  ? "bg-muted-foreground/30"
                  : "bg-muted-foreground/10"
            }`}
            animate={{
              height: state === "recording" ? Math.max(4, level * 80) : 4,
            }}
            transition={{ duration: 0.1 }}
          />
        ))}
      </div>

      {/* Timer */}
      <AnimatePresence mode="wait">
        {state !== "idle" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            <p className="text-4xl font-mono font-bold tabular-nums">
              {formatTime(elapsed)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {state === "recording"
                ? "Бичиж байна..."
                : state === "paused"
                  ? "Түр зогссон"
                  : "Дууссан"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {state === "idle" && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <button
              onClick={startRecording}
              className="relative w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
              aria-label="Бичлэг эхлүүлэх"
            >
              {/* Pulsing ring */}
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <Mic className="h-10 w-10 relative z-10" />
            </button>
            <p className="text-center text-sm text-muted-foreground mt-3 font-medium">
              Бичлэг эхлүүлэх
            </p>
            <p className="text-center text-xs text-muted-foreground/60">
              Start recording
            </p>
          </motion.div>
        )}

        {state === "recording" && (
          <>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={pauseRecording}
              aria-label="Түр зогсоох"
            >
              <Pause className="h-6 w-6" />
            </Button>
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:bg-destructive/90 active:scale-95 transition-transform"
              aria-label="Зогсоох"
            >
              <Square className="h-8 w-8" fill="currentColor" />
            </button>
          </>
        )}

        {state === "paused" && (
          <>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={resumeRecording}
              aria-label="Үргэлжлүүлэх"
            >
              <Play className="h-6 w-6" />
            </Button>
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:bg-destructive/90 active:scale-95 transition-transform"
              aria-label="Зогсоох"
            >
              <Square className="h-8 w-8" fill="currentColor" />
            </button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
