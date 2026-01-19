# Google Drive Tree Navigator - Setup Guide

This guide will walk you through setting up the Google Drive Tree Navigator Chrome extension from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Google Cloud Console Setup](#google-cloud-console-setup)
3. [Extension Configuration](#extension-configuration)
4. [Icon Setup](#icon-setup)
5. [Installation in Chrome](#installation-in-chrome)
6. [Testing the Extension](#testing-the-extension)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:

- A Google account
- Google Chrome browser installed
- Basic familiarity with Chrome extensions
- This extension's source code downloaded/cloned

---

## Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" at the top
3. Click "New Project"
4. Enter project name: `Drive Tree Extension` (or any name you prefer)
5. Click "Create"

### Step 2: Enable Google Drive API

1. In your new project, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on "Google Drive API"
4. Click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Click "Create"
4. Fill in the required fields:
   - **App name**: `Google Drive Tree Navigator`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add the following scopes:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.metadata.readonly`
8. Click "Update" and then "Save and Continue"
9. On "Test users" page, click "Add Users"
10. Add your email address (and any other users who will test)
11. Click "Save and Continue"
12. Review and click "Back to Dashboard"

### Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. **Application type**: Select "Chrome extension"
   - If you don't see this option, select "Web application" (we'll modify it)
4. **Name**: `Drive Navigator Extension`
5. For **Authorized redirect URIs**, add:
   ```
   https://<YOUR_EXTENSION_ID>.chromiumapp.org/
   ```

   **Note**: You'll need to get the extension ID first (see next section), then come back and update this.

6. Click "Create"
7. Copy the **Client ID** - you'll need this for the manifest.json

### Step 5: Get Your Extension ID (First-Time Setup)

Since we need the extension ID for OAuth configuration, we'll do a temporary installation:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the extension directory (the folder containing manifest.json)
5. **Copy the Extension ID** shown under your extension name
6. Keep this page open

### Step 6: Update OAuth Credentials with Extension ID

1. Go back to Google Cloud Console → Credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", update to:
   ```
   https://<YOUR_EXTENSION_ID>.chromiumapp.org/
   ```
   Replace `<YOUR_EXTENSION_ID>` with the ID you copied
4. Click "Save"

---

## Extension Configuration

### Update manifest.json

1. Open `manifest.json` in a text editor
2. Find the `oauth2` section
3. Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID from Google Cloud Console
4. Save the file

Example:
```json
"oauth2": {
  "client_id": "123456789-abcdefghijklmnop.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata.readonly"
  ]
}
```

---

## Icon Setup

The extension requires PNG icons in three sizes: 16x16, 48x48, and 128x128.

### Option 1: Convert the SVG (Recommended)

1. Use an online SVG to PNG converter:
   - [CloudConvert](https://cloudconvert.com/svg-to-png)
   - [Online-Convert](https://image.online-convert.com/convert-to-png)

2. Upload `icons/icon.svg`

3. Convert to three sizes:
   - 16x16 → save as `icons/icon16.png`
   - 48x48 → save as `icons/icon48.png`
   - 128x128 → save as `icons/icon128.png`

### Option 2: Use Your Own Icons

Create or download your own PNG icons and save them as:
- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)
- `icons/icon128.png` (128x128 pixels)

### Option 3: Quick Placeholder (For Testing Only)

If you just want to test quickly, you can use simple colored squares:
1. Create three blank PNG files with the sizes above
2. Fill them with any solid color
3. Save with the correct names

---

## Installation in Chrome

### Initial Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Navigate to and select your extension directory
5. The extension should now appear in your extensions list

### Pinning the Extension

1. Click the puzzle piece icon (Extensions) in Chrome toolbar
2. Find "Google Drive Tree Navigator"
3. Click the pin icon to keep it visible

### Opening the Side Panel

**Method 1**: Click the extension icon in the toolbar

**Method 2**:
1. Right-click anywhere on a web page
2. Look for side panel options (Chrome 114+)

---

## Testing the Extension

### First-Time Authentication

1. Click the extension icon to open the side panel
2. Click "Sign In with Google"
3. Select your Google account
4. Review and accept the permissions
5. You should see your Drive folder tree appear

### Testing Core Features

✅ **Folder Navigation**
- Click on a folder to expand/collapse it
- Verify subfolders and files appear

✅ **File Opening**
- Single click a file → Opens in current tab
- Ctrl+Click (Cmd+Click on Mac) → Opens in new tab

✅ **Search**
- Type in the search box
- Verify results filter in real-time

✅ **Multi-Select**
- Check boxes next to multiple files
- Verify selection count appears at bottom

✅ **File Operations**
- Right-click a file → Context menu appears
- Try rename, move, delete (be careful!)

✅ **Create New File**
- Click "+ New" button
- Select file type
- Verify file appears in Drive

✅ **Refresh**
- Click "↻ Refresh" button
- Verify tree reloads

---

## Troubleshooting

### Issue: "OAuth2 client ID invalid"

**Solution**:
1. Double-check the Client ID in manifest.json matches Google Cloud Console exactly
2. Ensure you've enabled the Google Drive API
3. Verify the OAuth consent screen is configured

### Issue: "Sign in button doesn't work"

**Solution**:
1. Open Chrome DevTools (F12) in the side panel
2. Check Console for errors
3. Verify redirect URI in Google Cloud Console matches your extension ID
4. Format should be: `https://YOUR_EXTENSION_ID.chromiumapp.org/`

### Issue: "Files not loading"

**Solution**:
1. Check browser console for API errors
2. Verify you're signed in (check top of sidebar)
3. Try clicking Refresh button
4. Check your Google Drive API quota in Cloud Console

### Issue: "Extension ID changed after reinstalling"

**Solution**:
Extension IDs change when you modify the extension. To keep it stable:
1. In Google Cloud Console, add a `key` field to manifest.json
2. Generate a key: Go to chrome://extensions, click "Pack extension"
3. Use the generated .pem file
4. Or: Publish to Chrome Web Store (even unlisted)

### Issue: Icons not showing

**Solution**:
1. Verify PNG files exist in `icons/` folder
2. Check file names match manifest.json exactly
3. Ensure files are valid PNG format
4. Reload the extension: chrome://extensions → click reload icon

### Issue: "Permission denied" errors

**Solution**:
1. Sign out and sign in again
2. Revoke access in Google Account settings, then re-authorize
3. Verify OAuth scopes in manifest.json match Cloud Console

### Issue: Side panel doesn't open

**Solution**:
1. Ensure you're using Chrome 114 or later (Side Panel API requirement)
2. Update Chrome to the latest version
3. Check `chrome://flags` for any disabled side panel features
4. Try clicking the extension icon in the toolbar

---

## Advanced Configuration

### Restricting to Specific Domain

If you want to only allow users from your organization:

1. In Google Cloud Console → OAuth consent screen
2. Change to "Internal" user type (requires Google Workspace)
3. Only users in your domain can access

### Increasing API Quota

If you hit rate limits:

1. Go to Google Cloud Console → "APIs & Services" → "Quotas"
2. Find "Google Drive API"
3. Request quota increase if needed
4. Default: 1,000 queries per 100 seconds per user (usually sufficient)

### Adding Custom Templates

To add custom templates:

1. Create a folder in your Google Drive called "Templates"
2. Add template files (Docs, Sheets, etc.)
3. Modify `background.js` to fetch from this folder
4. Update `showNewFileDialog()` in sidebar.js to include custom templates

### Shared Drives Support

To enable Shared Drives:

1. Uncomment shared drives code in background.js
2. Add UI section in sidebar.html
3. Call `getSharedDrives()` in loadInitialData()

---

## Security Best Practices

1. **Never commit your OAuth credentials** to public repositories
2. **Use environment-specific config** for development vs production
3. **Rotate credentials** periodically
4. **Monitor API usage** in Google Cloud Console
5. **Keep the extension updated** with latest security patches

---

## Getting Help

If you encounter issues not covered here:

1. Check the browser console for detailed error messages
2. Review Google Drive API documentation
3. Check Chrome Extension documentation for Side Panel API
4. Verify OAuth 2.0 setup is correct

---

## Next Steps

Once installed and working:

1. Pin frequently-used folders
2. Create custom templates for your workflow
3. Set up keyboard shortcuts in Chrome settings
4. Customize the CSS for your preferred look
5. Consider publishing to Chrome Web Store for easier distribution

---

## Uninstalling

To remove the extension:

1. Go to `chrome://extensions/`
2. Find "Google Drive Tree Navigator"
3. Click "Remove"
4. Optionally: Revoke access in [Google Account Permissions](https://myaccount.google.com/permissions)

---

**Congratulations!** You now have a fully functional Google Drive Tree Navigator extension. 🎉
