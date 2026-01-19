# Google Drive Tree Navigator - Version 2

## Overview

Version 2 is a complete architectural redesign that integrates Google Drive navigation into **any webpage** via content script injection.

## Key Differences from V1

| Feature | V1 (Side Panel) | V2 (Content Script) |
|---------|----------------|---------------------|
| **Integration** | Chrome Side Panel API | Content script injection into all pages |
| **Visibility** | Always visible in side panel | Toggleable per-tab, OFF by default |
| **UI Structure** | Full sidebar only | Icon bar (60px) + expandable sidebar (280px) |
| **Search** | Inline in sidebar | Separate overlay popup |
| **Page Impact** | None (separate panel) | Pushes content when expanded |
| **Scope** | Whole browser | Per-tab with inheritance |
| **Default State** | Always on | OFF (non-intrusive) |

## Architecture

### Components

```
v2/
├── manifest.json          # V3 manifest with content scripts
├── content.js             # Main content script (injected into pages)
├── content.css            # All injected UI styles
├── background.js          # Service worker for API calls
├── auth.js                # OAuth authentication
├── state-manager.js       # Per-tab state management
└── icons/                 # Extension icons
```

### UI Elements

1. **Icon Bar** (60px wide, left edge)
   - Folder navigation icon
   - Search icon
   - Create file icon
   - Settings icon
   - Toggle ON/OFF icon

2. **Expanded Sidebar** (280px wide, pushes content)
   - Full folder tree
   - File operations
   - Multi-select
   - Context menu

3. **Search Overlay Popup**
   - Centered overlay
   - Search input with suggestions
   - Auto-complete from Drive
   - Click outside to close

### Per-Tab State Management

```javascript
// Each tab remembers its own state
Tab State = {
  isActive: boolean,      // ON or OFF
  sidebarExpanded: boolean,
  parentTabId: number     // For inheritance
}
```

**Inheritance Rules:**
- New tab from link (Ctrl+Click): Inherits parent's ON/OFF state
- New tab from address bar: Starts OFF
- New window: Starts OFF

## Implementation Status

### Completed ✅
- [x] Manifest V3 configuration
- [x] Complete CSS architecture
- [x] Icon bar design
- [x] Expanded sidebar design
- [x] Search overlay design
- [x] Modal system
- [x] Toast notifications
- [x] Responsive design

### In Progress 🚧
- [ ] Content script injection logic
- [ ] Per-tab state management
- [ ] Child tab inheritance system
- [ ] Background service worker
- [ ] Authentication integration
- [ ] Drive API integration
- [ ] Search functionality
- [ ] File operations

### TODO 📋
- [ ] Testing across different websites
- [ ] Performance optimization
- [ ] Edge case handling
- [ ] Documentation updates
- [ ] Setup guide for V2

## Key Features

### 1. Non-Intrusive Design
- **OFF by default** - Minimal impact when not in use
- **Icon bar only when ON** - Clean, minimal presence
- **Smooth animations** - Professional transitions

### 2. Per-Tab Control
- Each tab independently toggleable
- State persists during tab lifetime
- Smart inheritance for child tabs

### 3. Content Pushing (Not Overlay)
- When expanded, sidebar pushes page content to the right
- Prevents content occlusion
- Smooth `margin-left` transition on body

### 4. Universal Compatibility
- Works on **any webpage**
- Injects safely without breaking page functionality
- Namespaced CSS (`gdn-` prefix) to avoid conflicts
- Maximum z-index to stay on top

## Technical Implementation

### Content Script Injection

```javascript
// Injected into all pages
matches: ["<all_urls>"]
run_at: "document_idle"
```

### DOM Injection Strategy

```javascript
// Create shadow root for isolation (optional)
const root = document.createElement('div');
root.id = 'gdn-root';
document.body.appendChild(root);

// Inject icon bar, sidebar, search overlay
root.innerHTML = `
  <div id="gdn-iconbar">...</div>
  <div id="gdn-sidebar">...</div>
  <div id="gdn-search-overlay">...</div>
`;
```

### State Persistence

```javascript
// Per-tab state stored in chrome.storage.session
chrome.storage.session.set({
  [`tab_${tabId}`]: {
    isActive: true,
    sidebarExpanded: false
  }
});
```

### Page Content Adjustment

```javascript
// When sidebar expands
document.body.classList.add('gdn-sidebar-expanded');
// CSS adds margin-left with transition

// When sidebar collapses
document.body.classList.remove('gdn-sidebar-expanded');
```

## Setup Instructions

### Prerequisites
- Chrome 114+
- Google Cloud Project with Drive API enabled
- OAuth 2.0 credentials

### Installation

1. **Configure manifest.json**
   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com"
   }
   ```

2. **Load extension**
   - Chrome → chrome://extensions/
   - Enable Developer mode
   - Load unpacked → Select v2 folder

3. **Test on any webpage**
   - Navigate to any site
   - Extension icon bar appears (OFF by default)
   - Click toggle icon to activate
   - Click folder icon to expand sidebar

## Usage

### Activating Extension
1. Navigate to any webpage
2. Click toggle icon in bottom of icon bar
3. Extension activates for current tab
4. Icon bar remains visible

### Using Folder Tree
1. Click folder icon in icon bar
2. Sidebar expands (pushes content)
3. Navigate folders
4. Click file to open
5. Click pin icon or X to collapse

### Using Search
1. Click search icon in icon bar
2. Search overlay appears
3. Type to search Drive
4. Click suggestion to open
5. Click outside to close

### Creating Files
1. Click create icon (+ button)
2. Select file type from menu
3. Choose location
4. File created and opened

## Known Limitations

1. **Page Compatibility**
   - Some heavily customized pages may conflict
   - Pages with their own max z-index may cover extension

2. **Performance**
   - Content script adds minimal overhead to all pages
   - Drive API calls only when extension is active

3. **Mobile**
   - Not designed for mobile browsers
   - Chrome on desktop only

## Troubleshooting

**Icon bar doesn't appear:**
- Check if extension is loaded in chrome://extensions
- Refresh the page
- Check browser console for errors

**Toggle doesn't work:**
- Verify permissions are granted
- Check if OAuth is configured
- Try signing in via extension popup

**Sidebar pushes content off-screen:**
- Expected behavior when expanded
- Content scrollable horizontally
- Collapse sidebar to restore layout

**Child tabs don't inherit:**
- Check tab API permissions
- Verify background script is running
- Check console for state management errors

## Development

### File Structure

```
v2/
├── manifest.json         # Extension configuration
├── content.js            # Main injection logic (to be created)
├── content.css           # ✅ All styles (completed)
├── background.js         # API & state management (to be created)
├── auth.js               # OAuth handling (adapt from v1)
├── state-manager.js      # Tab state management (to be created)
├── icons/                # Extension icons
└── README_V2.md          # This file
```

### Next Steps

1. Implement `content.js` - Main content script
2. Implement `state-manager.js` - Per-tab state logic
3. Adapt `background.js` from V1 for new architecture
4. Implement child tab inheritance
5. Test on various websites
6. Performance optimization
7. Edge case handling

## Comparison: When to Use V1 vs V2

**Use V1 (Side Panel) if:**
- Want extension always available
- Don't want it to affect page layout
- Work primarily on Google Drive
- Want simple setup

**Use V2 (Content Script) if:**
- Want per-tab control
- Need it on any webpage
- Want non-intrusive default
- Need child tab inheritance
- Want integrated experience

## License

MIT License - Same as V1

---

**Status**: Architecture complete, implementation in progress
**Target Release**: TBD
**Compatibility**: Chrome 114+

For V1 documentation, see parent directory's README.md
