"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { LogoutButton } from "@/components/layout/LogoutButton";
import Link from "next/link";
import { ReminderSettings } from "@/components/features/reminder/ReminderSettings";
import { AlarmModal } from "@/components/features/reminder/AlarmModal";

type Props = {
  initialLockedText: string | null;
  placeholder: string;
};

export default function TodayClient({ initialLockedText, placeholder }: Props) {
  const [lockedText, setLockedText] = useState<string | null>(initialLockedText);
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justLocked, setJustLocked] = useState(false);
  const [showAlarmModal, setShowAlarmModal] = useState(false);

  // Check if we should show alarm modal (from notification click)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("alarm") === "true" && !lockedText) {
      setShowAlarmModal(true);
      // Remove alarm parameter from URL
      window.history.replaceState({}, "", "/");
    }
  }, [lockedText]);

  const canLock = useMemo(() => {
    const len = text.trim().length;
    return len >= 1 && len <= 100 && !isSubmitting;
  }, [text, isSubmitting]);

  const lockToday = useCallback(async () => {
    if (!canLock) return;
    setIsSubmitting(true);
    setJustLocked(false);
    try {
      const res = await fetch("/api/today/lock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (res.status === 409) {
        window.location.reload();
        return;
      }

      if (!res.ok) return;

      const data = (await res.json()) as { text: string };
      setLockedText(data.text);
      setJustLocked(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [canLock, text]);

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="text-sm font-medium tracking-wide text-neutral-900">
            Polaris
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/widget"
              className="text-sm text-neutral-600 hover:text-neutral-900 underline"
            >
              Widget
            </Link>
            <LogoutButton />
          </div>
        </header>

        {lockedText ? (
          <main className="flex flex-1 flex-col items-center justify-center gap-12">
            <div className="w-full">
              <div className="mx-auto max-w-prose text-center text-2xl leading-relaxed text-neutral-900">
                {lockedText}
              </div>
            </div>

            {/* Show reminder settings after locking */}
            <div className="w-full">
              <ReminderSettings />
            </div>
          </main>
        ) : (
          <main className="flex flex-1 flex-col justify-center gap-6">
            <div className="text-xl font-medium leading-snug text-neutral-900">
              Today, I show up by…
            </div>

            <div className="flex flex-col gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 100))}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                maxLength={100}
                inputMode="text"
                autoComplete="off"
                className="h-12 w-full rounded-lg border border-neutral-200 bg-white px-4 text-base text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
              {isFocused ? (
                <div className="text-xs text-neutral-500">{text.length}/100</div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={lockToday}
                disabled={!canLock}
                className="h-12 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                Lock Today
              </button>
              {justLocked ? (
                <div className="text-xs text-neutral-500">Locked for today.</div>
              ) : null}
            </div>
          </main>
        )}
      </div>

      {/* Alarm Modal */}
      <AlarmModal
        isOpen={showAlarmModal}
        onClose={() => setShowAlarmModal(false)}
      />
    </div>
  );
}

