package com.polaris.widget.workers

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.polaris.widget.PolarisFirebaseMessagingService
import com.polaris.widget.PolarisWidget
import com.polaris.widget.data.TokenManager

/**
 * Background worker that periodically updates all widgets
 */
class WidgetUpdateWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            PolarisWidget.updateAllWidgets(applicationContext)

            // Re-register the FCM token once per day so the server always has a
            // valid token to push widget-refresh messages to.
            val tokenManager = TokenManager(applicationContext)
            if (tokenManager.hasToken() && tokenManager.shouldReRegisterFcm()) {
                PolarisFirebaseMessagingService.retryRegistration(applicationContext)
            }

            Result.success()
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }
}
