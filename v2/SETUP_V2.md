# Setup Guide

## Prerequisites

- Chrome 114+
- Google Account

## Step 1: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the **Google Drive API** (APIs & Services → Library)
4. Configure OAuth consent screen:
   - Select "External"
   - Add app name and your email
   - Add scope: `https://www.googleapis.com/auth/drive`
   - Add yourself as a test user
5. Create OAuth credentials:
   - Go to Credentials → Create Credentials → OAuth client ID
   - Type: Chrome extension
   - Copy the **Client ID**

## Step 2: Load Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select the `v2` folder
4. Copy the **Extension ID** shown under the extension name

## Step 3: Configure Redirect URI

1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add redirect URI: `https://YOUR_EXTENSION_ID.chromiumapp.org/`
4. Save

## Step 4: Add Client ID

1. Open `v2/manifest.json`
2. Replace the `client_id` value with your Client ID
3. Reload the extension in `chrome://extensions/`

## Usage

1. Navigate to any webpage
2. Click the extension icon or toggle button
3. Sign in with Google
4. Browse your Drive folders

## Troubleshooting

**Extension doesn't appear**: Refresh the page or reload the extension

**Sign in fails**: Verify Client ID and redirect URI are correct

**Files don't load**: Check that Drive API is enabled and you're signed in

## Customization

Edit `v2/content.css` to change:
- `--gdn-sidebar-width`: Sidebar width (default 280px)
- `--gdn-iconbar-width`: Icon bar width (default 60px)
- `--gdn-primary-color`: Primary color (default #4285f4)
