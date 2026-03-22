/**
 * Client-side reminder scheduler
 * Checks every minute if it's time to show the daily reminder at 6:00 AM local time
 */

const REMINDER_TIME = "06:00";

export function initializeReminderScheduler() {
  if (typeof window === "undefined") return;

  const enabled = localStorage.getItem("polaris_reminder_enabled") === "true";
  if (!enabled) return;

  // Clear any existing interval
  const existingInterval = localStorage.getItem("polaris_check_interval_id");
  if (existingInterval) {
    clearInterval(parseInt(existingInterval));
  }

  // Check every minute
  const intervalId = setInterval(async () => {
    const enabled = localStorage.getItem("polaris_reminder_enabled") === "true";
    const lastShown = localStorage.getItem("polaris_last_notification");

    if (!enabled) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const today = now.toDateString();

    // Only show once per day at 6:00 AM local time
    if (currentTime === REMINDER_TIME && lastShown !== today) {
      await showReminderNotification();
      localStorage.setItem("polaris_last_notification", today);
      // When app is in foreground, also show in-app modal
      if (document.hasFocus()) {
        window.location.href = "/?alarm=true";
      }
    }
  }, 60000); // Check every minute

  localStorage.setItem("polaris_check_interval_id", intervalId.toString());
}

async function showReminderNotification() {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification("Time to Set Your Orientation", {
      body: "Set your daily focus before the day takes over.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      tag: "polaris-daily-reminder",
      requireInteraction: true,
      data: { url: "/?alarm=true" },
    });
  } catch (error) {
    console.error("Failed to show notification:", error);
  }
}

// Start scheduler on page load if reminders are enabled
if (typeof window !== "undefined") {
  const run = () => initializeReminderScheduler();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
}
