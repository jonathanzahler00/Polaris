package com.polaris.widget

import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import com.polaris.widget.data.TokenManager

/**
 * Configuration activity shown when user adds widget
 */
class WidgetConfigActivity : AppCompatActivity() {

    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    private lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_config)

        // Set default result to CANCELED
        setResult(RESULT_CANCELED)

        tokenManager = TokenManager(this)

        // Get widget ID from intent
        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        // If invalid widget ID, finish
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        setupViews()
    }

    private fun setupViews() {
        val tokenInput = findViewById<TextInputEditText>(R.id.token_input)
        val saveButton = findViewById<Button>(R.id.save_button)

        // Pre-fill if token exists
        val existingToken = tokenManager.getToken()
        if (existingToken != null) {
            tokenInput.setText(existingToken)
        }

        saveButton.setOnClickListener {
            val token = tokenInput.text?.toString()?.trim()

            if (token.isNullOrBlank()) {
                Toast.makeText(this, "Please enter a token", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Save token
            tokenManager.saveToken(token)

            // Update widget immediately
            val appWidgetManager = AppWidgetManager.getInstance(this)
            PolarisWidget.updateAppWidget(this, appWidgetManager, appWidgetId)

            // Return success
            val resultValue = Intent().apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            setResult(RESULT_OK, resultValue)
            finish()
        }
    }
}
