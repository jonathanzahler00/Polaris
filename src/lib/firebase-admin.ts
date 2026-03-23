import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  }

  return initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
}

/**
 * Send a native push notification to the given Capacitor app FCM tokens.
 * Used by the daily reminder cron so tapping the notification opens the app.
 * Stale/invalid tokens are returned so callers can deactivate them.
 */
export async function sendAppPushNotification(
  tokens: string[],
  title: string,
  body: string,
  url = "/?alarm=true"
): Promise<string[]> {
  if (tokens.length === 0) return [];

  const messaging = getMessaging(getFirebaseApp());

  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: { url },
    android: {
      priority: "high",
      notification: { channelId: "default", sound: "default" },
    },
    apns: {
      headers: { "apns-priority": "10" },
      payload: {
        aps: {
          alert: { title, body },
          sound: "default",
          badge: 1,
        },
      },
    },
  });

  const staleTokens: string[] = [];
  result.responses.forEach((resp, idx) => {
    if (!resp.success) {
      const code = resp.error?.code ?? "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        staleTokens.push(tokens[idx]);
      }
    }
  });

  return staleTokens;
}

/**
 * Send a silent FCM data message to the given tokens telling the Android widget to refresh.
 * Stale/invalid tokens are returned so callers can deactivate them.
 */
export async function sendWidgetRefresh(tokens: string[]): Promise<string[]> {
  if (tokens.length === 0) return [];

  const messaging = getMessaging(getFirebaseApp());

  const result = await messaging.sendEachForMulticast({
    tokens,
    data: { type: "widget_refresh" },
    android: { priority: "high" },
  });

  // Collect stale tokens (404 = not registered, 410 = unregistered)
  const staleTokens: string[] = [];
  result.responses.forEach((resp, idx) => {
    if (!resp.success) {
      const code = resp.error?.code ?? "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        staleTokens.push(tokens[idx]);
      }
    }
  });

  return staleTokens;
}
