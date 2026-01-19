# Google Drive Tree Navigator - Chrome Extension

A Chrome extension that provides quick access to Google Drive files and folders with two different implementation approaches.

![Version](https://img.shields.io/badge/v1-1.0.0-blue) ![Version](https://img.shields.io/badge/v2-2.0.0-green) ![Chrome](https://img.shields.io/badge/chrome-114%2B-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## 📦 Two Versions Available

This repository contains **two complete implementations** with different architectures and use cases:

### 🔷 Version 1: Side Panel (Simple & Always Available)

**Location**: [`/v1/`](./v1/)
**Architecture**: Chrome Side Panel API
**Best for**: Always-on Drive access, simpler setup

- ✅ Persistent side panel (separate from webpages)
- ✅ Always visible and accessible
- ✅ No impact on page layouts
- ✅ Complete file operations
- ✅ Simpler setup (~15-20 min)

📖 **[V1 Documentation](./v1/)** | **[V1 Setup Guide](./v1/SETUP.md)** | **[V1 Quick Start](./v1/QUICKSTART.md)**

---

### 🔶 Version 2: Content Script (Flexible & Per-Tab Control)

**Location**: [`/v2/`](./v2/)
**Architecture**: Content Script Injection
**Best for**: Per-tab control, works on any website, non-intrusive

- ✅ Works on **any webpage**
- ✅ Per-tab ON/OFF toggle (OFF by default)
- ✅ Child tab inheritance
- ✅ Collapsible icon bar (60px) + expandable sidebar (280px)
- ✅ Non-intrusive design
- ✅ Integrated experience

📖 **[V2 Documentation](./v2/README_V2.md)** | **[V2 Setup Guide](./v2/SETUP_V2.md)**

---

## 🎭 Demo Versions (Try Before Setup!)

**No OAuth, no credentials, no setup required!** Try the demos first to see the UI:

### V1 Demo - Side Panel Preview
**Location**: [`/v1-demo/`](./v1-demo/)

- ✅ Instant preview of V1 UI
- ✅ No Google account needed
- ✅ Uses emoji icons and dummy data
- ✅ All features interactive (simulated)

**Quick start**: Load `v1-demo` folder → Click extension icon → See it work!

📖 **[V1 Demo README](./v1-demo/README_DEMO.md)**

### V2 Demo - Content Script Preview
**Location**: [`/v2-demo/`](./v2-demo/)

- ✅ See V2 on ANY webpage
- ✅ Per-tab toggle in action
- ✅ Emoji icons, no PNG required
- ✅ Experience the integrated UI

**Quick start**: Load `v2-demo` folder → Visit any website → See the icon bar!

📖 **[V2 Demo README](./v2-demo/README_DEMO.md)**

---

## 🤔 Which Version Should I Use?

### Choose **V1** if you want:
- ✅ Always-available Drive access
- ✅ Simpler setup and maintenance
- ✅ No page layout interference
- ✅ Global, consistent view across all tabs
- ✅ Complete file operations (create, delete, move, rename)

### Choose **V2** if you want:
- ✅ Per-tab control (turn on/off per tab)
- ✅ Non-intrusive default behavior
- ✅ Works seamlessly on any website
- ✅ Child tab inheritance (Ctrl+Click)
- ✅ Modern, integrated experience

📊 **[Detailed Comparison](./VERSIONS.md)** - Complete feature comparison and migration guide

---

## 🚀 Quick Start

### For V1 (Side Panel):
```bash
# 1. Navigate to v1 directory
cd v1/

# 2. Follow setup guide
# See v1/SETUP.md for detailed instructions

# 3. Load in Chrome
chrome://extensions/ → Load unpacked → Select v1 folder
```

### For V2 (Content Script):
```bash
# 1. Navigate to v2 directory
cd v2/

# 2. Follow setup guide
# See v2/SETUP_V2.md for detailed instructions

# 3. Load in Chrome
chrome://extensions/ → Load unpacked → Select v2 folder
```

---

## 📋 Quick Comparison

| Feature | V1 (Side Panel) | V2 (Content Script) |
|---------|-----------------|---------------------|
| **Integration** | Separate panel | Injected into pages |
| **Visibility** | Always visible | Per-tab toggle |
| **Default State** | Always ON | OFF (non-intrusive) |
| **Page Impact** | None | Pushes content when expanded |
| **Setup Time** | ~15-20 minutes | ~20-30 minutes |
| **Works On** | All tabs (globally) | Any webpage (per-tab) |
| **Child Tab Inheritance** | N/A | ✅ Yes |
| **File Operations** | ✅ Complete | 🚧 In Progress |

---

## 📁 Repository Structure

```
.
├── v1/                      # Version 1 - Side Panel
│   ├── manifest.json
│   ├── sidebar.html/css/js
│   ├── auth.js
│   ├── background.js
│   ├── icons/
│   ├── SETUP.md            # V1 setup guide
│   └── QUICKSTART.md       # V1 quick start
│
├── v2/                      # Version 2 - Content Script
│   ├── manifest.json
│   ├── content.js/css
│   ├── auth.js
│   ├── background.js
│   ├── icons/
│   ├── README_V2.md        # V2 documentation
│   └── SETUP_V2.md         # V2 setup guide
│
├── VERSIONS.md             # Detailed version comparison
├── CONTRIBUTING.md         # Contribution guidelines
├── LICENSE                 # MIT License
└── README.md              # This file
```

---

## ✨ Features

### Both Versions Include:
- 🔐 **OAuth 2.0 Authentication** - Secure Google Sign-In
- 📁 **Folder Tree Navigation** - Browse your Drive hierarchy
- 🔍 **Search Functionality** - Find files quickly
- 📄 **File Opening** - Single click or Ctrl+Click for new tab
- 🎨 **Professional UI** - Clean, modern interface
- ⚡ **Smart Caching** - Fast loading with 5-minute TTL

### V1 Exclusive Features:
- ✅ Create new files (Docs, Sheets, Slides, Forms, Folders)
- ✅ Delete files with confirmation
- ✅ Move files between folders
- ✅ Rename files
- ✅ Multi-select operations
- ✅ Context menu
- ✅ Recent files section
- ✅ Pin favorite folders
- ✅ Template support

### V2 Exclusive Features:
- ✅ Per-tab ON/OFF toggle
- ✅ Child tab inheritance
- ✅ Icon bar interface (60px collapsed)
- ✅ Expandable sidebar (280px)
- ✅ Search overlay popup
- ✅ Works on any webpage

---

## 🛠️ Requirements

- **Chrome Version**: 114 or higher
- **Google Account**: For Drive access
- **OAuth Credentials**: From Google Cloud Console
- **Time**: 15-30 minutes for setup

---

## 📖 Documentation

### General
- **[VERSIONS.md](./VERSIONS.md)** - Comprehensive version comparison
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Developer guide
- **[LICENSE](./LICENSE)** - MIT License

### Version 1 (Side Panel)
- **[v1/SETUP.md](./v1/SETUP.md)** - Detailed setup guide
- **[v1/QUICKSTART.md](./v1/QUICKSTART.md)** - Quick start guide

### Version 2 (Content Script)
- **[v2/README_V2.md](./v2/README_V2.md)** - Architecture & technical details
- **[v2/SETUP_V2.md](./v2/SETUP_V2.md)** - Detailed setup guide

---

## 🔧 Setup Overview

Both versions require:
1. **Google Cloud Project** with Drive API enabled
2. **OAuth 2.0 Credentials** configured
3. **Extension loaded** in Chrome
4. **Client ID** added to manifest.json

**Detailed instructions** available in each version's SETUP guide.

---

## 💡 Use Cases

### V1 is Perfect For:
- Power users who live in Google Drive
- Users who want Drive always accessible
- Teams who need consistent Drive navigation
- Users who prefer simple, always-on tools

### V2 is Perfect For:
- Users who work across many websites
- Users who want non-intrusive defaults
- Users who need per-tab control
- Users who want child tab inheritance
- Users who reference Drive while working elsewhere

---

## 🎯 Screenshots

### V1 - Side Panel
```
┌─────────────────────────────┐
│  Google Drive Navigator     │
│  ↻ Refresh      + New       │
│  ┌─────────────────────┐    │
│  │ Search...           │    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│  ▼ Recent Files             │
│    📄 Document.docx         │
│    📊 Spreadsheet.xlsx      │
├─────────────────────────────┤
│  ▼ All Folders              │
│    📁 My Drive              │
│      ▶ 📁 Work              │
│      ▼ 📁 Projects          │
│        📄 File.txt          │
└─────────────────────────────┘
```

### V2 - Content Script
```
┌─┐  ← Icon bar (60px)
│📁│  Folders
│🔍│  Search
│+│  Create
│⚙│  Toggle
└─┘

[Expanded sidebar pushes page content]
```

---

## 🔄 Migration

### Switching Between Versions
1. Unload current version in `chrome://extensions/`
2. Load desired version
3. Sign in again (separate OAuth instances)
4. Reconfigure any settings

Both versions can coexist but only activate one at a time.

---

## 🤝 Contributing

We welcome contributions to both versions!

1. Fork the repository
2. Create a feature branch
3. Make your changes (in v1/ or v2/ directory)
4. Test thoroughly
5. Submit a pull request

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for detailed guidelines.

---

## 📊 Stats

- **Total Code**: 7,400+ lines
- **Languages**: JavaScript, HTML, CSS
- **Architecture**: Manifest V3
- **License**: MIT
- **Versions**: 2 complete implementations
- **Documentation**: 3,000+ lines

---

## 🐛 Known Issues

### V1
- Requires Chrome 114+ for Side Panel API
- None website-specific

### V2
- Some websites with aggressive CSS may conflict
- Websites with max z-index may cover extension
- Content script adds ~150KB to all pages

---

## 📅 Roadmap

### V1 Future Enhancements
- Shared Drives support
- Advanced file operations
- Keyboard shortcuts
- Dark mode

### V2 Future Enhancements
- Complete file operations (create, delete, move, rename)
- Recent files and pinned folders
- Drag-and-drop
- Shadow DOM isolation
- Dark mode

---

## 📜 License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Google Drive API documentation
- Chrome Extension documentation
- Chrome Side Panel API
- Content Script best practices

---

## 📞 Support

- 📖 Check version-specific documentation
- 🐛 Report issues on GitHub
- 💬 Join discussions
- 📧 Contact maintainers

---

## ⭐ Quick Links

- **[Version Comparison Guide](./VERSIONS.md)** - Detailed comparison
- **[V1 Setup](./v1/SETUP.md)** - Get started with V1
- **[V2 Setup](./v2/SETUP_V2.md)** - Get started with V2
- **[Contributing Guide](./CONTRIBUTING.md)** - Help improve the project

---

**Choose your version and start navigating Google Drive more efficiently!** 🚀

**Made with ❤️ for productivity**
