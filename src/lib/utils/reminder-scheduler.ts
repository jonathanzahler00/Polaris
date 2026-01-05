/**
 * Client-side reminder scheduler
 * Checks every minute if it's time to show the daily reminder notification
 */

export function initializeReminderScheduler() {
  if (typeof window === "undefined") return;

  // Clear any existing interval
  const existingInterval = localStorage.getItem("polaris_check_interval_id");
  if (existingInterval) {
    clearInterval(parseInt(existingInterval));
  }

  // Check every minute
  const intervalId = setInterval(async () => {
    const enabled = localStorage.getItem("polaris_reminder_enabled") === "true";
    const savedTime = localStorage.getItem("polaris_reminder_time");
    const lastShown = localStorage.getItem("polaris_last_notification");

    if (!enabled || !savedTime) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const today = now.toDateString();

    // Only show once per day
    if (currentTime === savedTime && lastShown !== today) {
      await showReminderNotification();
      localStorage.setItem("polaris_last_notification", today);
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
      vibrate: [200, 100, 200],
      data: { url: "/?alarm=true" },
      actions: [
        {
          action: "set-orientation",
          title: "Set Now",
        },
        {
          action: "dismiss",
          title: "Later",
        },
      ],
    });
  } catch (error) {
    console.error("Failed to show notification:", error);
  }
}

// Start scheduler immediately
if (typeof window !== "undefined") {
  // Initialize on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeReminderScheduler);
  } else {
    initializeReminderScheduler();
  }
}
