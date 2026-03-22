package com.polaris.widget

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import com.polaris.widget.data.TokenManager

/**
 * Main activity for managing widget token
 * Launched from app icon (optional - for reconfiguration)
 */
class MainActivity : AppCompatActivity() {

    private lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tokenManager = TokenManager(this)

        setupViews()
    }

    private fun setupViews() {
        val tokenInput = findViewById<TextInputEditText>(R.id.token_input_main)
        val saveButton = findViewById<Button>(R.id.save_button_main)
        val openWebButton = findViewById<Button>(R.id.open_web_button)
        val testButton = findViewById<Button>(R.id.test_button_main)
        val statusText = findViewById<TextView>(R.id.status_text)

        // Show current token status
        updateStatus(statusText)

        // Pre-fill existing token
        val existingToken = tokenManager.getToken()
        if (existingToken != null) {
            tokenInput.setText(existingToken)
        }

        saveButton.setOnClickListener {
            val token = tokenInput.text?.toString()?.trim()

            if (token.isNullOrBlank()) {
                statusText.text = "❌ Token cannot be empty"
                return@setOnClickListener
            }

            tokenManager.saveToken(token)
            PolarisWidget.updateAllWidgets(this)

            // Retry FCM registration now that the widget token is set
            PolarisFirebaseMessagingService.retryRegistration(this)

            statusText.text = "✓ Token saved and widgets updated"
            updateStatus(statusText)
        }

        openWebButton.setOnClickListener {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("${tokenManager.getBaseUrl()}widget")
            }
            startActivity(intent)
        }

        testButton.setOnClickListener {
            val intent = Intent(this, TestActivity::class.java)
            startActivity(intent)
        }
    }

    private fun updateStatus(statusText: TextView) {
        if (tokenManager.hasToken()) {
            statusText.text = "✓ Widget configured"
        } else {
            statusText.text = "⚠ No token set"
        }
    }
}
