# Quick Test Guide - Context Menu Feature

## Prerequisites

1. Extension loaded in Chrome (Developer Mode)
2. OAuth credentials configured in manifest.json
3. Google account with Drive access

## Quick Test Steps

### Test 1: Basic Functionality

1. **Open Google Drive** in your browser
   ```
   https://drive.google.com/drive/my-drive
   ```

2. **Navigate to a folder** (or create one for testing)

3. **Right-click on any folder link** in the Drive interface
   - Look for the context menu item: "Add to Drive Navigator as Root Folder"

4. **Click the context menu item**
   - If not signed in: Sign-in prompt should appear
   - If signed in: Should proceed immediately

5. **Verify Success**
   - Toast notification appears: "Added {folder name} to root folders"
   - Extension activates (icon bar appears if it wasn't visible)
   - Sidebar opens automatically
   - Tree refreshes to show contents

### Test 2: Duplicate Prevention

1. **Right-click the same folder link again**

2. **Click the context menu item**

3. **Verify Error**
   - Error notification: "This folder is already in your root folders list"
   - No duplicate added

### Test 3: External Link

1. **Create a test HTML page** with a Drive folder link:
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <h1>Test Page</h1>
     <a href="https://drive.google.com/drive/folders/YOUR_FOLDER_ID">My Project Folder</a>
   </body>
   </html>
   ```

2. **Open the HTML file** in Chrome

3. **Right-click the link**
   - Context menu item should appear

4. **Click the context menu item**
   - Should work the same as in Drive interface

### Test 4: Invalid Link

1. **Create a link to a file** (not a folder):
   ```html
   <a href="https://drive.google.com/file/d/FILE_ID/view">Document</a>
   ```

2. **Right-click and select the context menu item**

3. **Verify Error**
   - Error notification: "The provided ID is not a folder"
   - No folder added

### Test 5: Non-Drive Link

1. **Right-click on any non-Drive link** (e.g., Google.com)

2. **Verify**
   - Context menu item should NOT appear
   - Only appears on Drive folder links

### Test 6: Persistence

1. **Add a folder using the context menu**

2. **Close and reopen the browser**

3. **Activate the extension on any page**

4. **Verify**
   - Previously added root folders still appear
   - Data persists in chrome.storage.local

## Console Verification

### Background Script Console

Open: `chrome://extensions` → Extension Details → Service Worker → Console

**Expected Logs:**
```
[GDN] Background service worker initialized
[GDN] Context menu created
[GDN] Adding folder from context menu: https://...
[GDN] Folder added successfully: {folder name}
```

### Page Console

Open: Page → F12 → Console

**Expected Logs:**
```
[GDN] Content script loaded
[GDN] Initialized { isActive: false }
[GDN] Drive Navigator activated
```

## Storage Inspection

### Check Stored Data

1. **Open Extension Storage**
   ```
   chrome://extensions → Extension Details → Storage
   ```

2. **Or use Console**
   ```javascript
   chrome.storage.local.get(['rootFolders'], console.log)
   ```

3. **Expected Format**
   ```javascript
   {
     rootFolders: [
       {
         id: "root",
         name: "My Drive",
         url: "https://drive.google.com/drive/my-drive"
       },
       {
         id: "abc123xyz",
         name: "Test Folder",
         url: "https://drive.google.com/drive/folders/abc123xyz"
       }
     ]
   }
   ```

## Troubleshooting

### Context Menu Doesn't Appear

**Check:**
- Is the link a proper `<a>` tag?
- Does the href match the Drive folder pattern?
- Is the extension loaded and enabled?

**Fix:**
- Reload extension
- Verify manifest.json has contextMenus permission
- Check background script console for errors

### "Please sign in" Error

**Check:**
- Is OAuth configured in manifest.json?
- Are you signed into a Google account?

**Fix:**
- Click extension icon
- Use "Sign In with Google" button
- Verify client_id in manifest.json

### Extension Doesn't Activate

**Check:**
- Is content script injected?
- Are there any console errors?

**Fix:**
- Refresh the page
- Check content script loads: `document.getElementById('gdn-root')`

### Folder Not Added

**Check:**
- Do you have access to the folder?
- Is the folder ID valid?
- Check background console for API errors

**Fix:**
- Verify folder exists in your Drive
- Check OAuth scopes include Drive access
- Test with a different folder

## Quick Debug Commands

### Content Script
```javascript
// Check if extension is injected
document.getElementById('gdn-root')

// Check extension state
console.log(GDN)

// Manually show notification
chrome.runtime.sendMessage({
  action: 'showNotification',
  message: 'Test notification',
  type: 'success'
})
```

### Background Script
```javascript
// Check root folders
chrome.storage.local.get(['rootFolders'], console.log)

// Add folder manually
chrome.storage.local.set({
  rootFolders: [
    { id: 'root', name: 'My Drive', url: 'https://drive.google.com/drive/my-drive' }
  ]
})

// Clear root folders
chrome.storage.local.remove('rootFolders')
```

## Success Criteria

✅ Context menu appears on Drive folder links
✅ Context menu does NOT appear on non-Drive links
✅ Clicking menu item adds folder to storage
✅ Success notification appears
✅ Extension activates automatically
✅ Sidebar opens automatically
✅ Duplicate folders show error
✅ Invalid links show error
✅ Folders persist after reload
✅ Authentication required and working

## Test Results Template

```
Date: ___________
Tester: ___________

Test 1 - Basic Functionality:       [ ] Pass  [ ] Fail
Test 2 - Duplicate Prevention:      [ ] Pass  [ ] Fail
Test 3 - External Link:             [ ] Pass  [ ] Fail
Test 4 - Invalid Link:              [ ] Pass  [ ] Fail
Test 5 - Non-Drive Link:            [ ] Pass  [ ] Fail
Test 6 - Persistence:               [ ] Pass  [ ] Fail

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
```

---

**Last Updated**: 2026-01-20
**Version**: V2
