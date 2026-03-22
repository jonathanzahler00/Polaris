"use client";

import { useState, useEffect } from "react";
import { initializeReminderScheduler } from "@/lib/utils/reminder-scheduler";
import { subscribeToPush } from "@/lib/utils/push";

type Props = {
  onEnabled?: () => void;
  /** VAPID public key for Web Push – required for reminders when app is closed/background (e.g. on phone) */
  vapidPublicKey?: string;
};

export function ReminderSettings({ onEnabled, vapidPublicKey }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [resyncing, setResyncing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isEnabled = localStorage.getItem("polaris_reminder_enabled") === "true";
    setEnabled(isEnabled);

    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const enableReminder = async () => {
    setLoading(true);
    try {
      if (!("Notification" in window)) {
        alert("This browser doesn't support notifications");
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== "granted") {
        alert("Notifications are blocked. Please enable them in your browser settings.");
        return;
      }

      // Register service worker
      await navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(() => navigator.serviceWorker.ready);

      // Subscribe to push so cron can send the reminder when app is closed
      if (vapidPublicKey) {
        await subscribeToPush(vapidPublicKey);
      }

      // Enable scheduler
      localStorage.setItem("polaris_reminder_enabled", "true");
      initializeReminderScheduler();

      // Sync to server
      await fetch("/api/reminder/schedule", { method: "POST" });

      setEnabled(true);
      onEnabled?.();
    } catch (error) {
      console.error("Failed to enable reminder:", error);
    } finally {
      setLoading(false);
    }
  };

  const disableReminder = async () => {
    setLoading(true);
    try {
      localStorage.setItem("polaris_reminder_enabled", "false");

      await fetch("/api/reminder/schedule", { method: "DELETE" });

      setEnabled(false);
    } catch (error) {
      console.error("Failed to disable reminder:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Daily Reminder
      </h2>

      {enabled ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Daily reminder at 6:00 AM (your local time)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={disableReminder}
              disabled={loading}
              className="text-sm text-neutral-500 underline hover:no-underline disabled:opacity-50"
            >
              {loading ? "Updating…" : "Turn off reminder"}
            </button>

            {vapidPublicKey && (
              <button
                type="button"
                onClick={async () => {
                  setResyncing(true);
                  try {
                    await subscribeToPush(vapidPublicKey);
                    alert("Reminder synced. You should get notifications at 6:00 AM.");
                  } catch {
                    alert("Resync failed. Check that notifications are allowed for this site.");
                  } finally {
                    setResyncing(false);
                  }
                }}
                disabled={resyncing}
                className="text-sm text-neutral-500 underline hover:no-underline disabled:opacity-50"
              >
                {resyncing ? "Syncing…" : "Resync notifications"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Get a quiet reminder every morning at <strong>6:00 AM</strong> to set your daily orientation.
          </p>

          {notificationPermission === "denied" && (
            <div className="p-3 rounded bg-orange-50 border border-orange-200">
              <p className="text-sm text-orange-900">
                Notifications are blocked. Please enable them in your browser settings, then return here.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={enableReminder}
            disabled={loading || notificationPermission === "denied"}
            className="px-4 py-2 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            {loading ? "Enabling…" : "Enable reminder"}
          </button>
        </div>
      )}
    </div>
  );
}
