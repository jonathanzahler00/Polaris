"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Initial value rendered server-side from the user's profile. */
  initialEnabled: boolean;
};

export default function MonthlyReportSettings({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const toggle = async () => {
    const next = !enabled;
    setSaving(true);
    setError(null);
    // Optimistic flip so the switch feels instant.
    setEnabled(next);
    try {
      const res = await fetch("/api/profile/monthly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        setEnabled(!next);
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not update");
      }
    } catch {
      setEnabled(!next);
      setError("Could not update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-neutral-900">Monthly recap email</h2>
          <p className="mt-1 text-sm text-neutral-600">
            On the 1st of each month, get an email recapping every daily orientation
            you wrote the previous month.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Monthly recap email"
          onClick={toggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-neutral-900" : "bg-neutral-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      {error && (
        <p className="mt-3 text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}
