"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const MAX_SECONDS = 60;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  currentMonthKey: string;
  currentMonthLabel: string;
  hasRecordedThisMonth: boolean;
};

export default function MonthRecordClient({
  currentMonthKey,
  currentMonthLabel,
  hasRecordedThisMonth,
}: Props) {
  const [status, setStatus] = useState<"idle" | "recording" | "stopped" | "uploading" | "done">(
    "idle",
  );
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setBlob(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime });
        setBlob(b);
        setStatus("stopped");
      };
      recorder.start(1000);
      setSeconds(0);
      setStatus("recording");
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      setError("Microphone access is needed to record.");
      setStatus("idle");
    }
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  const handleSave = useCallback(async () => {
    if (!blob) return;
    setStatus("uploading");
    setError(null);
    const form = new FormData();
    form.append("audio", blob);
    form.append("duration_seconds", String(seconds));
    const res = await fetch("/api/month/record", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Upload failed");
      setStatus("stopped");
      return;
    }
    setStatus("done");
    window.location.href = "/";
  }, [blob, seconds]);

  const loadPlayback = useCallback(async () => {
    setPlaybackLoading(true);
    setError(null);
    setPlaybackUrl(null);
    try {
      const res = await fetch(`/api/month/clip?month=${encodeURIComponent(currentMonthKey)}`);
      if (!res.ok) {
        setError(res.status === 404 ? "No clip found." : "Could not load clip.");
        return;
      }
      const data = (await res.json()) as { url: string };
      setPlaybackUrl(data.url);
    } catch {
      setError("Could not load clip.");
    } finally {
      setPlaybackLoading(false);
    }
  }, [currentMonthKey]);

  return (
    <div className="mx-auto w-full max-w-xl flex flex-col px-6 py-10 flex-1">
      <header className="flex items-center justify-between">
        <div className="text-sm font-medium tracking-wide text-neutral-900">Polaris</div>
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          Back
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-8 py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-neutral-900">Month clip</h1>
          <p className="text-sm text-neutral-500">
            Up to 60 seconds: what you gained or lost last month, and where you see yourself going
            this month.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {status === "idle" && (
          <div className="space-y-4">
            {hasRecordedThisMonth && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
                <p className="text-sm font-medium text-neutral-900">
                  Recorded for {currentMonthLabel}
                </p>
                {playbackUrl ? (
                  <audio src={playbackUrl} controls className="w-full" />
                ) : (
                  <button
                    type="button"
                    onClick={loadPlayback}
                    disabled={playbackLoading}
                    className="h-10 px-4 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {playbackLoading ? "Loading…" : "Play"}
                  </button>
                )}
                {playbackUrl && (
                  <button
                    type="button"
                    onClick={() => setPlaybackUrl(null)}
                    className="text-xs text-neutral-500 hover:text-neutral-700"
                  >
                    Hide player
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={startRecording}
              className="h-12 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
            >
              {hasRecordedThisMonth ? "Re-record" : "Start recording"}
            </button>
          </div>
        )}

        {status === "recording" && (
          <div className="space-y-4">
            <div className="text-center text-3xl font-mono tabular-nums text-neutral-900">
              {formatTime(seconds)} / 1:00
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="h-12 w-full rounded-lg bg-red-600 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            >
              Stop
            </button>
          </div>
        )}

        {(status === "stopped" || status === "uploading") && blob && (
          <div className="space-y-4">
            <div className="text-center text-sm text-neutral-500">
              Recorded {formatTime(seconds)}. Listen, then save or re-record.
            </div>
            <audio src={URL.createObjectURL(blob)} controls className="w-full" />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setBlob(null); setStatus("idle"); }}
                className="flex-1 h-12 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Re-record
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={status === "uploading"}
                className="flex-1 h-12 rounded-lg bg-neutral-900 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
              >
                {status === "uploading" ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {status === "done" && (
          <p className="text-center text-sm text-neutral-500">Saved. Taking you back…</p>
        )}
      </main>
    </div>
  );
}
