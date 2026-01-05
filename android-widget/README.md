# Polaris Android Widget

Native Android home screen widget for displaying your daily orientation.

## Overview

This is a lightweight Android app that provides a single feature: a home screen widget displaying today's orientation from your Polaris account.

## Features

- 📱 Native Android home screen widget
- 🔄 Auto-updates every 30-60 minutes
- 🔒 Secure token-based authentication
- 📦 Minimal size (~2MB APK)
- 🎨 Clean, readable design matching Polaris aesthetic

## Architecture

```
Android Widget App
    ↓ (HTTP GET with token)
Polaris API (/api/widget/today)
    ↓
Supabase Database
```

**No direct Supabase access** - the widget simply fetches from your existing API endpoint.

## Tech Stack

- **Language:** Kotlin
- **Min SDK:** 26 (Android 8.0+)
- **Target SDK:** 34 (Android 14)
- **Key Components:**
  - `AppWidgetProvider` - Widget lifecycle
  - `WorkManager` - Background updates
  - `Retrofit` - API calls
  - `SharedPreferences` - Token storage

## Project Structure

```
app/src/main/
├── java/com/polaris/widget/
│   ├── PolarisWidget.kt          # AppWidgetProvider
│   ├── PolarisWidgetService.kt   # Fetches data from API
│   ├── WidgetConfigActivity.kt   # Token setup screen
│   ├── data/
│   │   ├── PolarisApi.kt         # API interface
│   │   └── TokenManager.kt       # SharedPreferences wrapper
│   └── workers/
│       └── WidgetUpdateWorker.kt # Background refresh
├── res/
│   ├── layout/
│   │   ├── widget_layout.xml     # Widget appearance
│   │   └── activity_config.xml   # Config screen
│   └── xml/
│       └── widget_info.xml       # Widget metadata
└── AndroidManifest.xml
```

## Build Instructions

### Prerequisites

- Android Studio (latest stable)
- JDK 17+
- Android SDK 34

### Steps

1. Open Android Studio
2. File → Open → Select `android-widget` folder
3. Let Gradle sync
4. Build → Generate Signed Bundle/APK
5. Create/use signing key
6. Generate release APK

### For Development

```bash
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

## User Setup Flow

1. Install APK on Android device
2. Long-press home screen → Widgets
3. Find "Polaris" widget, drag to home screen
4. Configuration screen opens automatically
5. Paste widget token from https://polaris.vercel.app/widget
6. Tap "Save"
7. Widget appears with current orientation

## Widget Behavior

- **On add:** Shows "Tap to configure" until token is set
- **After config:** Fetches orientation immediately
- **Updates:** Every 30 minutes automatically
- **On tap:** Opens Polaris web app
- **No data:** Shows "Not set yet"

## API Integration

Calls: `GET /api/widget/today?token={USER_TOKEN}`

Expected response:
```json
{
  "text": "Focus on what matters most",
  "date": "2026-01-04",
  "locked": false
}
```

Widget displays the `text` field.

## Distribution

### Option 1: Direct APK (Immediate)
- Build signed release APK
- Host on GitHub Releases
- Link from Polaris web app

### Option 2: Google Play (Later)
- Better distribution and updates
- Requires Google Play Console account ($25 one-time)
- 1-2 day review process

## Roadmap

- [ ] Basic widget with text display
- [ ] Token configuration screen
- [ ] Auto-refresh every 30 min
- [ ] Tap widget → open Polaris web app
- [ ] Material Design 3 styling
- [ ] Dark mode support
- [ ] Multiple widget sizes
- [ ] Offline caching
- [ ] Google Play release

## Development Timeline

- **Day 1:** Project setup, basic widget layout
- **Day 2:** API integration, token management
- **Day 3:** Background updates, configuration UI
- **Day 4:** Polish, testing, APK build
- **Day 5:** Documentation, release

## License

Same as Polaris main project
