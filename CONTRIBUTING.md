# Contributing to Google Drive Tree Navigator

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Chrome 114+
- Text editor or IDE
- Basic knowledge of JavaScript, HTML, CSS
- Familiarity with Chrome Extension development (helpful but not required)

### Getting Started

1. **Fork and clone** the repository
2. **Follow [SETUP.md](SETUP.md)** to configure OAuth
3. **Load extension** in Chrome developer mode
4. **Make changes** to the code
5. **Test thoroughly**
6. **Submit a pull request**

## Project Structure

```
├── manifest.json      # Extension manifest (Manifest V3)
├── sidebar.html       # Main UI structure
├── sidebar.css        # Styles and theming
├── sidebar.js         # UI logic and state management
├── auth.js           # OAuth authentication
├── background.js     # Service worker, Drive API calls
└── icons/            # Extension icons
```

## Development Workflow

### Making Changes

1. **Create a branch**: `git checkout -b feature/your-feature-name`
2. **Edit files** in your preferred editor
3. **Reload extension**: Go to `chrome://extensions/` and click reload ↻
4. **Test changes**: Open sidebar and verify functionality
5. **Check console**: Look for errors in DevTools

### Testing

**Sidebar Testing**:
```
1. Right-click sidebar → Inspect
2. Check Console for errors
3. Test all affected features manually
```

**Background Script Testing**:
```
1. Go to chrome://extensions/
2. Click "service worker" under extension
3. View console logs and network requests
```

**Test Checklist**:
- [ ] Authentication works
- [ ] Folders expand/collapse
- [ ] Files open correctly
- [ ] Search filters work
- [ ] Multi-select functions
- [ ] Context menu appears
- [ ] File operations succeed (create, delete, move, rename)
- [ ] No console errors
- [ ] No API errors

### Code Style

**JavaScript**:
- Use ES6+ features (async/await, arrow functions, etc.)
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable names
- Add comments for complex logic
- Handle errors gracefully

**Example**:
```javascript
async function loadFolder(folderId) {
  try {
    const response = await sendMessage({
      action: 'listFiles',
      folderId
    });

    if (response.success) {
      // Process data
      return response.data;
    }
  } catch (error) {
    console.error('Failed to load folder:', error);
    showToast('Failed to load folder', 'error');
  }
}
```

**CSS**:
- Use CSS variables for theming
- Follow existing naming conventions
- Keep selectors specific but not overly complex
- Group related styles together

**HTML**:
- Semantic markup
- Accessibility attributes where appropriate
- Keep structure clean and readable

## Adding Features

### Small Features

1. Add UI elements in `sidebar.html`
2. Add styles in `sidebar.css`
3. Add logic in `sidebar.js`
4. Test thoroughly

### API-Related Features

1. Add API function in `background.js`
2. Add message handler case in `background.js`
3. Call from `sidebar.js` using `sendMessage()`
4. Handle response and update UI

**Example**:

```javascript
// background.js
async function starFile(fileId) {
  const url = `${DRIVE_API_BASE}/files/${fileId}`;
  return await makeApiRequest(url, {
    method: 'PATCH',
    body: JSON.stringify({ starred: true })
  });
}

// Add to message handler
case 'starFile':
  response = await starFile(request.fileId);
  break;

// sidebar.js
async function handleStarFile(fileId) {
  const response = await sendMessage({
    action: 'starFile',
    fileId
  });

  if (response.success) {
    showToast('File starred', 'success');
  }
}
```

## Common Tasks

### Adding a New File Type Template

Edit `showNewFileDialog()` in `sidebar.js`:

```javascript
<div class="template-item" data-mime="your-mime-type">
  <div class="template-icon">📄</div>
  <div class="template-name">Your Type</div>
</div>
```

### Adding a Context Menu Item

1. Add HTML in `sidebar.html`:
```html
<div class="context-item" id="context-your-action">Your Action</div>
```

2. Add event listener in `initializeEventListeners()`:
```javascript
document.getElementById('context-your-action')?.addEventListener('click',
  () => handleContextAction('your-action')
);
```

3. Add case in `handleContextAction()`:
```javascript
case 'your-action':
  await handleYourAction(item);
  break;
```

### Modifying the Cache Duration

Edit `background.js`:
```javascript
const CACHE_TTL = 5 * 60 * 1000; // Change to desired milliseconds
```

### Adding Keyboard Shortcuts

Add to manifest.json:
```json
"commands": {
  "open-sidebar": {
    "suggested_key": {
      "default": "Ctrl+Shift+D",
      "mac": "Command+Shift+D"
    },
    "description": "Open Drive Navigator"
  }
}
```

Then handle in background.js:
```javascript
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-sidebar') {
    // Open side panel
  }
});
```

## Debugging Tips

### Console Logging

Add detailed logs for debugging:
```javascript
console.log('Loading folder:', folderId);
console.error('API error:', error);
console.warn('Cache miss for:', key);
```

### Network Inspection

1. Open background service worker console
2. Go to Network tab
3. Filter for `googleapis.com`
4. Inspect API requests and responses

### Storage Inspection

View stored data:
```javascript
// In sidebar console
chrome.storage.local.get(null, (items) => {
  console.log('All storage:', items);
});
```

### Common Debugging Scenarios

**Authentication issues**:
- Check token in auth.js
- Verify OAuth credentials
- Check redirect URI

**API errors**:
- Check network tab for response details
- Verify API is enabled in Cloud Console
- Check quotas

**UI not updating**:
- Verify state is being updated
- Check if render function is called
- Inspect DOM elements

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows project style
- [ ] All features tested manually
- [ ] No console errors
- [ ] Comments added for complex code
- [ ] README updated if needed
- [ ] No sensitive data (API keys, tokens) in code

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Enhancement
- [ ] Documentation
- [ ] Refactoring

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tested in Chrome
- [ ] No console errors
- [ ] Code follows style guidelines
- [ ] Documentation updated
```

## Feature Requests

Have an idea? Great! Please:

1. Check existing issues first
2. Create a new issue with:
   - Clear description
   - Use cases
   - Expected behavior
   - Optional: mockups or examples

## Bug Reports

Found a bug? Help us fix it:

1. Check if already reported
2. Create issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Chrome version
   - Console errors (if any)
   - Screenshots (if applicable)

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on the code, not the person
- Assume good intentions

## Questions?

- Check [README.md](Readme.md)
- Check [SETUP.md](SETUP.md)
- Open a GitHub issue
- Tag with `question` label

## Resources

### Chrome Extension Docs
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
- [Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)

### Google Drive API
- [API Reference](https://developers.google.com/drive/api/v3/reference)
- [File Types](https://developers.google.com/drive/api/guides/mime-types)
- [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

### JavaScript
- [MDN Web Docs](https://developer.mozilla.org/)
- [Async/Await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

## Recognition

Contributors will be:
- Listed in README
- Mentioned in release notes
- Appreciated forever 🙏

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🎉

Every contribution, no matter how small, makes this project better.
