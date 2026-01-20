# Root Folders Management Implementation - V2

This document describes the implementation of the Root Folders Management feature for the V2 Google Drive folder tree extension.

## Overview

The Root Folders feature allows users to save and switch between multiple Google Drive folder roots, enabling quick access to different project folders or shared drives.

## Files Modified

1. **v2/background.js** - Storage management and API endpoints
2. **v2/content.js** - UI components and functionality
3. **v2/content.css** - Styling for root folders section

## Features Implemented

### 1. Storage Management (background.js)

#### New Functions:
- `getRootFolders()` - Retrieves saved root folders from chrome.storage.local
- `saveRootFolders(rootFolders)` - Saves root folders to storage
- `addRootFolder(rootFolder)` - Adds a new root folder with validation
- `deleteRootFolder(folderId)` - Removes a root folder from the list
- `getCurrentRoot()` - Gets the currently active root folder ID
- `setCurrentRoot(rootId)` - Sets the active root folder
- `getFolderMetadata(folderId)` - Fetches and validates folder metadata from Google Drive API

#### Message Handlers Added:
- `getRootFolders` - Returns list of saved root folders
- `addRootFolder` - Adds a new root folder
- `deleteRootFolder` - Deletes a root folder
- `getCurrentRoot` - Returns current root ID
- `setCurrentRoot` - Updates current root
- `getFolderMetadata` - Validates and fetches folder info

#### Context Menu Integration:
- Added context menu item "Add to Drive Navigator as Root Folder"
- Appears when right-clicking Google Drive folder links
- Automatically extracts folder ID from URL
- Validates folder and adds to root folders list
- Activates extension and shows new root folder

### 2. UI Components (content.js)

#### Updated Global State:
```javascript
state: {
  currentRootId: 'root',  // Currently active root folder
  rootFolders: []         // Array of saved root folders
}
```

#### New UI Elements:
- **Root Folders Section** - Displays at top of sidebar
  - Header with "Root Folders" title and + button
  - Scrollable list of saved root folders
  - Visual indicator for active root folder

#### New Functions:
- `renderRootFolders()` - Renders the list of root folders
- `createRootFolderItem(root)` - Creates a root folder list item
- `handleRootFolderClick(rootId)` - Switches to selected root folder
- `handleRootFolderRightClick(root, event)` - Shows context menu on right-click
- `handleDeleteRoot(rootId)` - Deletes a root folder with confirmation
- `handleAddRootClick()` - Opens modal to add new root
- `showAddRootModal()` - Displays add root folder modal
- `handleConfirmAddRoot()` - Validates and adds new root folder
- `extractFolderId(input)` - Extracts folder ID from URL or validates ID

#### Updated Functions:
- `loadInitialData()` - Now loads root folders and current root
- `renderTree()` - Uses current root ID instead of hardcoded 'root'
- `showMainContent()` - Shows main content container (includes root folders)
- `handleMessage()` - Added handler for `activateAndShowRoot` action

### 3. Styling (content.css)

#### New CSS Classes:
- `.gdn-root-folders-section` - Container for root folders
- `.gdn-root-folders-header` - Header with title and add button
- `.gdn-root-folders-title` - Styled title text
- `.gdn-root-add-btn` - Add button styling with hover effects
- `.gdn-root-folders-list` - Scrollable list container
- `.gdn-root-folder-item` - Individual root folder item
- `.gdn-root-folder-item.active` - Active root folder highlighting
- `.gdn-root-folder-icon` - Folder icon styling
- `.gdn-root-folder-name` - Folder name text with ellipsis
- `.gdn-context-menu` - Right-click context menu
- `.gdn-context-menu-item` - Context menu items
- `.gdn-modal-section` - Modal form sections
- `.gdn-label` - Form labels
- `.gdn-input` - Form input fields
- `.gdn-help-text` - Helper text styling

## User Flow

### Adding a Root Folder (Method 1 - Context Menu):
1. Right-click on any Google Drive folder link
2. Select "Add to Drive Navigator as Root Folder"
3. Extension validates folder and adds to list
4. Extension activates and shows new root folder

### Adding a Root Folder (Method 2 - Manual):
1. Click the + button in Root Folders section
2. Paste Google Drive folder URL or folder ID
3. Click "Add Folder"
4. Extension validates and adds folder to list

### Switching Root Folders:
1. Click on any root folder in the list
2. Extension loads that folder's contents
3. Active root is highlighted
4. Tree view updates to show selected root

### Deleting a Root Folder:
1. Right-click on a root folder
2. Select "Delete Root Folder"
3. Confirm deletion (if it's the current root)
4. Folder is removed from list

## Data Structure

### Root Folder Object:
```javascript
{
  id: string,      // Google Drive folder ID
  name: string,    // Folder name
  url: string      // Google Drive URL
}
```

### Storage Keys:
- `rootFolders` - Array of root folder objects
- `currentRootId` - ID of currently active root folder

### Default Root:
```javascript
{
  id: 'root',
  name: 'My Drive',
  url: 'https://drive.google.com/drive/my-drive'
}
```

## URL Pattern Support

The extension can extract folder IDs from these URL formats:
- `https://drive.google.com/drive/folders/FOLDER_ID`
- `https://drive.google.com/drive/u/0/folders/FOLDER_ID`
- `https://drive.google.com/drive/u/1/folders/FOLDER_ID`
- Direct folder ID input (e.g., `1a2b3c4d5e6f7g8h9i0j`)

## Validation

- Folder IDs are validated against Google Drive API
- Only folders (not files) can be added as roots
- Duplicate folders cannot be added
- At least one root folder must always exist
- Current root folder deletion requires confirmation

## Error Handling

- Network errors when fetching folder metadata
- Invalid folder IDs or URLs
- Attempting to add duplicate folders
- Attempting to delete the last root folder
- Authentication failures

## Visual Feedback

- Toast notifications for success/error states
- Loading spinners during async operations
- Active root folder highlighting
- Hover effects on interactive elements
- Modal dialogs for confirmations

## Persistence

All root folders and current root selection persist across:
- Browser restarts
- Extension updates
- Tab refreshes
- Extension enable/disable cycles
