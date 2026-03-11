/**
 * Helpers for Web Push subscription (used for daily reminder on mobile when app is backgrounded/closed).
 */

/** Decode base64url to Uint8Array (ArrayBuffer-backed for Push API compatibility). */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/**
 * Subscribe to push and register with the server so the cron can send daily reminder at the user's chosen time.
 * Call this when the user enables/sets a reminder (e.g. in Settings or onboarding).
 * Returns true if subscription was created/updated and sent to the server.
 */
export async function subscribeToPush(vapidPublicKey: string): Promise<boolean> {
  if (!vapidPublicKey || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return false;
  }
  if (Notification.permission !== "granted") return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      }));

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        userAgent: navigator.userAgent,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
