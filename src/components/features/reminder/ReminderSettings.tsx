"use client";

import { useState, useEffect } from "react";

type Props = {
  onTimeSet?: (time: string) => void;
};

export function ReminderSettings({ onTimeSet }: Props) {
  const [reminderTime, setReminderTime] = useState<string>("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [isEnabled, setIsEnabled] = useState(false);
  const [canChangeTime, setCanChangeTime] = useState(true);
  const [nextChangeDate, setNextChangeDate] = useState<string>("");

  useEffect(() => {
    // Load saved reminder time from localStorage
    const saved = localStorage.getItem("polaris_reminder_time");
    const enabled = localStorage.getItem("polaris_reminder_enabled") === "true";
    const lastChanged = localStorage.getItem("polaris_reminder_last_changed");

    if (saved) {
      setReminderTime(saved);
    }
    setIsEnabled(enabled);

    // Check if we can change the time (only on 1st of the month)
    if (lastChanged) {
      const lastChangedDate = new Date(lastChanged);
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastChangedMonth = lastChangedDate.getMonth();
      const lastChangedYear = lastChangedDate.getFullYear();

      // Can only change if it's a new month AND it's the 1st
      const isNewMonth = currentYear > lastChangedYear || currentMonth > lastChangedMonth;
      const isFirstOfMonth = now.getDate() === 1;

      setCanChangeTime(isNewMonth && isFirstOfMonth);

      // Calculate next change date (1st of next month)
      const nextMonth = new Date(currentYear, currentMonth + 1, 1);
      setNextChangeDate(nextMonth.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
    } else {
      // First time - can change
      setCanChangeTime(true);
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

  const scheduleNotification = async (time: string) => {
    if (!time) return;

    // Register service worker for notifications
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Store the reminder time and when it was changed
        localStorage.setItem("polaris_reminder_time", time);
        localStorage.setItem("polaris_reminder_enabled", "true");
        localStorage.setItem("polaris_reminder_last_changed", new Date().toISOString());

        // Set up daily alarm using service worker
        await fetch("/api/reminder/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ time }),
        });

        setIsEnabled(true);
        setCanChangeTime(false);

        // Calculate next change date
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        setNextChangeDate(nextMonth.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));

        onTimeSet?.(time);
      } catch (error) {
        console.error("Failed to schedule notification:", error);
      }
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setReminderTime(newTime);
  };

  const handleEnableReminder = async () => {
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

  const handleDisableReminder = () => {
    localStorage.setItem("polaris_reminder_enabled", "false");
    setIsEnabled(false);
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Daily Reminder
      </h2>

      <p className="text-sm text-neutral-600 mb-4">
        Get a daily reminder to set your orientation. The app will open fullscreen at your chosen time.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Reminder Time
          </label>
          <input
            type="time"
            value={reminderTime}
            onChange={handleTimeChange}
            disabled={isEnabled && !canChangeTime}
            className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:border-neutral-400 focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
          />
          {isEnabled && !canChangeTime && (
            <p className="text-xs text-neutral-500 mt-1">
              Time can be changed on {nextChangeDate}
            </p>
          )}
        </div>

        {notificationPermission === "denied" && (
          <div className="p-3 rounded bg-orange-50 border border-orange-200">
            <p className="text-sm text-orange-900">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}

        <div>
          {!isEnabled ? (
            <button
              onClick={handleEnableReminder}
              disabled={!reminderTime}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              {notificationPermission === "granted" ? "Enable Reminder" : "Enable & Grant Permission"}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Daily reminder active at {reminderTime}</span>
              </div>
              <button
                onClick={handleDisableReminder}
                className="px-4 py-2 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Disable Reminder
              </button>
            </div>
          )}
        </div>

        {isEnabled && (
          <div className="text-xs text-neutral-500 leading-relaxed">
            <p>
              💡 <strong>How it works:</strong> At your chosen time each day, you'll receive a notification.
              Clicking it will open Polaris in fullscreen mode, prompting you to set your daily orientation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
