# Polaris Android Widget - Quick Deployment Guide

## TL;DR - Ship It Now

### 1. Build Release APK (5 minutes)

```bash
cd android-widget

# Generate signing key (first time only)
keytool -genkey -v -keystore polaris-widget.keystore -alias polaris -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
./gradlew assembleRelease
```

**Output:** `app/build/outputs/apk/release/app-release.apk`

### 2. Host on GitHub Releases (2 minutes)

```bash
# Create release on GitHub
gh release create v1.0.0 android-widget/app/build/outputs/apk/release/app-release.apk \
  --title "Polaris Widget v1.0.0" \
  --notes "Initial release - Native Android widget for Polaris"
```

**Download URL:**
`https://github.com/jonathanzahler00/Polaris/releases/download/v1.0.0/app-release.apk`

### 3. Update Web App Widget Page (3 minutes)

Edit `src/app/widget/WidgetClient.tsx`:

```tsx
<div className="rounded-lg border-2 border-neutral-900 bg-neutral-50 p-6">
  <h2 className="text-xl font-semibold text-neutral-900 mb-3">
    Native Android Widget (Recommended)
  </h2>
  <p className="text-sm text-neutral-600 mb-4">
    Install the official Polaris widget app for the best experience.
  </p>

  <a
    href="https://github.com/jonathanzahler00/Polaris/releases/latest/download/app-release.apk"
    download
    className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800"
  >
    Download Polaris Widget (APK)
  </a>

  <div className="mt-4 space-y-2 text-sm text-neutral-600">
    <p><strong>Setup:</strong></p>
    <ol className="list-decimal list-inside space-y-1">
      <li>Download and install the APK</li>
      <li>Long-press home screen → Widgets → Polaris</li>
      <li>Paste token: <code className="text-xs bg-neutral-100 px-1 rounded">{token}</code></li>
      <li>Done! Widget updates every 30 minutes</li>
    </ol>
  </div>
</div>
```

### 4. Test (2 minutes)

1. Download APK on Android phone
2. Install (allow "Unknown Sources" if needed)
3. Add widget to home screen
4. Paste token
5. Verify orientation displays

**Total time: ~12 minutes from start to shipped**

---

## User Installation Flow

### What Users See:

1. **Visit polaris.vercel.app/widget**
   - See "Download Polaris Widget" button
   - Token is displayed

2. **Tap Download**
   - Browser downloads APK
   - "Unknown source" warning (expected)

3. **Install APK**
   - Open Downloads
   - Tap `app-release.apk`
   - Allow installation
   - Open app (optional - just for token management)

4. **Add Widget**
   - Long-press home screen
   - Widgets → Polaris
   - Drag to home screen
   - Config screen opens

5. **Paste Token**
   - Paste from widget page
   - Tap "Save"
   - Widget appears with today's orientation

6. **Done!**
   - Widget auto-updates every 30 min
   - Tap widget → opens Polaris web app

---

## Distribution Strategy

### Phase 1: Direct APK (Now - Week 1)

**Why:**
- Ship immediately
- Zero gatekeepers
- Test with real users
- Validate demand

**How:**
- GitHub Releases
- Link from web app
- Simple download button

**User friction:**
- Need to enable "Unknown Sources" (one-time)
- Manual updates (rare for widgets)

### Phase 2: Google Play (Week 2+)

**When to switch:**
- If 10+ active users
- If manual updates become annoying
- If you want better distribution

**Requirements:**
- $25 Google Play Console account
- Privacy policy page
- Screenshots (4)
- Feature graphic
- 1-2 day review

**Benefits:**
- No "Unknown Sources" warning
- Automatic updates
- Professional presence
- Better discoverability

---

## Maintenance

### Releasing Updates

1. **Update version** in `app/build.gradle.kts`:
   ```kotlin
   versionCode = 2  // Increment
   versionName = "1.0.1"
   ```

2. **Build new release:**
   ```bash
   ./gradlew assembleRelease
   ```

3. **Create GitHub release:**
   ```bash
   gh release create v1.0.1 app/build/outputs/apk/release/app-release.apk
   ```

4. **Notify users** (if not on Play Store)

### Monitoring

**Check:**
- GitHub release download count
- Widget API endpoint usage (in Vercel analytics)
- User feedback/issues

---

## Google Play Submission (Optional)

### 1. Account Setup ($25 one-time)
- https://play.google.com/console
- Complete developer profile

### 2. Create Privacy Policy
Create `PRIVACY.md`:

```markdown
# Polaris Widget Privacy Policy

**Data Collection:**
- No personal data collected
- Widget token stored locally on device
- No analytics, no tracking, no third-party services

**Data Usage:**
- Token used only to fetch your daily orientation
- All data remains on your device
- Network requests only to polaris-iota-orcin.vercel.app

**Data Sharing:**
- No data shared with third parties
- No advertising, no monetization

**Contact:** [your-email@example.com]
```

Host at: `https://polaris-iota-orcin.vercel.app/privacy`

### 3. Prepare Assets

**Screenshots (4 required):**
- Home screen with widget
- Widget configuration
- Main app screen
- Different widget showing orientation

**Feature Graphic (1024x500):**
- "Polaris Widget" branding
- Clean, minimal design matching app

### 4. Create App Listing

```
Name: Polaris Widget
Short description: Display your daily orientation on your home screen
Full description:
Polaris Widget displays your daily orientation directly on your Android home screen.

Set your daily focus in the Polaris web app, and it automatically appears on your phone's home screen. Stay oriented throughout the day without opening any apps.

Features:
• Native Android home screen widget
• Auto-updates every 30 minutes
• Clean, minimal design
• Secure token-based authentication
• Tiny app size (~2MB)

Requires a Polaris account at polaris-iota-orcin.vercel.app

Category: Productivity
```

### 5. Upload & Submit

1. Create production release
2. Upload `app-release.aab` (build with `./gradlew bundleRelease`)
3. Complete content rating questionnaire
4. Add privacy policy URL
5. Submit for review

**Review time:** 1-2 days typically

---

## Troubleshooting

### Users Can't Install APK

**Issue:** "App not installed"
**Fix:**
1. Settings → Security → Enable "Install from Unknown Sources"
2. Or Settings → Apps → Special Access → Install Unknown Apps → Chrome → Allow

### Widget Shows "Connection Error"

**Check:**
1. Internet connection
2. Token is valid
3. API endpoint is up (check Vercel)
4. Token hasn't been revoked

### Widget Not Updating

**Fix:**
- Check refresh interval (30 min)
- Battery saver might block background updates
- Manually refresh: tap widget

---

## Next Steps

1. ✅ Build release APK
2. ✅ Upload to GitHub Releases
3. ✅ Update web app with download link
4. ✅ Test on real device
5. ⏱️ Monitor usage for 1 week
6. ⏱️ Decide on Play Store submission
7. ⏱️ Add screenshots and polish if going to Play Store

**You're ready to ship!** 🚀
