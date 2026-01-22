# Google Drive Navigator V2 - Setup Guide

## Quick Overview

Version 2 integrates into **any webpage** via content script injection. The extension:
- **OFF by default** (non-intrusive)
- Shows small icon bar when activated
- Expands to full sidebar that pushes content
- Works on all websites, not just Google Drive

## Prerequisites

- Chrome 114+
- Google account
- Google Cloud Project (for OAuth)
- 20-30 minutes for setup

---

## Step-by-Step Setup

### 1. Google Cloud Console Configuration (15 minutes)

#### Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "Drive Navigator V2"
3. Wait for project creation

#### Enable Drive API
1. Navigate to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click and enable it

#### Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Fill in:
   - App name: `Google Drive Navigator V2`
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"

5. **Data Access** page:
   - Click "Add or Remove Scopes"
   - Add: `https://www.googleapis.com/auth/drive`
   - Click "Update" → "Save and Continue"

6. **Test users** page:
   - Click "Add Users"
   - Add your Gmail address
   - Click "Save and Continue"

7. Review and click "Back to Dashboard"

#### Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Chrome extension** (or Web application if not available)
4. Name: `Drive Navigator V2`
5. **Important**: Leave redirect URI blank for now (we'll add it in step 3)
6. Click "Create"
7. **Copy the Client ID** - you'll need this!

### 2. Load Extension in Chrome (2 minutes)

1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the **v2 folder** (not the parent directory!)
6. **IMPORTANT**: Copy the **Extension ID**
   - It's shown under the extension name
   - Looks like: `abcdefghijklmnopqrstuvwxyz`

### 3. Update OAuth Redirect URI (2 minutes)

1. Go back to Google Cloud Console → Credentials
2. Click your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", click "ADD URI"
4. Enter:
   ```
   https://YOUR_EXTENSION_ID.chromiumapp.org/
   ```
   Replace `YOUR_EXTENSION_ID` with the ID you copied
5. Click "Save"

### 4. Configure Extension (1 minute)

1. Open `v2/manifest.json` in a text editor
2. Find line with `"client_id":`
3. Replace `"YOUR_CLIENT_ID.apps.googleusercontent.com"` with your actual Client ID
4. Save the file
5. Go back to `chrome://extensions/`
6. Click the reload icon ↻ on the extension

### 5. Create Icons (Optional but Recommended)

The extension works without PNG icons but looks better with them.

**Quick method** (Online converter):
1. Go to [CloudConvert](https://cloudconvert.com/svg-to-png)
2. Upload `v2/icons/icon.svg`
3. Convert to 3 sizes:
   - 16x16 → save as `v2/icons/icon16.png`
   - 48x48 → save as `v2/icons/icon48.png`
   - 128x128 → save as `v2/icons/icon128.png`
4. Reload extension in Chrome

**Skip for now**: Extension works without icons, Chrome shows default

---

## First Use

### Activating the Extension

1. **Navigate to any website** (Google, Wikipedia, GitHub, anything!)
2. You should see a thin vertical bar on the left edge (60px wide)
3. **Click the toggle button** at the bottom of the icon bar (looks like a switch)
4. The extension activates!

### Sign In

1. **Click the folder icon** (top icon in the bar)
2. Sidebar expands showing "Sign in" screen
3. **Click "Sign In with Google"**
4. Select your Google account
5. Review and accept permissions
6. Sidebar shows your Drive folders!

### Using the Features

**Navigate Folders**:
- Click any folder to expand it
- Click again to collapse
- Click files to open them
- Ctrl/Cmd+Click to open in new tab

**Search Drive**:
- Click search icon (magnifying glass)
- Type your query
- Results appear as you type
- Click result to open file
- Press Enter for full Drive search

**Page Content**:
- When sidebar is collapsed: Page content unaffected
- When sidebar is expanded: Content shifts right (300px)
- This is intentional - prevents content occlusion

**Turn OFF**:
- Click toggle button again
- Extension disappears completely
- Page content returns to normal

---

## Per-Tab Behavior

### Default State
- Extension is **OFF** on all new tabs by default
- Minimal, non-intrusive design

### Activating Per Tab
- Each tab can independently turn extension ON or OFF
- State persists while tab is open
- Closing tab resets to OFF

### Child Tab Inheritance

**When you Ctrl+Click a link**:
- New tab inherits parent's ON/OFF state
- Example: If extension is ON in Tab A, Ctrl+clicking a link creates Tab B with extension ON

**When you type a new URL**:
- Extension starts OFF (default state)
- You can manually toggle it ON

**Example Workflow**:
1. Open Google Drive tab
2. Turn extension ON
3. Navigate your folders
4. Ctrl+Click a Google Doc link
5. Doc opens in new tab with extension still ON
6. You can quickly reference Drive while editing
7. Toggle OFF in the doc tab if you want more space

---

## Troubleshooting

### Icon bar doesn't appear

**Check #1**: Extension loaded?
- Go to `chrome://extensions/`
- Verify "Drive Navigator V2" is enabled

**Check #2**: Refresh the page
- Press F5 or Ctrl+R
- Icon bar should appear

**Check #3**: Check console
- Press F12 → Console tab
- Look for `[GDN]` messages
- Any errors indicate issues

### Toggle button doesn't activate

**Check #1**: OAuth configured?
- Verify Client ID in manifest.json is correct
- Verify redirect URI includes your extension ID
- Format: `https://EXTENSION_ID.chromiumapp.org/`

**Check #2**: Try clicking extension icon in toolbar
- Should toggle extension
- Same as clicking toggle button in icon bar

### Sign in button doesn't work

**Check #1**: Popup blocker?
- Chrome may block OAuth popup
- Click the "blocked popup" icon in address bar
- Allow popups for this extension

**Check #2**: OAuth consent screen configured?
- Verify you added yourself as test user
- Verify all scopes are added
- Try removing and re-adding your email as test user

### Sidebar doesn't expand

**Check #1**: Already expanded?
- Check if sidebar is already visible
- Try clicking close button (X) first

**Check #2**: CSS conflict?
- Some websites may have CSS that conflicts
- Press F12 → Elements tab
- Look for element with id `gdn-sidebar`
- Check if it has class `gdn-expanded`

### Content pushed off screen

**This is expected behavior!**
- When sidebar expands (280px), it pushes content right
- This prevents sidebar from covering content
- If content is off-screen, scroll horizontally
- Or collapse sidebar to restore layout

### Files don't load

**Check #1**: Signed in?
- Look for "Sign In" screen in sidebar
- Sign in again if needed

**Check #2**: API enabled?
- Go to Google Cloud Console
- Verify Drive API is enabled
- Check quotas (should be 1000 requests/100 seconds)

**Check #3**: Network errors?
- Press F12 → Network tab
- Look for failed requests to `googleapis.com`
- Red requests indicate auth or API issues

### Child tabs don't inherit state

**Check #1**: Using Ctrl+Click?
- Middle-click or right-click → "Open in new tab" also works
- Regular click in same tab won't create child relationship

**Check #2**: Check console
- Should see `[GDN] Tab X created from parent Y`
- If not, tab relationship wasn't detected

**Check #3**: Permissions granted?
- Extension needs `tabs` permission
- Check `chrome://extensions/` → Extension details
- Verify all permissions granted

### Search doesn't show results

**Check #1**: Authenticated?
- Sign in if not already

**Check #2**: Type at least 2 characters
- Search triggers after 2+ characters
- Debounced by 300ms

**Check #3**: Check Drive permissions
- Extension needs Drive access
- Reauthorize if needed

---

## Advanced Configuration

### Change Sidebar Width

Edit `v2/content.css`:
```css
:root {
  --gdn-sidebar-width: 280px; /* Change this */
}
```

### Change Icon Bar Width

Edit `v2/content.css`:
```css
:root {
  --gdn-iconbar-width: 60px; /* Change this */
}
```

### Change Colors

Edit `v2/content.css`:
```css
:root {
  --gdn-primary-color: #4285f4; /* Google Blue */
  --gdn-danger-color: #ea4335;   /* Red */
  /* etc. */
}
```

### Disable on Specific Sites

Add to `v2/manifest.json`:
```json
"content_scripts": [{
  "matches": ["<all_urls>"],
  "exclude_matches": ["https://example.com/*"]
}]
```

### Default to ON (Not Recommended)

Edit `v2/background.js`, line ~24:
```javascript
const defaultState = {
  isActive: true, // Change from false to true
  sidebarExpanded: false
};
```

---

## Performance & Compatibility

### Performance Impact

- **Content script size**: ~150KB (CSS + JS)
- **Memory usage**: ~5-10MB when active
- **API calls**: Only when extension is ON
- **Page load impact**: Minimal (~10-50ms)

### Compatible Websites

**Works great on**:
- Most websites (Google, Wikipedia, GitHub, news sites)
- Static pages
- Dynamic SPAs (React, Vue, Angular)

**May have issues with**:
- Websites with very aggressive CSS resets
- Websites that override `body` styles heavily
- Websites with their own maximum z-index layers
- Websites that disable content scripts (rare)

**Workarounds**:
- Toggle OFF if extension interferes
- Report issues for specific sites
- Some sites may need CSS adjustments

### Browser Compatibility

- **Chrome 114+**: Full support
- **Edge (Chromium)**: Should work (untested)
- **Brave**: Should work (untested)
- **Other Chromium browsers**: May work

---

## Security & Privacy

### Data Collection

- **No tracking**: Extension doesn't track your usage
- **No analytics**: No data sent to third parties
- **Local only**: All data stays in your browser

### OAuth Scopes

- `drive`: Full Drive access (required for all features)
- Future: May be reduced to narrower scopes

### Permissions Explained

- `identity`: Google OAuth authentication
- `storage`: Store per-tab state (ephemeral)
- `tabs`: Track parent-child tab relationships
- `scripting`: Inject UI into webpages
- `<all_urls>`: Allow injection on any site

### Token Storage

- Tokens stored by Chrome (encrypted)
- Tokens auto-refresh when expired
- Tokens cleared on sign out

---

## Uninstalling

### Remove Extension

1. Go to `chrome://extensions/`
2. Find "Google Drive Navigator V2"
3. Click "Remove"
4. Confirm removal

### Revoke Access

1. Go to [Google Account Permissions](https://myaccount.google.com/permissions)
2. Find "Google Drive Navigator V2"
3. Click "Remove Access"

### Clean Up Google Cloud Project (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project
3. Click "Delete Project" in settings
4. Confirm deletion

---

## Comparison with V1

| Feature | V1 (Side Panel) | V2 (Content Script) |
|---------|----------------|---------------------|
| Integration | Side panel (separate) | Injected into pages |
| Visibility | Always visible | Toggleable per-tab |
| Default State | Always ON | OFF (non-intrusive) |
| Page Impact | None | Pushes content when expanded |
| Works On | All sites (separate panel) | All sites (in-page) |
| Setup | Easier | Slightly more complex |
| Performance | Better (isolated) | Good (injected) |
| User Control | Less (always on) | More (per-tab toggle) |

**When to use V1**: Want extension always available, don't want page layout affected

**When to use V2**: Want per-tab control, more integrated experience, child tab inheritance

---

## Getting Help

### Resources

- README_V2.md - Architecture and technical details
- QUICKSTART_V2.md - Fast setup guide
- Chrome Extension Docs - [developer.chrome.com/docs/extensions](https://developer.chrome.com/docs/extensions)
- Google Drive API Docs - [developers.google.com/drive](https://developers.google.com/drive)

### Debugging

**Enable verbose logging**:
1. Press F12 → Console
2. Look for `[GDN]` prefixed messages
3. Share these when reporting issues

**Check background script**:
1. Go to `chrome://extensions/`
2. Click "service worker" link under extension
3. Console opens with background script logs

**Reset state**:
1. Click toggle OFF
2. Reload extension
3. Reload webpage
4. Click toggle ON

---

## Next Steps

1. ✅ Extension configured and loaded
2. ✅ Signed in successfully
3. ✅ Folders loading correctly
4. 🎯 **Try it on different websites!**
5. 🎯 **Test child tab inheritance**
6. 🎯 **Explore search functionality**
7. 🎯 **Customize colors/widths to your preference**

**Congratulations!** You now have Google Drive navigation on any webpage. 🎉

---

**Version**: 2.0.0
**Last Updated**: 2024
**License**: MIT
