# Polaris Android Widget

Home screen widget that shows your daily orientation from the Polaris app.

## Requirements

- Android Studio (Ladybug or newer recommended)
- **JDK 17** – Gradle/Kotlin do not support Java 21+ (e.g. Java 25) yet. Use JDK 17 to run the build.
- Android SDK 26+ (min), 34 (target)

### If you see "IllegalArgumentException: 25" or "What went wrong: 25"

Your system is using Java 25 (or another very new JDK). Gradle must run with **JDK 17**:

- **Windows (PowerShell):**  
  `$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"`  
  (Or use Android Studio’s bundled JDK: `C:\Program Files\Android\Android Studio\jbr`. Adjust if your Adoptium folder version differs.)

- **macOS/Linux:**  
  `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`  
  or point `JAVA_HOME` to your JDK 17 install.

Then run `./gradlew assembleProdDebug` again.

## Version numbers

Edit **`version.properties`** at the repo root of this folder (`VERSION_CODE`, `VERSION_NAME`).  
See **[VERSIONING.md](VERSIONING.md)** for beta vs prod flavors and naming.

## Build

We use **product flavors**: **`prod`** (default store build) and **`beta`** (separate app id for side-by-side testing).

### Debug (no keystore)

```bash
cd android-widget
./gradlew assembleProdDebug
```

APK: `app/build/outputs/apk/prod/debug/app-prod-debug.apk`

### Release (signed) — what you ship

1. Create a keystore (once):

   ```bash
   keytool -genkey -v -keystore polaris-widget.keystore -alias polaris -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Either place `polaris-widget.keystore` in `android-widget/` and set passwords in `gradle.properties` (do not commit):

   ```properties
   POLARIS_KEYSTORE_PATH=../polaris-widget.keystore
   POLARIS_KEYSTORE_PASSWORD=your_keystore_password
   POLARIS_KEY_ALIAS=polaris
   POLARIS_KEY_PASSWORD=your_key_password
   ```

   Or leave the sample values in `app/build.gradle.kts` only for local builds (never commit real passwords).

3. Bump **`version.properties`**, then build **production** release:

   ```bash
   ./gradlew assembleProdRelease
   ```

   APK: `app/build/outputs/apk/prod/release/app-prod-release.apk`

4. **Beta track** (optional — installs as `com.polaris.widget.beta`, version name gets `-beta` suffix):

   ```bash
   ./gradlew assembleBetaRelease
   ```

   APK: `app/build/outputs/apk/beta/release/app-beta-release.apk`

PowerShell: **`build-widget.ps1`** runs `assembleProdRelease` and prints the prod release path.

## Setup (users)

1. Install the APK.
2. Add the Polaris widget to the home screen (long-press → Widgets → Polaris).
3. When prompted, open [polarisapp.vercel.app](https://polarisapp.vercel.app), sign in, go to **Widget**, and generate/copy your token.
4. Paste the token in the widget config and tap **Save**. Optionally set a custom server URL if you self-host Polaris.

The widget refreshes every few minutes and on tap; tap also opens the Polaris web app. When you lock an orientation in the web app, the server sends an FCM push to all registered devices so the widget updates immediately without waiting for the next polling cycle.

### Daily reset behaviour

| Time | Widget shows |
|------|-------------|
| Focus locked (any time) | Your focus text and the date it was set |
| Overnight / before 6 am | Same locked focus carried forward — never goes blank overnight |
| **6:00 am (your local time)** | **Resets → "Waiting for today's focus"** |
| After 6 am, new focus locked | Today's focus text and today's date |

The 6 am reset uses your account timezone (set in the Polaris app). Until you lock a new focus after 6 am, the widget shows the waiting message so you have a clear prompt to set your intention for the day.

## Project structure

- `app/src/main/java/com/polaris/widget/` – widget provider, config activity
- `app/src/main/java/com/polaris/widget/PolarisFirebaseMessagingService.kt` – FCM service; handles instant widget refresh and token registration with the server
- `app/src/main/java/com/polaris/widget/data/` – API client, token/cache storage
- `app/src/main/java/com/polaris/widget/workers/` – WorkManager periodic update
- `app/src/main/res/layout/` – widget and config UI
- `app/src/main/res/xml/widget_info.xml` – widget metadata (size, update interval)

## Version

- **`version.properties`** — `VERSION_CODE` and `VERSION_NAME` (loaded by `app/build.gradle.kts`).
