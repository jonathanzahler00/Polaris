"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type Props = {
  vapidPublicKey: string;
};

export default function OnboardingClient({ vapidPublicKey }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "America/New_York",
    [],
  );

  const enableReminder = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setNotificationsEnabled(false);
      await finish(false);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setNotificationsEnabled(false);
      await finish(false);
      return;
    }

    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      }));

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      setNotificationsEnabled(false);
      await finish(false);
      return;
    }

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        userAgent: navigator.userAgent,
      }),
    });

    const enabled = res.ok;
    setNotificationsEnabled(enabled);

    if (enabled) {
      localStorage.setItem("polaris_reminder_enabled", "true");
      localStorage.setItem("polaris_reminder_seen", new Date().toISOString());
    }

    await finish(enabled);
  };

  const skipReminder = async () => {
    setNotificationsEnabled(false);
    localStorage.setItem("polaris_reminder_seen", new Date().toISOString());
    await finish(false);
  };

  const finish = async (notifEnabled: boolean) => {
    setIsSaving(true);
    try {
      await fetch("/api/profile/complete-onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          timezone,
          notification_time: "06:00",
          notifications_enabled: notifEnabled,
        }),
      });
      router.replace("/");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        <header className="text-sm font-medium tracking-wide text-neutral-900">
          Polaris
        </header>

        <main className="flex flex-1 flex-col justify-center gap-8">
          {step === 0 ? (
            <>
              <div className="whitespace-pre-line text-base leading-relaxed text-neutral-800">
                {"This is a daily orientation check.\nIt helps you decide how you show up before the day gets loud."}
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-12 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
              >
                Continue
              </button>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="whitespace-pre-line text-base leading-relaxed text-neutral-800">
                {"We'll send one quiet reminder at 6:00 AM each morning.\nNo streaks. No pressure."}
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={enableReminder}
                  disabled={isSaving}
                  className="h-12 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving…" : "Enable reminder"}
                </button>
                <button
                  type="button"
                  onClick={skipReminder}
                  disabled={isSaving}
                  className="h-12 w-full rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Skip
                </button>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
