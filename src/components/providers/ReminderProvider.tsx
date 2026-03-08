"use client";

import { useEffect } from "react";
import { initializeReminderScheduler } from "@/lib/utils/reminder-scheduler";

/**
 * Provider that initializes the daily reminder scheduler and ensures the
 * service worker is registered so device notifications work at the chosen time.
 * Should be placed high in the component tree (layout or root page).
 */
export function ReminderProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker so reminder notifications work even if user
    // set reminder from Settings without going through onboarding.
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Registration failed (e.g. not HTTPS or unsupported); scheduler will still run
      });
    }
    initializeReminderScheduler();
  }, []);

  return <>{children}</>;
}
