package com.polaris.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import android.widget.RemoteViews
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.polaris.widget.data.PolarisApiClient
import com.polaris.widget.data.TokenManager
import com.polaris.widget.workers.WidgetUpdateWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/**
 * Main Widget Provider for Polaris
 */
class PolarisWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update each widget instance
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        // Schedule periodic updates
        scheduleWidgetUpdates(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        // Cancel periodic updates when last widget is removed
        WorkManager.getInstance(context).cancelUniqueWork("polaris_widget_update")
    }

    companion object {
        private const val UPDATE_INTERVAL_MINUTES = 5L  // Check every 5 minutes

        /**
         * Schedule periodic background updates
         */
        fun scheduleWidgetUpdates(context: Context) {
            val updateRequest = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(
                UPDATE_INTERVAL_MINUTES,
                TimeUnit.MINUTES
            ).build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "polaris_widget_update",
                ExistingPeriodicWorkPolicy.KEEP,
                updateRequest
            )
        }

        /**
         * Update a single widget instance
         */
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val tokenManager = TokenManager(context)
            val views = RemoteViews(context.packageName, R.layout.widget_layout)

            if (!tokenManager.hasToken()) {
                // No token configured - show setup message
                views.setTextViewText(R.id.widget_text, "Tap to configure")
                views.setTextViewText(R.id.widget_date, "")

                // Click opens config
                val configIntent = Intent(context, WidgetConfigActivity::class.java).apply {
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                }
                val pendingIntent = PendingIntent.getActivity(
                    context,
                    appWidgetId,
                    configIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
            } else {
                // Token configured - fetch and display orientation
                fetchAndDisplayOrientation(context, views, tokenManager)

                // Click opens Polaris web app
                val webIntent = Intent(Intent.ACTION_VIEW).apply {
                    data = Uri.parse("${tokenManager.getBaseUrl()}/")
                }
                val pendingIntent = PendingIntent.getActivity(
                    context,
                    0,
                    webIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        /**
         * Fetch orientation from API and update widget
         */
        private fun fetchAndDisplayOrientation(
            context: Context,
            views: RemoteViews,
            tokenManager: TokenManager
        ) {
            CoroutineScope(Dispatchers.IO).launch {
                val startTime = System.currentTimeMillis()
                val timestamp = java.text.SimpleDateFormat("HH:mm:ss.SSS", java.util.Locale.US).format(java.util.Date())

                try {
                    // Compute "today" in the user's Polaris timezone (not device tz)
                    // so the 6am boundary check in isCacheValidForToday is accurate.
                    val cachedTz = tokenManager.getCachedTimezone()
                    val todayDate = if (!cachedTz.isNullOrBlank()) {
                        val userZone = java.util.TimeZone.getTimeZone(cachedTz)
                        val cal = java.util.Calendar.getInstance(userZone)
                        String.format(
                            "%04d-%02d-%02d",
                            cal.get(java.util.Calendar.YEAR),
                            cal.get(java.util.Calendar.MONTH) + 1,
                            cal.get(java.util.Calendar.DAY_OF_MONTH)
                        )
                    } else {
                        java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
                    }

                    // Check if we have valid cached data for today
                    if (tokenManager.isCacheValidForToday(todayDate)) {
                        val cachedText = tokenManager.getCachedText() ?: "Not set yet"
                        val cachedDate = tokenManager.getCachedDate() ?: todayDate

                        Log.d("PolarisWidget", "[$timestamp] Using cached data - Text: $cachedText, Date: $cachedDate (locked)")

                        CoroutineScope(Dispatchers.Main).launch {
                            views.setTextViewText(R.id.widget_text, cachedText)
                            views.setTextViewText(R.id.widget_date, cachedDate)

                            val appWidgetManager = AppWidgetManager.getInstance(context)
                            val component = ComponentName(context, PolarisWidget::class.java)
                            appWidgetManager.updateAppWidget(component, views)
                        }
                        return@launch
                    }

                    val baseUrl = tokenManager.getBaseUrl()
                    val token = tokenManager.getToken()

                    Log.d("PolarisWidget", "[$timestamp] Fetching from API - BaseUrl: $baseUrl, Token: ${token?.take(10)}...")

                    if (token == null) {
                        Log.e("PolarisWidget", "[$timestamp] ERROR: Token is null!")
                        return@launch
                    }

                    val api = PolarisApiClient.create(baseUrl)
                    val response = api.getTodayOrientation(token)

                    val elapsed = System.currentTimeMillis() - startTime
                    Log.d("PolarisWidget", "[$timestamp] Response received in ${elapsed}ms - Code: ${response.code()}, Successful: ${response.isSuccessful}")

                    if (response.isSuccessful) {
                        val data = response.body()
                        val text = data?.text ?: (data?.placeholder ?: "Waiting for today's focus")
                        val date = data?.date ?: todayDate
                        val locked = data?.locked ?: false

                        Log.d("PolarisWidget", "Success - Text: $text, Date: $date, Locked: $locked")

                        tokenManager.saveCachedOrientation(
                            text,
                            date,
                            locked,
                            data?.reminderTime,
                            data?.timezone
                        )

                        CoroutineScope(Dispatchers.Main).launch {
                            views.setTextViewText(R.id.widget_text, text)
                            views.setTextViewText(R.id.widget_date, date)

                            val appWidgetManager = AppWidgetManager.getInstance(context)
                            val component = ComponentName(context, PolarisWidget::class.java)
                            appWidgetManager.updateAppWidget(component, views)
                        }
                    } else {
                        val errorBody = response.errorBody()?.string()
                        Log.e("PolarisWidget", "API Error: ${response.code()} - $errorBody")

                        CoroutineScope(Dispatchers.Main).launch {
                            views.setTextViewText(R.id.widget_text, "Error ${response.code()}")
                            views.setTextViewText(R.id.widget_date, "Tap to retry")

                            val appWidgetManager = AppWidgetManager.getInstance(context)
                            val component = ComponentName(context, PolarisWidget::class.java)
                            appWidgetManager.updateAppWidget(component, views)
                        }
                    }
                } catch (e: Exception) {
                    val elapsed = System.currentTimeMillis() - startTime
                    val errorType = when (e) {
                        is java.net.UnknownHostException -> "DNS_LOOKUP_FAILED"
                        is java.net.SocketTimeoutException -> "TIMEOUT"
                        is java.net.ConnectException -> "CONNECTION_REFUSED"
                        is javax.net.ssl.SSLException -> "SSL_ERROR"
                        else -> e.javaClass.simpleName
                    }

                    Log.e("PolarisWidget", "[$timestamp] EXCEPTION after ${elapsed}ms - Type: $errorType, Message: ${e.message}", e)
                    e.printStackTrace()

                    CoroutineScope(Dispatchers.Main).launch {
                        views.setTextViewText(R.id.widget_text, "Connection error")
                        views.setTextViewText(R.id.widget_date, e.message ?: "Check internet")

                        val appWidgetManager = AppWidgetManager.getInstance(context)
                        val component = ComponentName(context, PolarisWidget::class.java)
                        appWidgetManager.updateAppWidget(component, views)
                    }
                }
            }
        }

        /**
         * Force update all widgets
         */
        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, PolarisWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(component)

            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
        }
    }
}
