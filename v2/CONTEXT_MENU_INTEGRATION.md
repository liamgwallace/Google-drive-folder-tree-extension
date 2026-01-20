# Context Menu Implementation Guide

This guide explains how to integrate the right-click context menu functionality into the V2 Google Drive Navigator extension.

## Files Modified

### 1. `/v2/background.js` ✅ COMPLETE
- Added `createFolder()` function
- Added `createFolder` case to message handler
- All API endpoints are ready

### 2. `/v2/content.css` ✅ COMPLETE
- Added complete context menu styling
- Added modal form elements styling
- Added folder picker styling
- Responsive adjustments included

### 3. `/v2/content.js` ⚠️ NEEDS INTEGRATION

The context menu code is provided in `/v2/context-menu-additions.js`. You need to integrate it into `content.js`.

## Integration Steps for content.js

### Step 1: Update GDN.state object

Find the `GDN` object at the top of content.js and add `contextMenuTarget` to the state:

```javascript
const GDN = {
  isActive: false,
  isAuthenticated: false,
  sidebarExpanded: false,
  searchOpen: false,
  elements: {},
  state: {
    expandedFolders: new Set(['root']),
    selectedFiles: new Set(),
    folderCache: new Map(),
    currentContextItem: null,
    contextMenuTarget: null,  // ADD THIS LINE
    recentFiles: []
  }
};
```

### Step 2: Add createContextMenu() function

After the `createToastContainer()` function, add the `createContextMenu()` function from context-menu-additions.js (lines 8-95).

### Step 3: Update injectUI() function

In the `injectUI()` function, add `${createContextMenu()}` to the root.innerHTML template string:

```javascript
root.innerHTML = `
  ${createIconBar()}
  ${createSidebar()}
  ${createSearchOverlay()}
  ${createModalOverlay()}
  ${createToastContainer()}
  ${createContextMenu()}  // ADD THIS LINE
`;
```

### Step 4: Update cacheElements() function

Add the context menu reference in the `cacheElements()` function:

```javascript
GDN.elements = {
  root: document.getElementById('gdn-root'),
  iconbar: document.getElementById('gdn-iconbar'),
  sidebar: document.getElementById('gdn-sidebar'),
  searchOverlay: document.getElementById('gdn-search-overlay'),
  modalOverlay: document.getElementById('gdn-modal-overlay'),
  toastContainer: document.getElementById('gdn-toast-container'),
  contextMenu: document.getElementById('gdn-context-menu'),  // ADD THIS LINE
  // ... rest of the elements
};
```

### Step 5: Update attachEventListeners() function

Add these event listeners at the end of the `attachEventListeners()` function:

```javascript
// Context menu - close on outside click
document.addEventListener('click', (e) => {
  if (GDN.elements.contextMenu && !GDN.elements.contextMenu.contains(e.target)) {
    hideContextMenu();
  }
});

// Context menu items
GDN.elements.contextMenu?.addEventListener('click', handleContextMenuClick);
```

### Step 6: Update createTreeItem() function

In the `createTreeItem()` function, add these dataset attributes after `div.dataset.fileId = file.id`:

```javascript
div.dataset.fileId = file.id;
div.dataset.fileName = file.name;          // ADD THIS
div.dataset.fileMimeType = file.mimeType;  // ADD THIS
div.dataset.fileLink = file.webViewLink;   // ADD THIS
div.dataset.fileParents = JSON.stringify(file.parents || []); // ADD THIS
```

Also add the context menu event listener at the end of the function, before `return div`:

```javascript
// Context menu handler
div.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  e.stopPropagation();
  showContextMenu(e, file, isDir);
});
```

### Step 7: Add all context menu functions

At the end of content.js, add all the functions from context-menu-additions.js starting from line 97 to the end:

- `showContextMenu()`
- `hideContextMenu()`
- `handleContextMenuClick()`
- `createFileInFolder()`
- `showCreateFolderModal()`
- `showRenameModal()`
- `showDeleteConfirmation()`
- `showMoveModal()`
- `loadFolderPicker()`
- `renderFolderPicker()`
- `showModal()`
- `refreshTree()`

## Features Implemented

### Context Menu for Folders
- ✅ Open in Main Tab
- ✅ Open in New Tab
- ✅ Create New (with submenu):
  - Document (Google Docs)
  - Spreadsheet (Google Sheets)
  - Presentation (Google Slides)
  - Form (Google Forms)
  - Folder
- ✅ Create New Folder (direct)
- ✅ Move to...
- ✅ Delete

### Context Menu for Files
- ✅ Open in Main Tab
- ✅ Open in New Tab
- ✅ Rename
- ✅ Move to...
- ✅ Delete

### Modal Dialogs
- ✅ Create file/folder with name input
- ✅ Delete confirmation
- ✅ Rename with name input
- ✅ Move with folder picker

### API Integration
- ✅ createFile(name, mimeType, parentId)
- ✅ createFolder(name, parentId)
- ✅ deleteFile(fileId)
- ✅ moveFile(fileId, newParentId, oldParentId)
- ✅ renameFile(fileId, newName)

## File Type MIME Types

The implementation uses the correct Google Drive MIME types:

- **Google Docs**: `application/vnd.google-apps.document`
- **Google Sheets**: `application/vnd.google-apps.spreadsheet`
- **Google Slides**: `application/vnd.google-apps.presentation`
- **Google Forms**: `application/vnd.google-apps.form`
- **Folder**: `application/vnd.google-apps.folder`

## Testing Checklist

After integration, test the following:

### Folder Context Menu
- [ ] Right-click on folder shows context menu
- [ ] Open in Main Tab works
- [ ] Open in New Tab works
- [ ] Create New submenu appears on hover
- [ ] Create Document creates a new Google Doc
- [ ] Create Spreadsheet creates a new Google Sheet
- [ ] Create Presentation creates a new Google Slides
- [ ] Create Form creates a new Google Form
- [ ] Create Folder from submenu works
- [ ] Create New Folder (direct) works
- [ ] Move to folder picker shows folders
- [ ] Move operation works correctly
- [ ] Delete shows confirmation
- [ ] Delete moves to trash
- [ ] Tree refreshes after operations

### File Context Menu
- [ ] Right-click on file shows context menu
- [ ] Open in Main Tab works
- [ ] Open in New Tab works
- [ ] Rename shows input with current name
- [ ] Rename updates file name
- [ ] Move to folder picker shows folders
- [ ] Move operation works correctly
- [ ] Delete shows confirmation
- [ ] Delete moves to trash
- [ ] Tree refreshes after operations

### UI/UX
- [ ] Context menu positions correctly
- [ ] Context menu doesn't go off-screen
- [ ] Context menu closes on outside click
- [ ] Context menu closes after action
- [ ] Submenu shows on hover
- [ ] Modal shows centered
- [ ] Modal closes on cancel
- [ ] Modal closes on outside click
- [ ] Toast notifications show for operations
- [ ] Input fields are focused and selected
- [ ] Error handling shows appropriate messages

## Troubleshooting

### Context menu doesn't appear
- Check that `createContextMenu()` is called in `injectUI()`
- Check that context menu element is cached in `cacheElements()`
- Check that contextmenu event listener is added in `createTreeItem()`

### Operations fail
- Check browser console for API errors
- Verify authentication is working
- Check that background.js message handlers are set up

### Tree doesn't refresh
- Ensure `refreshTree()` function calls the appropriate load function
- Check that cache is being cleared
- Verify `clearCache` action works in background.js

## Notes

- The context menu uses maximum z-index (2147483647) to stay on top
- Folder picker only shows folders, not files
- Delete operation moves files to trash, not permanent deletion
- All operations show toast notifications for feedback
- Input dialogs auto-focus and select text for easy editing
