"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Clip = {
  month: string;
  duration_seconds: number;
  media_type: "audio" | "video";
  created_at: string;
};

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${m}:00`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MonthClipsSettings() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingMonth, setPlayingMonth] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackMediaType, setPlaybackMediaType] = useState<"audio" | "video">("audio");

  const loadClips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/month/clips");
      if (res.ok) {
        const data = (await res.json()) as { clips: Clip[] };
        setClips(data.clips ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClips();
  }, [loadClips]);

  const handlePlay = useCallback(async (month: string, mediaType: "audio" | "video") => {
    if (playingMonth === month && playbackUrl) {
      setPlayingMonth(null);
      setPlaybackUrl(null);
      return;
    }
    setPlayingMonth(month);
    setPlaybackUrl(null);
    try {
      const res = await fetch(`/api/month/clip?month=${encodeURIComponent(month)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { url: string; media_type?: "audio" | "video" };
      setPlaybackUrl(data.url);
      setPlaybackMediaType(data.media_type ?? "audio");
    } catch {
      setPlayingMonth(null);
    }
  }, [playingMonth, playbackUrl]);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-2">Monthly clips</h2>
      <p className="text-sm text-neutral-600 mb-4">
        Review your month clips. Each captures what you gained or lost and where you&apos;re headed.
      </p>
      <Link
        href="/month"
        className="inline-block px-4 py-2 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 mb-4"
      >
        Record month clip
      </Link>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : clips.length === 0 ? (
        <p className="text-sm text-neutral-500">No clips yet.</p>
      ) : (
        <ul className="space-y-3">
          {clips.map((clip) => (
            <li
              key={clip.month}
              className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatMonthLabel(clip.month)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(clip.created_at)} · {formatDuration(clip.duration_seconds)} ·{" "}
                    {clip.media_type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlay(clip.month, clip.media_type)}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {playingMonth === clip.month && playbackUrl ? "Hide" : "Play"}
                </button>
              </div>
              {playingMonth === clip.month && playbackUrl && (
                <div className="mt-1">
                  {playbackMediaType === "video" ? (
                    <video src={playbackUrl} controls className="w-full rounded-lg" />
                  ) : (
                    <audio src={playbackUrl} controls className="w-full" />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
