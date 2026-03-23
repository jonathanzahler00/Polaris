import { Capacitor } from "@capacitor/core";

/**
 * Initialises Capacitor's native push notification plugin so the daily reminder
 * can open the app (instead of Chrome) when tapped on Android / iOS.
 *
 * Uses a dynamic import so the heavy Capacitor plugin module is tree-shaken out
 * of the web/PWA bundle — only loaded when actually running inside a native shell.
 *
 * Call once during app start (ReminderProvider does this automatically).
 */
export async function initCapacitorPush(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  const { receive } = await PushNotifications.requestPermissions();
  if (receive !== "granted") return;

  await PushNotifications.register();

  PushNotifications.addListener("registration", async (token) => {
    try {
      await fetch("/api/app/push-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fcmToken: token.value,
          platform: Capacitor.getPlatform(), // "android" | "ios"
        }),
      });
    } catch (err) {
      console.error("[CapacitorPush] Token registration failed:", err);
    }
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.error("[CapacitorPush] Registration error:", err.error);
  });

  // Tapped from notification shade (app was backgrounded or killed)
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url: string = action.notification.data?.url ?? "/?alarm=true";
    window.location.href = url;
  });
}
