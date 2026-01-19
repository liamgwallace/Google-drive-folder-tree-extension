# Google Drive Tree Navigator

A Chrome extension that provides a persistent left sidebar with a collapsible folder tree for Google Drive, enabling quick navigation, file management, and creation directly from any browser tab.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Chrome](https://img.shields.io/badge/chrome-114%2B-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### 🌲 Folder Tree Navigation
- **Persistent sidebar** - Access your Drive from any tab
- **Collapsible folders** - Expand/collapse to navigate your hierarchy
- **Quick file opening** - Single click to open, Ctrl/Cmd+Click for new tab
- **Smart caching** - Fast loading with automatic cache refresh

### 📁 File Management
- **Multi-select** - Checkbox or Ctrl+Click to select multiple files
- **Batch operations** - Delete or move multiple files at once
- **Right-click menu** - Context menu with common actions
- **Rename files** - Quick inline renaming
- **Move files** - Drag or use folder picker dialog

### ✨ File Creation
- **Quick create** - New files with one click
- **Template support** - Google Docs, Sheets, Slides, Forms, Folders
- **Custom templates** - Add your own company/personal templates
- **Auto-open** - Created files open automatically

### 🔍 Additional Features
- **Search/Filter** - Find files quickly within the tree
- **Recent files** - Quick access to recently viewed items
- **Pin folders** - Keep important folders at the top
- **Refresh** - Manual refresh to sync latest changes
- **Toast notifications** - Visual feedback for all actions

## Screenshots

```
┌─────────────────────────────┐
│  Google Drive Navigator     │
│  ↻ Refresh      + New       │
│  ┌─────────────────────┐    │
│  │ Search...           │    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│  ▼ Recent Files             │
│    📄 Project Proposal.docx │
│    📊 Budget 2024.xlsx      │
├─────────────────────────────┤
│  ▼ All Folders              │
│    📁 My Drive              │
│      ▶ 📁 Work              │
│      ▼ 📁 Projects          │
│        📄 README.md         │
│        📊 Data.xlsx         │
│      ▶ 📁 Personal          │
└─────────────────────────────┘
```

## Installation

### Quick Start (For Personal Use)

1. **Clone or download** this repository
2. **Follow the setup guide**: See [SETUP.md](SETUP.md) for detailed instructions
3. **Load in Chrome**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

📖 **[Complete Setup Instructions](SETUP.md)** - Includes Google Cloud Console configuration, OAuth setup, and troubleshooting

## Requirements

- **Chrome Version**: 114 or higher (for Side Panel API)
- **Google Account**: For Drive access
- **OAuth Credentials**: From Google Cloud Console (see setup guide)

## Project Structure

```
drive-tree-extension/
├── manifest.json          # Extension configuration
├── sidebar.html           # Sidebar UI structure
├── sidebar.css            # Styling
├── sidebar.js             # Main UI logic
├── auth.js                # Authentication handling
├── background.js          # Drive API integration
├── icons/                 # Extension icons
│   ├── icon.svg           # Source SVG
│   ├── icon16.png         # 16x16 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
├── SETUP.md               # Setup instructions
└── Readme.md              # This file
```

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **APIs**:
  - Chrome Extension API (Manifest V3)
  - Chrome Identity API (OAuth)
  - Chrome Side Panel API
  - Google Drive API v3
- **Authentication**: OAuth 2.0
- **Storage**: Chrome Storage API

## Usage

### Basic Navigation

1. **Open sidebar**: Click the extension icon in toolbar
2. **Expand folders**: Click folder name or arrow icon
3. **Open files**:
   - Single click → Opens in current tab
   - Ctrl/Cmd+Click → Opens in new tab

### File Operations

**Multi-Select**:
- Click checkboxes to select multiple files
- Or Ctrl+Click on items
- Selection panel appears at bottom

**Context Menu** (Right-click):
- Open / Open in New Tab
- Rename
- Move
- Pin Folder (folders only)
- Delete

**Create New Files**:
1. Click "+ New" button
2. Choose file type (Doc, Sheet, Slide, Form, Folder)
3. Enter name
4. File opens automatically

### Search

- Type in search box
- Results filter in real-time
- Clear search with X button

### Pin Folders

- Right-click folder → "Pin Folder"
- Pinned folders appear in "Pinned Folders" section
- Right-click again to unpin

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open in new tab | Ctrl/Cmd + Click |
| Multi-select | Ctrl + Click checkbox |
| Deselect all | Click "Clear" in selection panel |

## Configuration

### OAuth Setup

Required for authentication. See [SETUP.md](SETUP.md) for complete instructions.

Key steps:
1. Create Google Cloud project
2. Enable Drive API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add Client ID to manifest.json

### Customization

**Change Colors**: Edit CSS variables in `sidebar.css`:
```css
:root {
  --primary-color: #4285f4;
  --danger-color: #ea4335;
  /* ... more variables */
}
```

**Adjust Caching**: Modify `CACHE_TTL` in `background.js`:
```javascript
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

**Add Custom Templates**:
1. Create template files in your Drive
2. Modify `showNewFileDialog()` in `sidebar.js`
3. Add template options to the grid

## API Usage & Limits

**Google Drive API Quotas**:
- 1,000 requests per 100 seconds per user
- Usually sufficient for normal use
- Caching helps minimize API calls

**Rate Limit Handling**:
- Extension implements 5-minute cache
- Manual refresh available
- Automatic retry on token expiration

## Troubleshooting

### Common Issues

**"Sign in button doesn't work"**
- Verify OAuth Client ID in manifest.json
- Check redirect URI includes correct extension ID
- See [SETUP.md](SETUP.md) for details

**"Files not loading"**
- Check browser console for errors
- Verify Drive API is enabled
- Try clicking Refresh button

**"Extension icon disappeared"**
- Go to chrome://extensions
- Re-enable the extension
- Pin to toolbar via puzzle piece icon

📖 See [SETUP.md](SETUP.md) for complete troubleshooting guide

## Development

### Running Locally

1. Clone repository
2. Follow [SETUP.md](SETUP.md)
3. Load unpacked extension in Chrome
4. Make changes
5. Reload extension to test

### Debugging

**Sidebar**:
- Right-click sidebar → Inspect
- View console, network, and DOM

**Background Script**:
- chrome://extensions → "service worker"
- Click to open DevTools

**Storage**:
- DevTools → Application → Storage
- View chrome.storage.local contents

### Making Changes

**UI Changes**: Edit `sidebar.html` and `sidebar.css`
**Logic Changes**: Edit `sidebar.js`
**API Changes**: Edit `background.js`
**Auth Changes**: Edit `auth.js`

After changes:
1. Save files
2. Go to chrome://extensions
3. Click reload icon on extension

## Permissions Explained

| Permission | Purpose |
|------------|---------|
| `identity` | Google OAuth authentication |
| `storage` | Store pinned folders and settings |
| `sidePanel` | Display sidebar interface |
| Drive scopes | Read/write access to Google Drive |

## Security & Privacy

- **OAuth**: Secure Google authentication
- **No data collection**: Extension doesn't collect or transmit user data
- **Local storage only**: Settings stored in Chrome's secure storage
- **Token encryption**: Chrome handles token security
- **API only**: All Drive operations via official Google APIs

## Contributing

This is a personal/small-team project. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Roadmap

### Planned Features
- [ ] Drag-and-drop file moving
- [ ] Keyboard navigation
- [ ] Folder bookmarks/favorites
- [ ] Quick access to Shared Drives
- [ ] Dark mode support
- [ ] Export folder structure
- [ ] Batch rename
- [ ] File preview on hover

### Future Enhancements
- [ ] Integration with Google Workspace apps
- [ ] Offline mode
- [ ] Advanced search with filters
- [ ] File version history
- [ ] Sharing controls
- [ ] Activity feed

## Known Limitations

- **Chrome only**: Uses Chrome-specific APIs
- **Requires Chrome 114+**: Side Panel API dependency
- **Online only**: Requires internet connection
- **API limits**: Subject to Google Drive API quotas
- **No offline caching**: Files not available offline

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Google Drive API documentation
- Chrome Extension documentation
- Icon design inspired by Google Drive

## Support

For issues, questions, or feature requests:

1. Check [SETUP.md](SETUP.md) for setup help
2. Review troubleshooting section above
3. Check browser console for errors
4. Open an issue on GitHub (if applicable)

## Version History

### v1.0.0 (Current)
- Initial release
- Core folder tree navigation
- File operations (create, delete, move, rename)
- Multi-select support
- Search and filter
- Recent files
- Pin folders
- OAuth authentication
- Side panel interface

---

**Made with ❤️ for productivity**

*Streamline your Google Drive workflow with a persistent, accessible folder tree right in your browser.*
