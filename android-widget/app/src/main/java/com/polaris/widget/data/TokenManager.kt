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
    fun saveCachedOrientation(text: String?, date: String, locked: Boolean) {
        prefs.edit()
            .putString(KEY_CACHED_TEXT, text)
            .putString(KEY_CACHED_DATE, date)
            .putBoolean(KEY_CACHED_LOCKED, locked)
            .putLong(KEY_LAST_FETCH_TIME, System.currentTimeMillis())
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

    /**
     * Check if cache is still valid for today
     * Cache is valid if:
     * 1. We have cached data
     * 2. The cached date matches today's date
     * 3. If orientation is locked, no need to refetch
     */
    fun isCacheValidForToday(todayDate: String): Boolean {
        val cachedDate = getCachedDate()
        val cachedText = getCachedText()
        val isLocked = getCachedLocked()

        // No cached data
        if (cachedDate.isNullOrBlank()) return false

        // Different day - cache invalid
        if (cachedDate != todayDate) return false

        // Same day and locked - cache is valid, don't refetch
        if (isLocked && cachedText != null) return true

        // Same day but not locked - we should refetch periodically
        return false
    }

    fun clearCache() {
        prefs.edit()
            .remove(KEY_CACHED_TEXT)
            .remove(KEY_CACHED_DATE)
            .remove(KEY_CACHED_LOCKED)
            .remove(KEY_LAST_FETCH_TIME)
            .apply()
    }
}
