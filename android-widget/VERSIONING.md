# Polaris Android Widget – versioning

## Files

| What | Where |
|------|--------|
| **Widget** version code + name | `android-widget/version.properties` |
| **Capacitor** Android shell | `android/app/build.gradle` (`versionCode` / `versionName`) |
| **Web** app (npm) | `package.json` → `"version"` |

Bump **`VERSION_CODE`** for every build you ship (Play Store, GitHub Releases, sideload). It must always increase.

**`VERSION_NAME`** uses semantic versioning:

| Track | Example `VERSION_NAME` | Android output |
|-------|------------------------|----------------|
| **Release** | `1.9.0` | `prod` flavor → shows as `1.9.0` |
| **Beta** (optional) | `1.9.0` in `version.properties` + `beta` flavor | shows as `1.9.0-beta` and package `com.polaris.widget.beta` |

For **beta-only** strings like `1.9.0-beta.1`, edit `VERSION_NAME` in `version.properties` to `1.9.0-beta.1` and build **`prod`** flavor — the displayed name is exactly what you put in `VERSION_NAME`.

## Build commands

| Goal | Command |
|------|---------|
| **Production release** (default for distribution) | `./gradlew assembleProdRelease` |
| **Beta** (side-by-side with prod; different app id) | `./gradlew assembleBetaRelease` |
| Local debug (prod) | `./gradlew assembleProdDebug` |

Output paths (Gradle):

- Prod release: `app/build/outputs/apk/prod/release/app-prod-release.apk`
- Beta release: `app/build/outputs/apk/beta/release/app-beta-release.apk`

## CI

GitHub Actions `.github/workflows/build-android.yml` builds the **Capacitor** `android/` app (PWA shell), not `android-widget/`. It uploads **release** first, then debug; use the **release** artifact for distribution.

## Script

`build-widget.ps1` runs **`assembleProdRelease`** → production APK path above.
