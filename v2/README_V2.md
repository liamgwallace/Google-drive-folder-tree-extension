# Google Drive Tree Navigator

## Overview

Content script-based Chrome extension that adds Google Drive navigation to any webpage.

## Architecture

```
v2/
├── manifest.json      # Extension configuration
├── content.js         # Main content script (injected into pages)
├── content.css        # UI styles
├── background.js      # Service worker for API calls
├── auth.js            # OAuth authentication
└── icons/             # Extension icons
```

## UI Components

1. **Icon Bar** (60px) - Left edge toolbar with navigation icons
2. **Sidebar** (280px, resizable) - Folder tree, recent files, search
3. **Search Overlay** - Full-text Drive search popup

## Features

- Folder tree navigation
- Recent files list
- File search
- Root folder pinning
- Context menus (open, copy link, rename, move, delete)
- Dark mode
- Per-tab state management
- Child tab inheritance

## Per-Tab Behavior

- Extension is OFF by default
- Each tab can be toggled independently
- Ctrl+Click links inherit parent tab's state
- State persists while tab is open

## CSS Namespacing

All styles use `gdn-` prefix to avoid conflicts with host pages.

## Setup

See [SETUP_V2.md](./SETUP_V2.md) for installation instructions.
