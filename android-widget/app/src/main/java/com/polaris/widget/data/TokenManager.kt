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
     * The server now returns the most recently locked orientation regardless of date,
     * so we no longer invalidate by day or reminder time. Instead we use a short
     * time-based window so the widget picks up a newly set focus within ~5 minutes
     * while avoiding redundant API calls on every widget draw.
     *
     * Cache is valid when:
     * - We have a locked orientation cached, AND
     * - It was fetched less than CACHE_TTL_MS ago.
     *
     * If nothing is locked yet (never set), we always re-fetch so the widget
     * transitions to the focus text as soon as the user locks one.
     */
    fun isCacheValidForToday(todayDate: String): Boolean {
        val cachedText = getCachedText()
        val isLocked = getCachedLocked()

        // No locked data cached – always fetch
        if (!isLocked || cachedText.isNullOrBlank()) return false

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

        /** How long a locked cache entry is reused before re-checking the server. */
        private const val CACHE_TTL_MS = 5 * 60 * 1000L  // 5 minutes
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
