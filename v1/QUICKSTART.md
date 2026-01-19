# Quick Start Guide

Get up and running with Google Drive Tree Navigator in 5 steps.

## Prerequisites

- Chrome 114+
- Google account
- 15-20 minutes for setup

## Setup Steps

### 1️⃣ Google Cloud Console (10 minutes)

1. Go to https://console.cloud.google.com
2. Create new project: "Drive Tree Extension"
3. Enable "Google Drive API"
4. OAuth consent screen:
   - User type: External
   - App name: "Google Drive Tree Navigator"
   - Add your email as test user
   - Scopes: Add all three Drive scopes
5. Create credentials:
   - Type: OAuth 2.0 Client ID
   - Application type: Chrome extension
   - Note: You'll update the redirect URI in step 4

### 2️⃣ Load Extension (2 minutes)

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select this extension folder
5. **Copy the Extension ID** (looks like: `abcdefghijklmnop...`)

### 3️⃣ Update OAuth Redirect (2 minutes)

1. Back to Google Cloud Console → Credentials
2. Click your OAuth 2.0 Client ID
3. Add to "Authorized redirect URIs":
   ```
   https://YOUR_EXTENSION_ID.chromiumapp.org/
   ```
   (Replace YOUR_EXTENSION_ID with the ID you copied)
4. Save

### 4️⃣ Add Client ID to Extension (1 minute)

1. Open `manifest.json` in a text editor
2. Find the `oauth2` section
3. Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID from Google Cloud Console
4. Save the file
5. Go back to `chrome://extensions/` and click the reload icon ↻ on the extension

### 5️⃣ Create Icons (2 minutes)

**Option A - Quick Test** (Use for immediate testing):
- The extension will work without proper icons
- Chrome will show a default icon

**Option B - Proper Icons** (Recommended):
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icons/icon.svg`
3. Convert to PNG at these sizes:
   - 16x16 → save as `icons/icon16.png`
   - 48x48 → save as `icons/icon48.png`
   - 128x128 → save as `icons/icon128.png`
4. Reload the extension

## Testing

1. Click the extension icon in Chrome toolbar
2. Click "Sign In with Google"
3. Choose your Google account
4. Accept permissions
5. Your Drive folders should appear! 🎉

## Common Issues

**"OAuth2 client ID invalid"**
→ Double-check Client ID in manifest.json matches Cloud Console

**"Sign in button doesn't work"**
→ Verify redirect URI includes your exact extension ID

**"Extension ID changed"**
→ Extension IDs change when you modify files. Update the redirect URI in Cloud Console

**Still stuck?**
→ See [SETUP.md](SETUP.md) for detailed troubleshooting

## What's Next?

✅ Pin your favorite folders
✅ Try creating a new file
✅ Search for files
✅ Right-click for more options

**Full documentation**: [README.md](Readme.md)
**Detailed setup**: [SETUP.md](SETUP.md)

---

**Setup time**: ~15-20 minutes first time, ~5 minutes for additional users

**Enjoy your new Drive navigator!** 🚀
