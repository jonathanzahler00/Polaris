import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services")
}

// Version numbers: edit ../version.properties (see VERSIONING.md)
val versionProps =
    Properties().apply {
        rootProject.file("version.properties").inputStream().use { load(it) }
    }
val appVersionCode = versionProps.getProperty("VERSION_CODE").toInt()
val appVersionName = versionProps.getProperty("VERSION_NAME")

android {
    namespace = "com.polaris.widget"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.polaris.widget"
        minSdk = 26
        targetSdk = 34
        versionCode = appVersionCode
        versionName = appVersionName

        // Default Polaris API base URL (must end with / for Retrofit)
        buildConfigField("String", "DEFAULT_BASE_URL", "\"https://polarisapp.vercel.app/\"")
    }

    // prod = store / main release (com.polaris.widget). beta = test track, separate install (com.polaris.widget.beta)
    flavorDimensions += "track"
    productFlavors {
        create("prod") {
            dimension = "track"
        }
        create("beta") {
            dimension = "track"
            applicationIdSuffix = ".beta"
            versionNameSuffix = "-beta"
        }
    }

    signingConfigs {
        create("release") {
            val keystorePath = project.findProperty("POLARIS_KEYSTORE_PATH") as String? ?: "../polaris-widget.keystore"
            val keystorePass = project.findProperty("POLARIS_KEYSTORE_PASSWORD") as String? ?: ""
            val keyAliasName = project.findProperty("POLARIS_KEY_ALIAS") as String? ?: "polaris"
            val keyPass = project.findProperty("POLARIS_KEY_PASSWORD") as String? ?: keystorePass
            if (file(keystorePath).exists() && keystorePass.isNotEmpty()) {
                storeFile = file(keystorePath)
                storePassword = keystorePass
                keyAlias = keyAliasName
                keyPassword = keyPass
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (signingConfigs.getByName("release").storeFile?.exists() == true) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    // WorkManager for background updates
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Firebase Cloud Messaging – for instant widget refresh after orientation is locked
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-messaging-ktx")
}
