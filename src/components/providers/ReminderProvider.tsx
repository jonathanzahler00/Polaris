"use client";

import { useEffect } from "react";
import { initializeReminderScheduler } from "@/lib/utils/reminder-scheduler";

/**
 * Provider that initializes the daily reminder scheduler
 * Should be placed high in the component tree (layout or root page)
 */
export function ReminderProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeReminderScheduler();
  }, []);

  return <>{children}</>;
}
