"use client";

import { useState, useEffect } from "react";
import { initializeReminderScheduler } from "@/lib/utils/reminder-scheduler";

type Props = {
  onTimeSet?: (time: string) => void;
};

export function ReminderSettings({ onTimeSet }: Props) {
  const [reminderTime, setReminderTime] = useState<string>("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [canSetTime, setCanSetTime] = useState(true);
  const [nextChangeDate, setNextChangeDate] = useState<string>("");

  useEffect(() => {
    // Load saved reminder time from localStorage
    const saved = localStorage.getItem("polaris_reminder_time");
    const lastChanged = localStorage.getItem("polaris_reminder_last_changed");

    if (saved) {
      setReminderTime(saved);
    }

    // Check if we can set/change the time (only once per calendar month)
    if (lastChanged) {
      const lastChangedDate = new Date(lastChanged);
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastChangedMonth = lastChangedDate.getMonth();
      const lastChangedYear = lastChangedDate.getFullYear();

      // Can only change if it's a new calendar month
      const isNewMonth = currentYear > lastChangedYear || currentMonth > lastChangedMonth;

      setCanSetTime(isNewMonth);

      // Calculate next change date (1st of next month)
      const nextMonth = new Date(currentYear, currentMonth + 1, 1);
      setNextChangeDate(nextMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
    } else {
      // First time - can set
      setCanSetTime(true);
    }

    // Check notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser doesn't support notifications");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      // Schedule notification
      scheduleNotification(reminderTime);
    }
  };

  const timeOptions = [
    { value: "05:00", label: "5:00 AM" },
    { value: "06:00", label: "6:00 AM" },
    { value: "07:00", label: "7:00 AM" },
    { value: "08:00", label: "8:00 AM" },
  ];

  const scheduleNotification = async (time: string) => {
    if (!time) return;

    // Register service worker for notifications
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Store the reminder time and when it was changed; start scheduler
        localStorage.setItem("polaris_reminder_time", time);
        localStorage.setItem("polaris_reminder_enabled", "true");
        localStorage.setItem("polaris_reminder_last_changed", new Date().toISOString());
        initializeReminderScheduler();

        // Set up daily alarm using service worker
        await fetch("/api/reminder/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ time }),
        });

        setCanSetTime(false);

        // Calculate next change date
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        setNextChangeDate(nextMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }));

        onTimeSet?.(time);
      } catch (error) {
        console.error("Failed to schedule notification:", error);
      }
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTime = e.target.value;
    setReminderTime(newTime);
  };

  const handleSetReminder = async () => {
    if (!reminderTime) {
      alert("Please select a time first");
      return;
    }

    if (notificationPermission !== "granted") {
      await requestNotificationPermission();
    } else {
      await scheduleNotification(reminderTime);
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Daily Reminder
      </h2>

      {reminderTime ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                Daily reminder: {timeOptions.find(t => t.value === reminderTime)?.label || reminderTime}
              </span>
            </div>
          </div>

          {!canSetTime && (
            <p className="text-xs text-neutral-500">
              Can be changed in {nextChangeDate}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Set a daily reminder (your local time). Can only be set once per month.
          </p>

          {notificationPermission === "denied" && (
            <div className="p-3 rounded bg-orange-50 border border-orange-200">
              <p className="text-sm text-orange-900">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Reminder Time
            </label>
            <select
              value={reminderTime}
              onChange={handleTimeChange}
              disabled={!canSetTime}
              className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:border-neutral-400 focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed w-full"
            >
              <option value="">Select a time...</option>
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {!canSetTime && (
              <p className="text-xs text-neutral-500 mt-1">
                Can be set again in {nextChangeDate}
              </p>
            )}
          </div>

          <button
            onClick={handleSetReminder}
            disabled={!reminderTime || !canSetTime}
            className="px-4 py-2 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            {notificationPermission === "granted" ? "Set Reminder" : "Set Reminder & Grant Permission"}
          </button>

          <div className="text-xs text-neutral-500 leading-relaxed">
            <p>
              💡 You'll receive a notification at your chosen time each day. Clicking it opens Polaris in fullscreen to set your daily orientation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
