package com.polaris.widget.data

import android.content.Context
import android.content.SharedPreferences
import com.polaris.widget.BuildConfig

/**
 * Manages widget token and base URL storage in SharedPreferences
 */
class TokenManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "polaris_widget_prefs",
        Context.MODE_PRIVATE
    )

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun getToken(): String? {
        return prefs.getString(KEY_TOKEN, null)
    }

    fun hasToken(): Boolean {
        return !getToken().isNullOrBlank()
    }

    fun clearToken() {
        prefs.edit().remove(KEY_TOKEN).apply()
    }

    fun getBaseUrl(): String {
        val defaultUrl = BuildConfig.DEFAULT_BASE_URL
        val saved = prefs.getString(KEY_BASE_URL, null)
        val url = if (!saved.isNullOrBlank()) saved else defaultUrl
        return if (url.endsWith("/")) url else "$url/"
    }

    fun saveBaseUrl(url: String) {
        prefs.edit().putString(KEY_BASE_URL, url).apply()
    }

    // Cache management
    fun saveCachedOrientation(
        text: String?,
        date: String,
        locked: Boolean,
        reminderTime: String? = null,
        timezone: String? = null
    ) {
        prefs.edit()
            .putString(KEY_CACHED_TEXT, text)
            .putString(KEY_CACHED_DATE, date)
            .putBoolean(KEY_CACHED_LOCKED, locked)
            .putLong(KEY_LAST_FETCH_TIME, System.currentTimeMillis())
            .putString(KEY_CACHED_REMINDER_TIME, reminderTime)
            .putString(KEY_CACHED_TIMEZONE, timezone)
            .apply()
    }

    fun getCachedText(): String? {
        return prefs.getString(KEY_CACHED_TEXT, null)
    }

    fun getCachedDate(): String? {
        return prefs.getString(KEY_CACHED_DATE, null)
    }

    fun getCachedLocked(): Boolean {
        return prefs.getBoolean(KEY_CACHED_LOCKED, false)
    }

    fun getLastFetchTime(): Long {
        return prefs.getLong(KEY_LAST_FETCH_TIME, 0)
    }

    fun getCachedReminderTime(): String? {
        return prefs.getString(KEY_CACHED_REMINDER_TIME, null)
    }

    fun getCachedTimezone(): String? {
        return prefs.getString(KEY_CACHED_TIMEZONE, null)
    }

    /**
     * Check if the cache is still fresh enough to use without an API call.
     *
     * The day resets at 6am in the user's local timezone:
     *   • Before 6am  – carry the most recently locked focus forward (no blank overnight).
     *   • From 6am on – only today's focus is valid; if the cache is from a previous day,
     *                   invalidate so the widget immediately re-fetches and shows the
     *                   "Waiting for today's focus" state.
     *
     * On top of that, a 5-minute TTL ensures the widget picks up a newly set focus
     * within one worker cycle rather than staying stuck all day.
     */
    fun isCacheValidForToday(todayDate: String): Boolean {
        val cachedText = getCachedText()
        val isLocked = getCachedLocked()
        val cachedDate = getCachedDate()

        // No locked data cached – always fetch
        if (!isLocked || cachedText.isNullOrBlank()) return false

        // Check the 6am reset boundary in the user's timezone
        val timezone = getCachedTimezone()
        if (!cachedDate.isNullOrBlank() && !timezone.isNullOrBlank()) {
            try {
                val userZone = java.util.TimeZone.getTimeZone(timezone)
                val cal = java.util.Calendar.getInstance(userZone)
                val currentHour = cal.get(java.util.Calendar.HOUR_OF_DAY)
                val currentDate = String.format(
                    "%04d-%02d-%02d",
                    cal.get(java.util.Calendar.YEAR),
                    cal.get(java.util.Calendar.MONTH) + 1,
                    cal.get(java.util.Calendar.DAY_OF_MONTH)
                )
                // It's past 6am and the cached focus is from a previous day → stale
                if (currentHour >= RESET_HOUR && cachedDate < currentDate) return false
            } catch (_: Exception) { /* fall through to device-date fallback */ }
        } else if (!cachedDate.isNullOrBlank()) {
            // No timezone cached — use the device clock as a fallback so yesterday's
            // locked entry is never carried into the new calendar day past 6am.
            val deviceCal = java.util.Calendar.getInstance()
            val deviceHour = deviceCal.get(java.util.Calendar.HOUR_OF_DAY)
            if (deviceHour >= RESET_HOUR && cachedDate < todayDate) return false
        }

        // Locked data present – valid for CACHE_TTL_MS so we still poll for new focus
        val elapsed = System.currentTimeMillis() - getLastFetchTime()
        return elapsed < CACHE_TTL_MS
    }

    companion object {
        private const val KEY_TOKEN = "widget_token"
        private const val KEY_BASE_URL = "base_url"
        private const val KEY_CACHED_TEXT = "cached_text"
        private const val KEY_CACHED_DATE = "cached_date"
        private const val KEY_CACHED_LOCKED = "cached_locked"
        private const val KEY_LAST_FETCH_TIME = "last_fetch_time"
        private const val KEY_CACHED_REMINDER_TIME = "cached_reminder_time"  // "HH:mm"
        private const val KEY_CACHED_TIMEZONE = "cached_timezone"
        private const val KEY_LAST_FCM_REGISTER_TIME = "last_fcm_register_time"

        /** How long a locked cache entry is reused before re-checking the server. */
        private const val CACHE_TTL_MS = 5 * 60 * 1000L  // 5 minutes

        /** Hour of day (in user's local timezone) when the daily focus resets. */
        private const val RESET_HOUR = 6

        /** Re-register the FCM token with the server once every 24 hours. */
        private const val FCM_REGISTER_INTERVAL_MS = 24 * 60 * 60 * 1000L
    }

    fun clearCache() {
        prefs.edit()
            .remove(KEY_CACHED_TEXT)
            .remove(KEY_CACHED_DATE)
            .remove(KEY_CACHED_LOCKED)
            .remove(KEY_LAST_FETCH_TIME)
            .remove(KEY_CACHED_REMINDER_TIME)
            .remove(KEY_CACHED_TIMEZONE)
            .apply()
    }

    /**
     * Returns true if enough time has passed since the FCM token was last registered
     * with the server, meaning it should be re-registered to stay fresh.
     */
    fun shouldReRegisterFcm(): Boolean {
        val lastRegistered = prefs.getLong(KEY_LAST_FCM_REGISTER_TIME, 0L)
        return System.currentTimeMillis() - lastRegistered > FCM_REGISTER_INTERVAL_MS
    }

    fun markFcmRegistered() {
        prefs.edit().putLong(KEY_LAST_FCM_REGISTER_TIME, System.currentTimeMillis()).apply()
    }
}
