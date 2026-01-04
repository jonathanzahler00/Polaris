# Polaris Widget Setup Guide

Display your daily orientation on your phone's home screen using third-party widget apps.

## 📱 Supported Platforms

- ✅ **Android** - via KWGT, Widget Launcher, or any HTTP widget app
- ✅ **iOS** - via Widgetsmith, Scriptable, or Widget Wizard
- ❌ **Native widgets** - Not available (PWA limitation)

---

## 🚀 Quick Start

### Step 1: Generate Widget Token

1. Open Polaris app
2. Tap **"Widget"** in the header
3. Click **"Generate Token"**
4. Copy the generated token (keep it private!)

### Step 2: Get Widget URL

The widget page will show you a complete URL like:
```
https://polaris-iota-orcin.vercel.app/api/widget/today?token=YOUR_TOKEN_HERE
```

Copy this entire URL - you'll need it for your widget app.

---

## 📱 Android Setup (KWGT)

KWGT is the most popular and flexible Android widget app.

### Installation

1. Install **KWGT Kustom Widget Maker** from Google Play Store (free)
2. Grant necessary permissions

### Widget Setup

1. **Add Widget to Home Screen:**
   - Long press on your home screen
   - Select "Widgets"
   - Find "KWGT" and drag a widget to your screen
   - Choose size (recommend 4x1 or 4x2)

2. **Create Custom Widget:**
   - Tap the widget
   - Tap "+" to create a new widget
   - Name it "Polaris" or similar

3. **Add Text Element:**
   - Tap "+" → "Text"
   - Position and size the text element
   - Tap the text element to edit

4. **Configure Formula:**
   - Tap "Formula" (calculator icon)
   - Enter this formula:
   ```
   $wg("https://polaris-iota-orcin.vercel.app/api/widget/today?token=YOUR_TOKEN", json, .text)$
   ```
   - Replace `YOUR_TOKEN` with your actual widget token
   - Tap "Save"

5. **Set Fallback Text:**
   - In the same formula field, add fallback:
   ```
   $if(wg("https://...", json, .text) = "", "Not set yet", wg("https://...", json, .text))$
   ```

6. **Configure Refresh:**
   - Go to widget settings (gear icon)
   - Set "Update Interval" to **1 hour** (KWGT Pro) or **Manual** (Free)
   - Tap "Save"

7. **Style Your Widget:**
   - Customize font, size, color, background
   - Add date/time if desired
   - Save and exit

### Troubleshooting

- **"No data"**: Check your token is correct and not expired
- **Not updating**: Free KWGT updates manually; upgrade to Pro for auto-refresh
- **Network error**: Ensure phone has internet connection

---

## 📱 iOS Setup (Widgetsmith)

Widgetsmith is the easiest option for iOS users.

### Installation

1. Install **Widgetsmith** from App Store (free with Pro upgrade option)
2. Open the app

### Widget Setup

1. **Create New Widget:**
   - Tap "+" to add a new widget
   - Choose size: Small, Medium, or Large

2. **Configure Widget Type:**
   - Tap "Default Widget"
   - Select **"Web"** or **"API"** (Pro feature)
   - Note: Free version has limited web widget support

3. **Enter URL:**
   - Paste your widget URL:
   ```
   https://polaris-iota-orcin.vercel.app/api/widget/today?token=YOUR_TOKEN
   ```
   - Select **JSON** as format
   - Map the `text` field to display

4. **Customize Appearance:**
   - Choose font, size, color
   - Add background if desired
   - Set widget name: "Polaris"

5. **Add to Home Screen:**
   - Long press on iOS home screen
   - Tap "+" in top-left corner
   - Search for "Widgetsmith"
   - Select your widget size
   - Choose your "Polaris" widget

### Limitations

- Free Widgetsmith: Manual refresh only
- Pro Widgetsmith ($1.99/mo): Auto-refresh every 15-60 minutes
- iOS widgets refresh based on iOS intelligence (not guaranteed)

---

## 📱 iOS Setup (Scriptable) - Advanced

Scriptable allows fully custom widgets with JavaScript.

### Installation

1. Install **Scriptable** from App Store (free)
2. Open the app

### Create Script

1. Tap "+" to create new script
2. Name it "Polaris Widget"
3. Paste this code:

```javascript
// Polaris Widget Script for Scriptable
const WIDGET_URL = "https://polaris-iota-orcin.vercel.app/api/widget/today?token=YOUR_TOKEN";

// Fetch data
let req = new Request(WIDGET_URL);
let json;
try {
  json = await req.loadJSON();
} catch (error) {
  console.error("Failed to fetch:", error);
  json = { text: "Error loading", error: true };
}

// Create widget
let widget = new ListWidget();
widget.backgroundColor = new Color("#fafafa");

// Add text
let text = widget.addText(json.text || "Not set yet");
text.font = Font.systemFont(16);
text.textColor = new Color("#0a0a0a");
text.centerAlignText();

// Add date (optional)
let dateText = widget.addText(json.date || "");
dateText.font = Font.systemFont(10);
dateText.textColor = new Color("#737373");
dateText.centerAlignText();

// Set widget
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}

Script.complete();
```

4. Replace `YOUR_TOKEN` with your widget token
5. Save the script

### Add to Home Screen

1. Long press on iOS home screen
2. Tap "+" in top-left corner
3. Search for "Scriptable"
4. Select widget size
5. Long press the widget → "Edit Widget"
6. Choose "Polaris Widget" as script
7. Done!

### Customization

Edit the script to:
- Change colors, fonts, sizes
- Add background images
- Display additional data (date, locked status)
- Add tap actions

---

## 🔒 Security

### Token Safety

- **Keep your token private** - anyone with your token can see your orientations
- **Don't share publicly** - never post token in screenshots or forums
- **Revoke if compromised** - generate a new token if you suspect it's exposed

### Revoking Tokens

1. Go to Polaris → Widget
2. Click "Revoke Token"
3. Old token immediately stops working
4. Generate a new token
5. Update your widget apps with new URL

---

## 🔧 API Reference

### Endpoint

```
GET /api/widget/today
```

### Authentication

**Option 1: Query Parameter**
```
?token=YOUR_WIDGET_TOKEN
```

**Option 2: Authorization Header**
```
Authorization: Bearer YOUR_WIDGET_TOKEN
```

### Response Format

```json
{
  "text": "being present during dinner",
  "date": "2026-01-04",
  "locked": true,
  "timezone": "America/New_York",
  "placeholder": null
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `text` | string \| null | Today's orientation text (null if not set) |
| `date` | string | ISO date in user's timezone (YYYY-MM-DD) |
| `locked` | boolean | Whether orientation is locked for today |
| `timezone` | string | User's timezone (IANA format) |
| `placeholder` | string \| null | Fallback text when not set |

### Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Please sign in or provide a valid widget token"
}
```

**403 Forbidden:**
```json
{
  "error": "Onboarding not completed",
  "message": "Please complete onboarding first"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## 💡 Tips & Tricks

### Styling

- Use neutral colors to match your phone theme
- Keep text large enough to read at a glance
- Add subtle backgrounds for better visibility

### Refresh Rates

- **Android (KWGT Pro)**: 15 minutes to 24 hours
- **iOS (Widgetsmith Pro)**: 15 minutes to 1 hour
- **iOS (Scriptable)**: Based on iOS intelligence

### Multiple Widgets

- Use the same token for all your widgets
- Create different sizes for different locations
- Mix text-only and styled versions

### Offline Behavior

- Most widget apps cache last response
- Widget shows last known value when offline
- Refreshes automatically when connection restored

---

## ❓ FAQ

### Q: Can I use native iOS/Android widgets?
**A:** No, Polaris is a PWA (Progressive Web App), not a native app. Native widgets require native apps built with Swift/Kotlin.

### Q: Why isn't my widget updating automatically?
**A:** Free versions of most widget apps require manual refresh. Upgrade to Pro for auto-refresh. iOS widgets also depend on iOS's refresh intelligence.

### Q: Is my token secure?
**A:** Yes, tokens are cryptographically random. However, treat them like passwords - don't share publicly.

### Q: Can I have multiple tokens?
**A:** No, only one active token per user. Generating a new token revokes the old one.

### Q: Does the widget work offline?
**A:** The widget requires internet to fetch new data. Most apps cache the last response for offline viewing.

### Q: Can other people see my orientation through widgets?
**A:** Only if they have your token. Keep your token private.

---

## 🆘 Troubleshooting

### Widget Shows "Error" or "No Data"

1. Check your token is correct (copy/paste carefully)
2. Verify internet connection
3. Test the URL in a web browser
4. Regenerate token if it's old

### Widget Not Refreshing

1. Check widget app's refresh settings
2. Ensure app has background refresh permission
3. Restart the widget app
4. Try manual refresh

### "Unauthorized" Error

1. Token may be revoked or expired
2. Generate a new token
3. Update widget URL with new token

### Widget Shows Old Data

1. Force refresh in widget app
2. Check if orientation was updated today
3. Verify timezone settings in Polaris

---

## 📚 Resources

- **KWGT Tutorial**: https://www.youtube.com/results?search_query=kwgt+tutorial
- **Widgetsmith Guide**: https://support.apple.com/guide/iphone
- **Scriptable Docs**: https://docs.scriptable.app/

---

**Last Updated:** 2026-01-04
**Polaris Version:** 0.1.0
