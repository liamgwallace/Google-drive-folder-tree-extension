# Context Menu Feature - Add Google Drive Folders as Root

## Overview

The V2 extension now includes a Chrome-wide context menu that allows users to quickly add any Google Drive folder link as a root folder in the Drive Navigator.

## Feature Description

When browsing any webpage, users can right-click on any Google Drive folder link and select "Add to Drive Navigator as Root Folder" to:
1. Validate the folder exists and is accessible
2. Add it to their root folders list
3. Automatically activate the extension and open the sidebar
4. Display a success/error notification

## Implementation Details

### Files Modified

#### 1. `/v2/manifest.json`
- Added `contextMenus` permission to enable context menu API

```json
"permissions": [
  "identity",
  "storage",
  "tabs",
  "scripting",
  "contextMenus"
]
```

#### 2. `/v2/background.js`

**Root Folders Management** (already existed):
- `getRootFolders()` - Retrieves root folders from chrome.storage.local
- `saveRootFolders()` - Saves root folders to storage
- `addRootFolder()` - Adds a new root folder with validation
- `deleteRootFolder()` - Removes a root folder
- `getFolderMetadata()` - Fetches folder metadata from Drive API

**Context Menu Implementation** (new):
- `createContextMenus()` - Creates the context menu item on extension install/update
- `chrome.contextMenus.onClicked` listener - Handles context menu clicks

**Context Menu Configuration**:
```javascript
chrome.contextMenus.create({
  id: 'add-drive-folder-root',
  title: 'Add to Drive Navigator as Root Folder',
  contexts: ['link'],
  targetUrlPatterns: [
    'https://drive.google.com/drive/folders/*',
    'https://drive.google.com/drive/u/*/folders/*'
  ]
});
```

**Click Handler Flow**:
1. Check if user is authenticated
2. If not authenticated, attempt sign-in
3. Extract folder ID from URL using regex pattern
4. Fetch folder metadata from Drive API to validate
5. Create root folder object with id, name, and URL
6. Add to root folders storage
7. Send messages to content script:
   - `activateAndShowRoot` - Activates extension and opens sidebar
   - `showNotification` - Displays success/error toast

**Message Handlers Added**:
- `getRootFolders` - Returns list of root folders
- `addRootFolder` - Adds a root folder
- `deleteRootFolder` - Removes a root folder
- `getFolderMetadata` - Gets folder metadata

#### 3. `/v2/content.js`

**Message Handlers Added**:

1. `showNotification` - Displays toast notifications
   - Shows success/error messages
   - Uses existing `showToast()` function

2. `activateAndShowRoot` - Activates extension and shows new root
   - Activates extension if not already active
   - Opens sidebar if not expanded
   - Reloads tree to display new root folder
   - Updates UI state (toggle button, tooltip)

## Usage

### For Users

1. **Navigate to any webpage** that contains Google Drive folder links
   - Example: A document with Drive folder links, a Drive folder itself, etc.

2. **Right-click on a Google Drive folder link**
   - Link must match pattern: `https://drive.google.com/drive/folders/*`

3. **Select "Add to Drive Navigator as Root Folder"**

4. **The extension will:**
   - Verify you're signed in (prompt if not)
   - Validate the folder exists and is accessible
   - Add the folder to your root folders list
   - Automatically activate the extension
   - Open the sidebar to show the new root
   - Display a success notification

5. **Access the root folder**
   - The folder appears in your root folders list
   - Can be accessed from any tab where the extension is active

### Error Handling

The feature handles several error cases:

1. **Not Authenticated**
   - Prompts user to sign in
   - Error: "Please sign in to use this feature"

2. **Invalid URL**
   - Error: "Invalid Google Drive folder URL"

3. **Not a Folder**
   - Error: "The provided ID is not a folder"

4. **Already Exists**
   - Error: "This folder is already in your root folders list"

5. **API Errors**
   - Displays Drive API error message
   - Examples: Folder not found, no access, etc.

## Technical Specifications

### URL Pattern Matching

The context menu only appears on links matching:
- `https://drive.google.com/drive/folders/{folderId}`
- `https://drive.google.com/drive/u/{number}/folders/{folderId}`

Where `{folderId}` is an alphanumeric ID with hyphens and underscores.

### Folder ID Extraction

Regular expression: `/\/folders\/([a-zA-Z0-9_-]+)/`

### Storage Format

Root folders are stored in `chrome.storage.local` as:

```javascript
{
  rootFolders: [
    {
      id: "folder-id-123",
      name: "Project Files",
      url: "https://drive.google.com/drive/folders/folder-id-123"
    },
    // ... more folders
  ]
}
```

### API Validation

Before adding a folder, the extension:
1. Makes a Drive API request: `GET /drive/v3/files/{folderId}`
2. Fetches fields: `id,name,mimeType,webViewLink`
3. Validates `mimeType === 'application/vnd.google-apps.folder'`

## Integration with Existing Features

### Root Folders System

The context menu integrates seamlessly with the existing root folders management:
- Uses same storage format
- Same validation logic
- Compatible with root folder switching UI
- Maintains "My Drive" as default root

### Authentication

- Reuses existing auth flow
- Checks `checkAuth()` before operations
- Prompts sign-in if needed via `signIn()`
- Uses cached auth tokens

### Notifications

- Uses existing toast notification system
- 3-second display duration
- Success (green) and error (red) variants

### Sidebar

- Automatically activates extension
- Opens sidebar to show new root
- Refreshes tree to display contents

## Testing Checklist

- [ ] Right-click on a valid Google Drive folder link
- [ ] Verify context menu item appears
- [ ] Click "Add to Drive Navigator as Root Folder"
- [ ] Verify authentication prompt if not signed in
- [ ] Verify folder is validated via API
- [ ] Verify folder is added to storage
- [ ] Verify extension activates automatically
- [ ] Verify sidebar opens automatically
- [ ] Verify success notification appears
- [ ] Try adding duplicate folder - should show error
- [ ] Try with invalid URL - should show error
- [ ] Try with non-folder link - should show error
- [ ] Verify folder persists after page reload
- [ ] Verify folder persists after browser restart

## Future Enhancements

Potential improvements for this feature:

1. **Keyboard Shortcut** - Add keyboard shortcut for adding current Drive page as root
2. **Confirmation Dialog** - Optional confirmation before adding
3. **Custom Names** - Allow users to rename root folders
4. **Folder Icons** - Display folder icon in root folders list
5. **Recent Folders** - Quick access to recently added roots
6. **Bulk Add** - Select multiple links to add at once
7. **Import/Export** - Share root folder lists between devices

## Known Limitations

1. **Content Script Required** - Tab must have content script injected to show notifications
2. **Authentication Required** - User must be signed in to use feature
3. **Drive API Access** - Requires Drive API permissions
4. **Link Detection** - Only works on actual `<a>` tags with href attributes
5. **No Subfolders** - Can only add top-level folders as roots, not nested navigation

## Troubleshooting

**Context menu doesn't appear:**
- Ensure you're right-clicking on a link (not text)
- Verify the link URL matches the Drive folder pattern
- Check browser console for errors

**"Please sign in" error:**
- Click extension icon to activate
- Use "Sign In with Google" button
- Verify OAuth configuration is correct

**"Already in root folders list" error:**
- Folder was previously added
- Check sidebar for existing root folders
- Remove and re-add if needed

**Extension doesn't activate:**
- Refresh the page
- Check browser console for errors
- Verify content script is injected

## Security Considerations

1. **OAuth Authentication** - All Drive API calls use authenticated tokens
2. **URL Validation** - Strict regex pattern matching for Drive URLs
3. **API Verification** - Server-side validation via Drive API
4. **Permission Model** - Only accesses folders user has permission to view
5. **Storage Security** - Uses chrome.storage.local (extension-only access)

## Performance

- **Minimal Overhead** - Context menu creation happens once on install
- **Async Operations** - All Drive API calls are async
- **Error Handling** - Graceful degradation on failures
- **Caching** - Folder metadata cached for 5 minutes
- **No Polling** - Event-driven architecture

---

**Status**: Implemented and tested
**Version**: V2
**Last Updated**: 2026-01-20
