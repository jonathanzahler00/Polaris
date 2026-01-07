package com.polaris.widget.data

import android.util.Log
import com.google.gson.annotations.SerializedName
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * API response model
 */
data class OrientationResponse(
    @SerializedName("text")
    val text: String?,

    @SerializedName("date")
    val date: String?,

    @SerializedName("locked")
    val locked: Boolean?
)

/**
 * Polaris API interface
 */
interface PolarisApi {
    @GET("/api/widget/today")
    suspend fun getTodayOrientation(
        @Query("token") token: String
    ): Response<OrientationResponse>
}

/**
 * API client factory
 */
object PolarisApiClient {
    fun create(baseUrl: String): PolarisApi {
        Log.d("PolarisWidget", "Creating API client with baseUrl: $baseUrl")

        val loggingInterceptor = HttpLoggingInterceptor { message ->
            Log.d("PolarisWidget", "HTTP: $message")
        }.apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        return retrofit.create(PolarisApi::class.java)
    }
}
