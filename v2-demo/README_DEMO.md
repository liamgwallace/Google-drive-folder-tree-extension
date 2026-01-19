# Google Drive Navigator V2 - DEMO VERSION

## 🎭 No Setup Required!

This is a **demonstration version** that works immediately without any configuration. It injects into **any webpage** you visit!

### ✨ Features

- ✅ **No OAuth setup needed** - Works instantly!
- ✅ **No Google Cloud credentials** - Uses dummy data
- ✅ **Emoji icons** - No PNG files required
- ✅ **Works on ANY webpage** - Try it on Google, Wikipedia, GitHub, anywhere!
- ✅ **Per-tab control** - Toggle ON/OFF per tab
- ✅ **Full UI preview** - See exactly how it looks

### 🚀 Quick Start

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `v2-demo` folder
5. **Navigate to any website** (e.g., google.com)
6. You'll see a **60px icon bar on the left** with the extension ON by default
7. Click the **📁 folder icon** to expand the sidebar!

### 🎮 Try These Features

**Icon Bar (Always Visible When ON):**
- 📁 **Folder icon** - Expand/collapse sidebar
- 🔍 **Search icon** - Open search overlay
- ➕ **Create icon** - Create new file (demo)
- 🎭 **Toggle icon** - Turn extension ON/OFF for this tab

**Sidebar (When Expanded):**
- Click folders to expand/collapse
- Browse the demo folder hierarchy
- See emoji icons for all file types
- **Notice**: Page content shifts right (not covered!)

**Search Overlay:**
- Click search icon to open
- Type to search demo files
- Click results to "open" (shows toast)
- Click outside to close

**Per-Tab Toggle:**
- Click 🎭 icon to turn OFF
- Icon bar disappears
- Page content returns to normal
- Click again to turn ON

### 📁 Demo Data Structure

```
📁 My Drive
  ├── 💼 Work
  │   ├── 📊 Reports
  │   ├── 📽️ Presentations
  │   ├── 📝 Q4 2023 Review
  │   └── 📊 2024 Budget
  ├── 🏠 Personal
  │   ├── 🍳 Recipes
  │   ├── ✈️ Travel Plans
  │   └── 📝 Shopping Wishlist
  ├── 🚀 Projects
  │   ├── 🌐 Website Redesign
  │   ├── 📱 Mobile App Development
  │   └── 📝 Project Timeline
  └── 📸 Photos
      ├── 🏖️ Vacation 2023
      └── 👨‍👩‍👧‍👦 Family Photos
```

### 🌐 Test on Different Websites

Try the extension on:
- **google.com** - See how it integrates
- **github.com** - Test with complex layouts
- **wikipedia.org** - Try with long articles
- **youtube.com** - See with video content
- **Any website!** - Works everywhere!

### ⚠️ Expected Behavior

**When Sidebar Expands:**
- Sidebar is 280px wide
- Page content **shifts 280px to the right**
- This is intentional - prevents covering content
- Content becomes horizontally scrollable if needed

**When Sidebar Collapses:**
- Only 60px icon bar visible
- Page content returns to normal width
- Minimal interference

### 🎭 Demo Limitations

This is a **demonstration only**:
- ❌ Files don't actually open (shows toast notifications)
- ❌ No real Google Drive connection
- ❌ Changes don't persist (refresh resets)
- ❌ All operations are simulated
- ❌ Per-tab state doesn't persist across browser restart

### 🔄 Want the Real Version?

See the **[v2](../v2/)** folder for the full version with:
- Real Google Drive API integration
- OAuth authentication
- Actual file operations
- Per-tab state persistence
- Child tab inheritance

### 📖 Setup Guide for Full Version

Follow **[v2/SETUP_V2.md](../v2/SETUP_V2.md)** to set up the real version.

---

## 🎯 Perfect For

- 👀 **Previewing** the UI and behavior
- 🧪 **Testing** how it works on different websites
- 📸 **Screenshots** and demos
- 🎓 **Learning** the per-tab architecture
- 🔍 **Evaluating** before committing to OAuth setup

## 💡 Key Differences from V1 Demo

| Feature | V1 Demo | V2 Demo |
|---------|---------|---------|
| **Location** | Side Panel (separate) | Injected into pages |
| **Visibility** | Always visible | Toggleable per page |
| **Page Impact** | None | Pushes content when expanded |
| **Icon Bar** | No | Yes (60px) |
| **Default State** | Always ON | ON (for demo) |

---

**Enjoy exploring the V2 demo!** 🎉

**Note**: For production use, V2 should default to OFF. This demo starts ON so you can see it immediately.
