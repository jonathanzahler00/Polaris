"use client";

import { useEffect } from "react";
import { initializeReminderScheduler } from "@/lib/utils/reminder-scheduler";

/**
 * Provider that initializes the daily reminder scheduler and ensures the
 * service worker is registered so device notifications work at the chosen time.
 * Also initialises native push notifications when running inside the Capacitor
 * app shell so tapping the reminder opens the app (not the browser).
 * Should be placed high in the component tree (layout or root page).
 */
export function ReminderProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker for web/PWA reminders
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Registration failed (e.g. not HTTPS or unsupported); scheduler will still run
      });
    }
    initializeReminderScheduler();

    // Init native push when running inside the Capacitor shell.
    // Dynamic import keeps the plugin out of the web/PWA bundle.
    import("@/lib/utils/capacitor-push")
      .then(({ initCapacitorPush }) => initCapacitorPush())
      .catch(() => {});
  }, []);

  return <>{children}</>;
}
