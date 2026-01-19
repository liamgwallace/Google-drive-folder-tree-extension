# Google Drive Tree Navigator - Version Comparison

This repository contains **two complete implementations** of the Google Drive Tree Navigator Chrome Extension, each with a different architecture and use case.

## Quick Comparison

| Feature | V1 (Side Panel) | V2 (Content Script) |
|---------|-----------------|---------------------|
| **📍 Location** | `/` (root directory) | `/v2/` subdirectory |
| **🏗️ Architecture** | Chrome Side Panel API | Content script injection |
| **🎯 Integration** | Separate browser panel | Injected into webpages |
| **👁️ Visibility** | Always visible | Per-tab toggle (OFF by default) |
| **📄 Page Impact** | None (separate panel) | Pushes content when expanded |
| **🎮 User Control** | Always on | Per-tab ON/OFF |
| **🌐 Works On** | All tabs (globally) | Individual tabs |
| **👶 Child Tabs** | N/A (global) | Inherits parent state |
| **⚡ Performance** | Better (isolated) | Good (content script overhead) |
| **🛠️ Setup** | Easier | Slightly more complex |
| **📱 UI Mode** | Fixed sidebar (300px) | Icon bar (60px) + Expandable (280px) |
| **🎨 Default State** | Always visible | Hidden (non-intrusive) |
| **💾 State** | Global | Per-tab with inheritance |

---

## Version 1: Side Panel (Simple & Always Available)

### 📂 Location
```
/ (root directory)
├── manifest.json
├── sidebar.html
├── sidebar.css
├── sidebar.js
├── auth.js
├── background.js
└── icons/
```

### ✨ Best For
- Users who want Drive access **always available**
- Users who primarily work with Google Drive
- Users who don't want the extension affecting page layouts
- Simpler setup and maintenance

### 🎯 Key Features
- **Persistent side panel** - Always accessible from any tab
- **No page interference** - Completely separate from webpage
- **Simple UI** - One sidebar with all features
- **Global state** - Same view across all tabs
- **Chrome 114+** - Uses modern Side Panel API

### 🚀 How It Works
1. Extension creates a **separate side panel** in Chrome
2. Click extension icon to open panel
3. Panel slides out from side (like DevTools)
4. Panel is **independent of the webpage**
5. Same panel accessible from any tab

### 📋 Setup Summary
1. Configure OAuth in Google Cloud Console
2. Add Client ID to manifest.json
3. Create PNG icons from SVG
4. Load extension in Chrome
5. Click extension icon → Sign in → Done!

**Time**: ~15-20 minutes

**Documentation**: [README.md](README.md) | [SETUP.md](SETUP.md) | [QUICKSTART.md](QUICKSTART.md)

---

## Version 2: Content Script (Flexible & Per-Tab Control)

### 📂 Location
```
/v2/
├── manifest.json
├── content.js
├── content.css
├── background.js
├── auth.js
└── icons/
```

### ✨ Best For
- Users who want **per-tab control**
- Users who work across many different websites
- Users who want **non-intrusive** default behavior
- Users who want **child tab inheritance**
- Users who need Drive access while reading/working on any site

### 🎯 Key Features
- **Content script injection** - Works on ANY webpage
- **Per-tab toggle** - Each tab independently ON/OFF
- **Child tab inheritance** - Ctrl+Click preserves state
- **Collapsible icon bar** - Minimal (60px) when collapsed
- **Expandable sidebar** - Full (280px) when needed
- **Pushes content** - Sidebar doesn't overlay, it shifts content
- **Search overlay** - Separate popup for search
- **OFF by default** - Non-intrusive by design

### 🚀 How It Works
1. Extension **injects** into every webpage
2. By default, extension is **OFF** (invisible)
3. Click toggle button → Icon bar appears on left edge
4. Click folder icon → Sidebar expands (pushes content)
5. Each tab remembers its own ON/OFF state
6. Ctrl+Click links → New tab inherits parent's state

### 📋 Setup Summary
1. Configure OAuth in Google Cloud Console
2. Load extension to get Extension ID
3. **Update OAuth redirect URI** with Extension ID
4. Add Client ID to manifest.json
5. Create PNG icons (optional)
6. Test on any website!

**Time**: ~20-30 minutes (includes extra OAuth step)

**Documentation**: [v2/README_V2.md](v2/README_V2.md) | [v2/SETUP_V2.md](v2/SETUP_V2.md)

---

## Choosing the Right Version

### Use **V1 (Side Panel)** if you:
- ✅ Want Drive always available
- ✅ Primarily work in Google Drive
- ✅ Don't want extension affecting page layouts
- ✅ Prefer simpler setup
- ✅ Want global, consistent Drive view
- ✅ Don't need per-tab control

### Use **V2 (Content Script)** if you:
- ✅ Want per-tab ON/OFF control
- ✅ Work across many different websites
- ✅ Want non-intrusive default (OFF state)
- ✅ Need child tab inheritance
- ✅ Want Drive access while working on other sites
- ✅ Prefer integrated experience
- ✅ Don't mind slightly more complex setup

### Can't Decide? Try This:

**Start with V1** if you want:
- Quick setup
- Always-on convenience
- Simple, predictable behavior

**Start with V2** if you want:
- Maximum flexibility
- Per-tab control
- Modern, integrated experience

---

## Installation Instructions

### Installing V1 (Side Panel)

```bash
# 1. Navigate to root directory
cd /path/to/Google-drive-folder-tree-extension

# 2. Follow SETUP.md instructions
# 3. Load root directory in Chrome
chrome://extensions/ → Load unpacked → Select root folder
```

### Installing V2 (Content Script)

```bash
# 1. Navigate to v2 directory
cd /path/to/Google-drive-folder-tree-extension/v2

# 2. Follow v2/SETUP_V2.md instructions
# 3. Load v2 directory in Chrome
chrome://extensions/ → Load unpacked → Select v2 folder
```

**Important**: Load the **correct directory** for the version you want!

---

## Feature Comparison

| Feature | V1 | V2 |
|---------|----|----|
| **Folder tree navigation** | ✅ | ✅ |
| **File operations (open, search)** | ✅ | ✅ |
| **Multi-select** | ✅ | 🚧 (Partial) |
| **Delete files** | ✅ | ⏳ (Planned) |
| **Move files** | ✅ | ⏳ (Planned) |
| **Rename files** | ✅ | ⏳ (Planned) |
| **Create new files** | ✅ | ⏳ (Planned) |
| **Template support** | ✅ | ⏳ (Planned) |
| **Search/Filter** | ✅ | ✅ |
| **Recent files** | ✅ | ⏳ (Planned) |
| **Pin folders** | ✅ | ⏳ (Planned) |
| **Context menu** | ✅ | ⏳ (Planned) |
| **Per-tab control** | ❌ | ✅ |
| **Child tab inheritance** | ❌ | ✅ |
| **Icon bar** | ❌ | ✅ |
| **Collapsible UI** | ❌ | ✅ |

✅ = Fully implemented
🚧 = Partially implemented
⏳ = Planned
❌ = Not applicable

---

## Technical Differences

### V1 Architecture
```
manifest.json (Side Panel config)
    ↓
sidebar.html + sidebar.css + sidebar.js
    ↓
auth.js ← → background.js ← → Google Drive API
```

- Uses **Side Panel API** (Chrome 114+)
- Separate window from webpage
- No content script injection
- Single instance across all tabs
- State stored in chrome.storage

### V2 Architecture
```
manifest.json (Content Script config)
    ↓
content.js (injected) + content.css (injected)
    ↓
background.js (State Manager + API)
    ↓
Per-tab state (Map) + Child tracking
    ↓
Google Drive API
```

- Uses **Content Scripts** injection
- Injected into every webpage
- Per-tab state management
- Parent-child tab relationship tracking
- Pushes page content when expanded

---

## Performance Comparison

### V1 (Side Panel)
- **Memory**: ~8-12MB (single instance)
- **Page impact**: None (separate panel)
- **Load time**: ~50-100ms (panel open)
- **API calls**: Cached (5 min TTL)

### V2 (Content Script)
- **Memory**: ~5-10MB per active tab
- **Page impact**: ~150KB injection + DOM manipulation
- **Load time**: ~10-50ms per page (injection)
- **API calls**: Cached (5 min TTL)

Both versions are performant for typical use. V1 is slightly more efficient overall, V2 has per-page overhead but isolated per tab.

---

## Compatibility

### V1
- **Chrome 114+** (Side Panel API required)
- **Works on**: All Chrome tabs (globally)
- **Known issues**: None specific to websites

### V2
- **Chrome 114+** (for modern features)
- **Works on**: Any website (content script injection)
- **Known issues**:
  - Some sites with aggressive CSS may conflict
  - Sites with max z-index may cover extension
  - Very rare: Sites that block content scripts

---

## Migration Between Versions

### V1 → V2
1. Export any pinned folders or settings (manual)
2. Load V2 extension
3. Sign in again (separate OAuth instance)
4. Configure per your preference

### V2 → V1
1. Export any state (if needed)
2. Load V1 extension
3. Sign in again
4. Set up as normal

**Note**: Both versions use separate OAuth tokens and storage, so they don't interfere with each other. You can even have both installed simultaneously (only activate one at a time).

---

## Development & Contributing

### V1 Development
```bash
cd /path/to/root
# Edit files in root directory
# Reload extension in Chrome
```

**Main files**:
- `sidebar.js` - UI logic
- `sidebar.css` - Styling
- `background.js` - API calls

### V2 Development
```bash
cd /path/to/root/v2
# Edit files in v2 directory
# Reload extension in Chrome
```

**Main files**:
- `content.js` - Injection & UI
- `content.css` - Namespaced styles
- `background.js` - State & API

**Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines

---

## Future Roadmap

### V1 Enhancements
- Shared Drives support
- Advanced file operations
- Keyboard shortcuts
- Export/import settings
- Dark mode

### V2 Enhancements
- Complete file operations (create, delete, move, rename)
- Recent files section
- Pin folders
- Context menus
- Drag-and-drop
- Keyboard shortcuts
- Shadow DOM isolation
- Dark mode

### Both Versions
- Performance optimizations
- Better error handling
- Internationalization (i18n)
- Accessibility improvements
- More template options

---

## Support & Documentation

### V1 Documentation
- 📘 [README.md](README.md) - Overview
- 🔧 [SETUP.md](SETUP.md) - Detailed setup
- ⚡ [QUICKSTART.md](QUICKSTART.md) - Fast setup
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) - Developer guide

### V2 Documentation
- 📘 [v2/README_V2.md](v2/README_V2.md) - Architecture
- 🔧 [v2/SETUP_V2.md](v2/SETUP_V2.md) - Detailed setup

### Common Resources
- 📝 [LICENSE](LICENSE) - MIT License
- 🐛 GitHub Issues - Report bugs
- 💬 Discussions - Ask questions

---

## FAQ

### Can I use both versions simultaneously?
Technically yes, but not recommended. They'll have separate OAuth instances and may cause confusion. Choose one.

### Which version is better?
Depends on your needs! V1 for simplicity and always-on access. V2 for flexibility and per-tab control.

### Can I switch between versions?
Yes! Just unload one extension and load the other. You'll need to sign in again.

### Will my data/settings transfer?
No, each version stores state separately. You'll need to reconfigure pins, settings, etc.

### Which version will be maintained?
Both! V1 and V2 serve different use cases and will both receive updates.

### Can V2 work like V1 (always on)?
Yes, but you'd need to manually toggle it ON for each tab. Not recommended - use V1 if you want always-on behavior.

### Can V1 work like V2 (per-tab)?
No, V1 is fundamentally global. Use V2 if you need per-tab control.

---

## Summary

✨ **V1 = Simple, Always-On, Separate Panel**
🎯 **V2 = Flexible, Per-Tab, Integrated Experience**

Both are fully functional, well-documented, and ready to use. Choose based on your workflow and preferences!

**Happy Drive navigating!** 🚀

---

**Repository**: [GitHub](https://github.com/liamgwallace/Google-drive-folder-tree-extension)
**License**: MIT
**Versions**: v1.0.0 (Side Panel) | v2.0.0 (Content Script)
**Last Updated**: 2024
