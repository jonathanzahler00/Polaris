package com.polaris.widget.data

import com.google.gson.annotations.SerializedName
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
        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        return retrofit.create(PolarisApi::class.java)
    }
}
