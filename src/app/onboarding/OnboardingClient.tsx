"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type Props = {
  vapidPublicKey: string;
};

export default function OnboardingClient({ vapidPublicKey }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState("07:00");
  const [isSaving, setIsSaving] = useState(false);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "America/New_York",
    [],
  );

  const enableReminder = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setNotificationsEnabled(false);
      setStep(2);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setNotificationsEnabled(false);
      setStep(2);
      return;
    }

    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }));

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      setNotificationsEnabled(false);
      setStep(2);
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

    setNotificationsEnabled(res.ok);
    setStep(2);
  };

  const skipReminder = () => {
    setNotificationsEnabled(false);
    setStep(2);
  };

  const finish = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/profile/complete-onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          timezone,
          notification_time: notificationTime,
          notifications_enabled: notificationsEnabled,
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
                {"We’ll send one quiet reminder each morning.\nNo streaks. No pressure."}
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={enableReminder}
                  className="h-12 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
                >
                  Enable reminder
                </button>
                <button
                  type="button"
                  onClick={skipReminder}
                  className="h-12 w-full rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50"
                >
                  Skip
                </button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="flex flex-col gap-3">
                <label className="text-xs text-neutral-600" htmlFor="time">
                  Reminder time
                </label>
                <input
                  id="time"
                  type="time"
                  value={notificationTime}
                  onChange={(e) => setNotificationTime(e.target.value)}
                  className="h-12 w-full rounded-lg border border-neutral-200 bg-white px-4 text-base text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none"
                />
                <div className="text-sm text-neutral-600">
                  Before email, before work, before the day decides for you.
                </div>
              </div>
              <button
                type="button"
                onClick={finish}
                disabled={isSaving}
                className="h-12 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {isSaving ? "Saving…" : "Done"}
              </button>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

