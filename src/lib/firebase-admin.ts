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
