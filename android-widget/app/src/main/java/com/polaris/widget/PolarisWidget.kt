package com.polaris.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
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
        private const val UPDATE_INTERVAL_MINUTES = 30L

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
                try {
                    val api = PolarisApiClient.create(tokenManager.getBaseUrl())
                    val token = tokenManager.getToken() ?: return@launch
                    val response = api.getTodayOrientation(token)

                    if (response.isSuccessful) {
                        val data = response.body()
                        val text = data?.text ?: "Not set yet"
                        val date = data?.date ?: ""

                        CoroutineScope(Dispatchers.Main).launch {
                            views.setTextViewText(R.id.widget_text, text)
                            views.setTextViewText(R.id.widget_date, date)

                            val appWidgetManager = AppWidgetManager.getInstance(context)
                            val component = ComponentName(context, PolarisWidget::class.java)
                            appWidgetManager.updateAppWidget(component, views)
                        }
                    } else {
                        CoroutineScope(Dispatchers.Main).launch {
                            views.setTextViewText(R.id.widget_text, "Error loading")
                            views.setTextViewText(R.id.widget_date, "Tap to retry")

                            val appWidgetManager = AppWidgetManager.getInstance(context)
                            val component = ComponentName(context, PolarisWidget::class.java)
                            appWidgetManager.updateAppWidget(component, views)
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    CoroutineScope(Dispatchers.Main).launch {
                        views.setTextViewText(R.id.widget_text, "Connection error")
                        views.setTextViewText(R.id.widget_date, "Check internet")

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
