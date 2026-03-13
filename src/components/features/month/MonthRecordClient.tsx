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
  const [mediaType, setMediaType] = useState<"audio" | "video">("audio");
  const [status, setStatus] = useState<"idle" | "recording" | "stopped" | "uploading" | "done">(
    "idle",
  );
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackMediaType, setPlaybackMediaType] = useState<"audio" | "video">("audio");
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
      const isVideo = mediaType === "video";
      const stream = await navigator.mediaDevices.getUserMedia(
        isVideo ? { video: true, audio: true } : { audio: true },
      );
      streamRef.current = stream;
      const mime = isVideo
        ? (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
            ? "video/webm;codecs=vp9,opus"
            : "video/webm")
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
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
      setError(
        mediaType === "video"
          ? "Camera and microphone access are needed to record."
          : "Microphone access is needed to record.",
      );
      setStatus("idle");
    }
  }, [stopRecording, mediaType]);

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
    form.append("clip", blob, "clip.webm");
    form.append("duration_seconds", String(seconds));
    form.append("media_type", mediaType);
    const res = await fetch("/api/month/record", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Upload failed");
      setStatus("stopped");
      return;
    }
    setStatus("done");
    window.location.href = "/";
  }, [blob, seconds, mediaType]);

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
      const data = (await res.json()) as { url: string; media_type?: "audio" | "video" };
      setPlaybackUrl(data.url);
      setPlaybackMediaType(data.media_type ?? "audio");
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
            Up to 60 seconds: look back, then look ahead.
          </p>
        </div>

        {/* Brief prompts to think before recording */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 px-4 py-3 space-y-1.5">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Think about</p>
          <ul className="text-sm text-neutral-600 space-y-1 list-none">
            <li>· What did you gain or lose last month?</li>
            <li>· Where do you want to be by the end of this month?</li>
            <li>· What will you let go of? What will you lean into?</li>
          </ul>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {status === "idle" && (
          <div className="space-y-4">
            {/* Audio / Video selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMediaType("audio")}
                className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-colors ${
                  mediaType === "audio"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                Audio
              </button>
              <button
                type="button"
                onClick={() => setMediaType("video")}
                className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-colors ${
                  mediaType === "video"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                Video
              </button>
            </div>

            {hasRecordedThisMonth && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
                <p className="text-sm font-medium text-neutral-900">
                  Recorded for {currentMonthLabel}
                </p>
                {playbackUrl ? (
                  playbackMediaType === "video" ? (
                    <video src={playbackUrl} controls className="w-full rounded-lg" />
                  ) : (
                    <audio src={playbackUrl} controls className="w-full" />
                  )
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
              Recorded {formatTime(seconds)}. {mediaType === "video" ? "Watch" : "Listen"}, then save or re-record.
            </div>
            {mediaType === "video" ? (
              <video src={URL.createObjectURL(blob)} controls className="w-full rounded-lg" />
            ) : (
              <audio src={URL.createObjectURL(blob)} controls className="w-full" />
            )}
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
