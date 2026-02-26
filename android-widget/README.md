# Polaris Android Widget

Home screen widget that shows your daily orientation from the Polaris app.

## Requirements

- Android Studio (Ladybug or newer recommended)
- **JDK 17** – Gradle/Kotlin do not support Java 21+ (e.g. Java 25) yet. Use JDK 17 to run the build.
- Android SDK 26+ (min), 34 (target)

### If you see "IllegalArgumentException: 25" or "What went wrong: 25"

Your system is using Java 25 (or another very new JDK). Gradle must run with **JDK 17**:

- **Windows (PowerShell):**  
  `$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"`  
  (Adjust path if JDK 17 is installed elsewhere, e.g. `C:\Program Files\Eclipse Adoptium\jdk-17*`.)

- **macOS/Linux:**  
  `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`  
  or point `JAVA_HOME` to your JDK 17 install.

Then run `./gradlew assembleDebug` again.

## Build

### Debug (no keystore)

```bash
cd android-widget
./gradlew assembleDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`

### Release (signed)

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

3. Build release:

   ```bash
   ./gradlew assembleRelease
   ```

APK: `app/build/outputs/apk/release/app-release.apk`

## Setup (users)

1. Install the APK.
2. Add the Polaris widget to the home screen (long-press → Widgets → Polaris).
3. When prompted, open [polarisapp.vercel.app](https://polarisapp.vercel.app), sign in, go to **Widget**, and generate/copy your token.
4. Paste the token in the widget config and tap **Save**. Optionally set a custom server URL if you self-host Polaris.

The widget refreshes periodically and on tap; tap also opens the Polaris web app.

## Project structure

- `app/src/main/java/com/polaris/widget/` – widget provider, config activity
- `app/src/main/java/com/polaris/widget/data/` – API client, token/cache storage
- `app/src/main/java/com/polaris/widget/workers/` – WorkManager periodic update
- `app/src/main/res/layout/` – widget and config UI
- `app/src/main/res/xml/widget_info.xml` – widget metadata (size, update interval)

## Version

- **versionCode** / **versionName** in `app/build.gradle.kts` (currently 12 / 1.7.0).
