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

    companion object {
        private const val KEY_TOKEN = "widget_token"
        private const val KEY_BASE_URL = "base_url"
        private const val KEY_CACHED_TEXT = "cached_text"
        private const val KEY_CACHED_DATE = "cached_date"
        private const val KEY_CACHED_LOCKED = "cached_locked"
        private const val KEY_LAST_FETCH_TIME = "last_fetch_time"
        private const val KEY_CACHED_REMINDER_TIME = "cached_reminder_time"  // "HH:mm"
        private const val KEY_CACHED_TIMEZONE = "cached_timezone"
    }

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
     * Check if cache is still valid for today.
     * Cache is valid if:
     * 1. We have cached data and cached date matches today (in user's timezone when available).
     * 2. If orientation is locked, cache is valid for the whole day EXCEPT after the user's
     *    reminder time (when server clears orientation) - then we invalidate so widget refetches and shows blank.
     */
    fun isCacheValidForToday(todayDate: String): Boolean {
        val cachedDate = getCachedDate()
        val cachedText = getCachedText()
        val isLocked = getCachedLocked()

        // No cached data
        if (cachedDate.isNullOrBlank()) return false

        // Prefer "today" in user's timezone when we have it; otherwise use passed device date
        val todayInUserZone = getCachedTimezone()?.let { zone ->
            try {
                val cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone(zone))
                String.format("%04d-%02d-%02d",
                    cal.get(java.util.Calendar.YEAR),
                    cal.get(java.util.Calendar.MONTH) + 1,
                    cal.get(java.util.Calendar.DAY_OF_MONTH))
            } catch (_: Exception) { null }
        } ?: todayDate

        // Different day - cache invalid
        if (cachedDate != todayInUserZone) return false

        // If user has reminder enabled: after reminder time today, invalidate so we refetch (server cleared at that time)
        val reminderTime = getCachedReminderTime()
        val timezone = getCachedTimezone()
        if (!reminderTime.isNullOrBlank() && !timezone.isNullOrBlank()) {
            try {
                val userZone = java.util.TimeZone.getTimeZone(timezone)
                val cal = java.util.Calendar.getInstance(userZone)
                val currentHHmm = String.format("%02d:%02d", cal.get(java.util.Calendar.HOUR_OF_DAY), cal.get(java.util.Calendar.MINUTE))
                if (currentHHmm >= reminderTime) return false
            } catch (_: Exception) { /* use rest of logic */ }
        }

        // Same day and locked - cache valid for whole day (until reminder time, handled above)
        if (isLocked && cachedText != null) return true

        // Same day but not locked - refetch periodically
        return false
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
}
