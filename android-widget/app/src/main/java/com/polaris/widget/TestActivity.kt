package com.polaris.widget

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.polaris.widget.data.PolarisApiClient
import com.polaris.widget.data.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class TestActivity : AppCompatActivity() {

    private lateinit var tokenManager: TokenManager
    private lateinit var resultText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_test)

        tokenManager = TokenManager(this)
        resultText = findViewById(R.id.test_result)
        val testButton = findViewById<Button>(R.id.test_button)

        // Show current configuration
        updateConfigInfo()

        testButton.setOnClickListener {
            testApiConnection()
        }
    }

    private fun updateConfigInfo() {
        val baseUrl = tokenManager.getBaseUrl()
        val token = tokenManager.getToken()
        val hasToken = token != null

        val config = buildString {
            appendLine("=== Configuration ===")
            appendLine("Base URL: $baseUrl")
            appendLine("Token exists: $hasToken")
            if (hasToken) {
                appendLine("Token (first 10): ${token?.take(10)}...")
                appendLine("Token (last 10): ...${token?.takeLast(10)}")
                appendLine("Token length: ${token?.length}")
            }
            appendLine("\nFull API URL:")
            appendLine("$baseUrl${if (baseUrl.endsWith("/")) "" else "/"}api/widget/today?token=...")
            appendLine("\nTap 'Test Connection' to verify")
        }

        resultText.text = config
    }

    private fun testApiConnection() {
        resultText.text = "Testing connection...\n\n"

        CoroutineScope(Dispatchers.IO).launch {
            val results = buildString {
                try {
                    val baseUrl = tokenManager.getBaseUrl()
                    val token = tokenManager.getToken()

                    appendLine("=== Test Results ===\n")
                    appendLine("Step 1: Configuration")
                    appendLine("✓ Base URL: $baseUrl")
                    appendLine("✓ Token: ${token?.take(10)}...${token?.takeLast(10)}")
                    appendLine("")

                    if (token.isNullOrBlank()) {
                        appendLine("✗ ERROR: No token configured")
                        appendLine("Please configure widget with token")
                        return@buildString
                    }

                    appendLine("Step 2: Creating API client")
                    val api = PolarisApiClient.create(baseUrl)
                    appendLine("✓ API client created")
                    appendLine("")

                    appendLine("Step 3: Making API call")
                    appendLine("Calling: ${baseUrl}api/widget/today?token=...")
                    val response = api.getTodayOrientation(token)
                    appendLine("✓ Response received")
                    appendLine("")

                    appendLine("Step 4: Analyzing response")
                    appendLine("HTTP Status: ${response.code()}")
                    appendLine("Is Successful: ${response.isSuccessful}")
                    appendLine("")

                    if (response.isSuccessful) {
                        val data = response.body()
                        appendLine("Step 5: Parsing response body")
                        appendLine("✓ Success!")
                        appendLine("")
                        appendLine("Response Data:")
                        appendLine("  Text: ${data?.text ?: "null"}")
                        appendLine("  Date: ${data?.date ?: "null"}")
                        appendLine("  Locked: ${data?.locked ?: "null"}")
                        appendLine("")
                        appendLine("=== TEST PASSED ===")
                        appendLine("Widget should display:")
                        appendLine("\"${data?.text ?: "Not set yet"}\"")
                    } else {
                        val errorBody = response.errorBody()?.string()
                        appendLine("✗ API Error")
                        appendLine("")
                        appendLine("Error Details:")
                        appendLine("  HTTP Status: ${response.code()}")
                        appendLine("  Error Body: $errorBody")
                        appendLine("")

                        when (response.code()) {
                            401 -> appendLine("Cause: Invalid or missing token")
                            403 -> appendLine("Cause: Onboarding not completed")
                            404 -> appendLine("Cause: Wrong endpoint URL")
                            500 -> appendLine("Cause: Server error - check token validity")
                            else -> appendLine("Cause: Unknown error")
                        }
                        appendLine("")
                        appendLine("=== TEST FAILED ===")
                    }

                } catch (e: Exception) {
                    appendLine("✗ EXCEPTION OCCURRED")
                    appendLine("")
                    appendLine("Error Type: ${e.javaClass.simpleName}")
                    appendLine("Error Message: ${e.message}")
                    appendLine("")
                    appendLine("Stack Trace:")
                    appendLine(e.stackTraceToString())
                    appendLine("")
                    appendLine("=== TEST FAILED ===")
                    appendLine("")
                    appendLine("Common Causes:")
                    appendLine("- No internet connection")
                    appendLine("- Wrong base URL")
                    appendLine("- Network timeout")
                }
            }

            withContext(Dispatchers.Main) {
                resultText.text = results
            }
        }
    }
}
