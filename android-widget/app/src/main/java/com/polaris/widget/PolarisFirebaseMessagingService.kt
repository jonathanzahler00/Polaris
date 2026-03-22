package com.polaris.widget

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.polaris.widget.data.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/**
 * Handles Firebase Cloud Messaging events for the Polaris widget.
 *
 * When the user locks their daily orientation in the web app, the server sends
 * an FCM data message with type="widget_refresh". This service receives it and
 * immediately clears the widget cache and forces a fresh fetch so the widget
 * shows the new orientation without waiting for the next polling cycle.
 */
class PolarisFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        Log.d(TAG, "FCM token refreshed")
        // Register the new token with the Polaris server so it can push widget refreshes
        CoroutineScope(Dispatchers.IO).launch {
            registerTokenWithServer(token)
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val type = message.data["type"]
        Log.d(TAG, "FCM message received: type=$type")

        if (type == "widget_refresh") {
            // Clear cached orientation so the widget fetches fresh data immediately
            TokenManager(this).clearCache()
            PolarisWidget.updateAllWidgets(this)
            Log.d(TAG, "Widget refresh triggered via FCM")
        }
    }

    /**
     * Register the FCM token with the Polaris server, authenticated by the widget token.
     * Safe to call even if no widget token is set yet (will be retried when token is saved).
     */
    private fun registerTokenWithServer(fcmToken: String) {
        val tokenManager = TokenManager(this)
        val widgetToken = tokenManager.getToken()
        if (widgetToken.isNullOrBlank()) {
            Log.d(TAG, "No widget token yet – FCM registration deferred")
            return
        }
        sendFcmTokenToServer(fcmToken, widgetToken, tokenManager.getBaseUrl())
    }

    companion object {
        private const val TAG = "PolarisFCM"

        /**
         * Call this after the user saves their widget token so the FCM registration
         * is retried immediately (in case onNewToken fired before the token was set).
         */
        fun retryRegistration(context: android.content.Context) {
            val tokenManager = TokenManager(context)
            val widgetToken = tokenManager.getToken() ?: return

            com.google.firebase.messaging.FirebaseMessaging.getInstance().token
                .addOnSuccessListener { fcmToken ->
                    CoroutineScope(Dispatchers.IO).launch {
                        sendFcmTokenToServer(fcmToken, widgetToken, tokenManager.getBaseUrl())
                    }
                }
        }

        fun sendFcmTokenToServer(fcmToken: String, widgetToken: String, baseUrl: String) {
            try {
                val client = OkHttpClient()
                val json = JSONObject().apply {
                    put("fcmToken", fcmToken)
                    put("widgetToken", widgetToken)
                    put("deviceInfo", android.os.Build.MODEL)
                }.toString()

                val body = json.toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url("${baseUrl}api/fcm/register")
                    .post(body)
                    .build()

                val response = client.newCall(request).execute()
                Log.d(TAG, "FCM token registered: ${response.code}")
                response.close()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to register FCM token: ${e.message}")
            }
        }
    }
}
