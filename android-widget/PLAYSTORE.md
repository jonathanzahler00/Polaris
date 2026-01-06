# Publishing Polaris Widget to Google Play Store

## Prerequisites

1. **Google Play Developer Account** ($25 one-time fee)
   - Sign up at: https://play.google.com/console/signup

2. **Android App Bundle (AAB)** - Required for Play Store
   - Play Store requires AAB format, not APK
   - We'll build this below

3. **Keystore file** (for signing)
   - Created by `build-widget.ps1` script
   - **CRITICAL**: Keep this file and password safe forever!
   - You cannot publish updates without it

## Step 1: Build for Play Store

Instead of building an APK, we need to build an AAB (Android App Bundle):

```powershell
# In android-widget directory
.\gradlew.bat bundleRelease
```

This creates: `app\build\outputs\bundle\release\app-release.aab`

## Step 2: Sign the AAB

The AAB should already be signed if you have the keystore configured in `gradle.properties`.

Create `gradle.properties` in the `android-widget` directory:

```properties
POLARIS_STORE_FILE=../polaris-widget.keystore
POLARIS_STORE_PASSWORD=YOUR_KEYSTORE_PASSWORD
POLARIS_KEY_ALIAS=polaris
POLARIS_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

**IMPORTANT**: Add `gradle.properties` to `.gitignore` to keep passwords secret!

## Step 3: Prepare App Store Listing

### Required Assets:

1. **App Icon** (512x512 PNG, 32-bit)
   - Use the Polaris logo

2. **Feature Graphic** (1024x500 PNG/JPG)
   - Banner image for Play Store listing

3. **Screenshots** (at least 2)
   - Phone screenshots: 320-3840px on shortest side
   - Show the widget in action on home screen

4. **Privacy Policy URL**
   - Required if app accesses sensitive data
   - Host on your website or GitHub Pages

### App Details:

- **App Name**: Polaris Widget
- **Short Description** (80 chars max):
  "Display your daily orientation on your Android home screen"

- **Full Description** (4000 chars max):
```
Polaris Widget displays your daily intention or orientation directly on your Android home screen.

Stay focused on what matters most by seeing your daily commitment every time you look at your phone.

FEATURES:
• Home screen widget showing your current daily orientation
• Syncs with your Polaris web app
• Automatic updates throughout the day
• Clean, minimal design
• Offline support with smart caching

REQUIRES:
A Polaris account (free to create at [your-url])

SETUP:
1. Install the widget
2. Add Polaris widget to your home screen
3. Enter your Polaris account email
4. Copy your API token from the web app
5. Your orientation appears on your home screen!

PRIVACY:
Your data is private and synced securely with your Polaris account. We never share or sell your information.
```

- **Category**: Productivity
- **Content Rating**: Everyone
- **Target Audience**: Adults (18+)

## Step 4: Create Play Store Console Listing

1. **Go to Play Console**: https://play.google.com/console
2. **Create Application**
3. **Fill in App Details**:
   - App name
   - Default language
   - App or game: App
   - Free or paid: Free

4. **Store Listing**:
   - Upload all assets
   - Add screenshots
   - Fill in descriptions
   - Add privacy policy URL

5. **Content Rating**:
   - Complete the questionnaire
   - Get your rating certificate

6. **App Content**:
   - Privacy policy
   - Ads declaration (No ads)
   - Data safety form

7. **Upload AAB**:
   - Create a new release
   - Upload `app-release.aab`
   - Add release notes

8. **Submit for Review**

## Step 5: Review Process

- Google reviews typically take 1-7 days
- You'll receive email notifications
- May need to address feedback

## Future Updates

When you update the app:

1. **Increment version in `build.gradle.kts`**:
   ```kotlin
   versionCode = 2  // Increment this
   versionName = "1.1"  // Update version string
   ```

2. **Build new AAB**: `.\gradlew.bat bundleRelease`

3. **Upload to Play Console** in "Production" → "Create new release"

4. **Add release notes** describing changes

## Important Notes

### Keystore Security
- **NEVER** commit your keystore or `gradle.properties` to Git
- **BACKUP** your keystore file securely (cloud storage, external drive)
- If you lose the keystore, you CANNOT update your app
- You would have to publish as a new app with a new package name

### Package Name
- Current: `com.polaris.widget`
- **CANNOT** be changed after first publish
- Must be unique on Play Store

### Testing Before Publishing

Test on multiple devices:
- Different Android versions (API 26+)
- Different screen sizes
- Different manufacturers (Samsung, Google, etc.)

Consider using **Internal Testing** or **Closed Testing** tracks first before Production release.

## Resources

- [Play Console](https://play.google.com/console)
- [Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
- [App Bundle Format](https://developer.android.com/guide/app-bundle)
- [Play Store Guidelines](https://play.google.com/about/developer-content-policy/)
