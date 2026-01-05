# Building Polaris Android Widget

Complete guide to building and deploying the Android widget app.

## Prerequisites

### Required Software

1. **Android Studio** (Hedgehog 2023.1.1 or newer)
   - Download: https://developer.android.com/studio
   - Install with default settings

2. **JDK 17** (included with Android Studio)
   - Verify: `java -version` should show 17.x

3. **Android SDK** (installed via Android Studio)
   - SDK Platform 34 (Android 14)
   - SDK Build Tools 34.0.0+

### First-Time Setup

1. **Open Project in Android Studio**
   ```
   File → Open → Select android-widget folder
   ```

2. **Let Gradle Sync**
   - Android Studio will automatically download dependencies
   - This may take 5-10 minutes on first run
   - Watch the bottom status bar for progress

3. **SDK Setup** (if prompted)
   - Tools → SDK Manager
   - Check "Android 14.0 (API 34)"
   - Click "Apply"

## Building Debug APK (For Testing)

### Option 1: Android Studio GUI

1. **Build → Make Project** (or Ctrl+F9)
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for "Build successful" notification
4. Click "locate" in notification
5. APK is at: `app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Command Line

```bash
cd android-widget
./gradlew assembleDebug
```

Windows:
```cmd
cd android-widget
gradlew.bat assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

## Building Release APK (For Distribution)

### Step 1: Generate Signing Key

**First time only:**

```bash
keytool -genkey -v -keystore polaris-widget.keystore -alias polaris -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- **Keystore password**: Choose a strong password (save it!)
- **Name/Org info**: Enter your details
- **Key password**: Press Enter to use same as keystore password

**Important:** Save `polaris-widget.keystore` file securely! You need it to update the app later.

### Step 2: Configure Signing

Create `android-widget/keystore.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=polaris
storeFile=../polaris-widget.keystore
```

**Add to .gitignore** (already done):
```
keystore.properties
*.keystore
*.jks
```

Update `app/build.gradle.kts`:

```kotlin
// Add after android {
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...

    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

### Step 3: Build Release APK

**Android Studio:**
1. Build → Select Build Variant → Change "debug" to "release"
2. Build → Build Bundle(s) / APK(s) → Build APK(s)
3. Output: `app/build/outputs/apk/release/app-release.apk`

**Command Line:**
```bash
./gradlew assembleRelease
```

## Testing on Device

### Option 1: USB Debugging

1. **Enable Developer Options** on Android device:
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"

2. **Connect device via USB**
   - Allow debugging when prompted

3. **Install APK**:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

   Or in Android Studio:
   - Run → Run 'app'
   - Select your device

### Option 2: Install APK Directly

1. **Transfer APK to phone** (email, Google Drive, USB, etc.)
2. **Open APK on phone**
3. **Allow "Install from Unknown Sources"** if prompted
4. **Install**

### Testing the Widget

1. Long-press home screen
2. Tap "Widgets"
3. Find "Polaris"
4. Drag to home screen
5. Configuration screen appears
6. Paste widget token from https://polaris-iota-orcin.vercel.app/widget
7. Tap "Save"
8. Widget should show current orientation

## Distribution Options

### Option 1: Direct APK Distribution (Immediate)

**Pros:**
- No app store approval needed
- Instant distribution
- Free

**Cons:**
- Users must enable "Install from Unknown Sources"
- No automatic updates
- Manual version management

**How to:**
1. Build release APK (see above)
2. Upload to GitHub Releases:
   ```bash
   gh release create v1.0.0 app/build/outputs/apk/release/app-release.apk
   ```
3. Share download link

### Option 2: Google Play Store (Recommended for wider use)

**Pros:**
- Professional distribution
- Automatic updates
- User trust
- Better discoverability

**Cons:**
- $25 one-time registration fee
- 1-2 day review process
- Requires privacy policy

**Steps:**

1. **Create Google Play Console Account**
   - Go to https://play.google.com/console
   - Pay $25 one-time fee
   - Complete developer profile

2. **Create App**
   - "Create app"
   - Name: "Polaris Widget"
   - Category: Productivity

3. **Upload Release**
   - Production → Create new release
   - Upload `app-release.apk` or build AAB:
     ```bash
     ./gradlew bundleRelease
     ```
   - Upload `app/build/outputs/bundle/release/app-release.aab`

4. **App Content**
   - Privacy policy (required)
   - Screenshots (required)
   - Feature graphic
   - App description

5. **Submit for Review**
   - Typically approved within 1-2 days

## Versioning

Update version in `app/build.gradle.kts`:

```kotlin
defaultConfig {
    versionCode = 2  // Increment for each release
    versionName = "1.0.1"  // User-visible version
}
```

**Version Code Rules:**
- Must increment for each new release
- Google Play rejects lower version codes
- Suggestion: Use date-based (e.g., 20260104 for Jan 4, 2026)

**Version Name:**
- User-visible (e.g., "1.0.0", "1.1.0")
- Semantic versioning recommended

## Troubleshooting

### Gradle Sync Failed

**Error:** "Could not resolve dependencies"
**Fix:**
```bash
./gradlew clean
./gradlew build --refresh-dependencies
```

### Build Failed - ProGuard

**Error:** "Resource shrinking failed"
**Fix:** Temporarily disable in `app/build.gradle.kts`:
```kotlin
buildTypes {
    release {
        isMinifyEnabled = false  // Change to false
    }
}
```

### APK Install Failed

**Error:** "App not installed"
**Fix:**
- Uninstall old version first
- Check Android version (need 8.0+)
- Verify signing (release APK must be signed)

### Widget Doesn't Update

**Check:**
1. Token is saved correctly
2. Internet connection active
3. API endpoint accessible
4. Check LogCat in Android Studio for errors

## CI/CD (Optional)

### GitHub Actions for Automated Builds

Create `.github/workflows/android.yml`:

```yaml
name: Android Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build Release APK
        run: |
          cd android-widget
          ./gradlew assembleRelease

      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: android-widget/app/build/outputs/apk/release/app-release.apk
```

## Next Steps

1. **Build debug APK** - Test on your device
2. **Generate signing key** - For release builds
3. **Build release APK** - For distribution
4. **Choose distribution method** - Direct APK or Play Store
5. **Update web app** - Link to download page

## Support

For build issues:
- Check Android Studio "Build" tab for detailed errors
- View LogCat for runtime errors
- File issue on GitHub: https://github.com/jonathanzahler00/Polaris/issues
