# Polaris – versioning

| Component | Where to set | Notes |
|-----------|----------------|-------|
| **Next.js / web** | `package.json` → `"version"` | Semantic version (e.g. `0.2.0`). Bump when you ship web changes. |
| **Android widget** | `android-widget/version.properties` | `VERSION_CODE` (integer, always ↑) + `VERSION_NAME` (e.g. `1.9.0` or `1.9.0-beta.1`). See `android-widget/VERSIONING.md`. |
| **Capacitor Android** | `android/app/build.gradle` | `versionCode` / `versionName` for the PWA shell APK. |

**Beta vs release (widget):** use two **product flavors** — `prod` (default) and `beta` (separate app id `com.polaris.widget.beta`). See `android-widget/VERSIONING.md` for Gradle commands and APK paths.
