/**
 * Google Drive Navigator V2 - Content Script
 * Injects and manages the UI on all webpages
 */

// Global state for this tab
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
    currentContextItem: null
  }
};

// Initialize extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  try {
    // Check if extension should be active on this tab
    const tabState = await getTabState();
    GDN.isActive = tabState?.isActive || false;

    // Inject UI elements
    injectUI();

    // If active, show UI
    if (GDN.isActive) {
      activateExtension();
    }

    // Listen for messages from background
    chrome.runtime.onMessage.addListener(handleMessage);

    console.log('[GDN] Initialized', { isActive: GDN.isActive });
  } catch (error) {
    console.error('[GDN] Initialization failed:', error);
  }
}

// ========== UI INJECTION ==========

function injectUI() {
  // Check if already injected
  if (document.getElementById('gdn-root')) {
    console.log('[GDN] UI already injected');
    return;
  }

  // Create root container
  const root = document.createElement('div');
  root.id = 'gdn-root';
  root.className = GDN.isActive ? 'gdn-active' : '';

  // Build UI structure
  root.innerHTML = `
    ${createIconBar()}
    ${createSidebar()}
    ${createSearchOverlay()}
    ${createModalOverlay()}
    ${createToastContainer()}
  `;

  // Append to body
  document.body.appendChild(root);

  // Store element references
  cacheElements();

  // Attach event listeners
  attachEventListeners();

  console.log('[GDN] UI injected');
}

function createIconBar() {
  return `
    <div id="gdn-iconbar" class="${GDN.isActive ? '' : 'gdn-hidden'}">
      <button class="gdn-icon-button" id="gdn-folder-btn" title="Folders">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
        <span class="gdn-tooltip">Folders</span>
      </button>

      <button class="gdn-icon-button" id="gdn-search-btn" title="Search">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <span class="gdn-tooltip">Search Drive</span>
      </button>

      <button class="gdn-icon-button" id="gdn-create-btn" title="Create">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        <span class="gdn-tooltip">Create New</span>
      </button>

      <div class="gdn-icon-spacer"></div>

      <button class="gdn-icon-button gdn-toggle-button ${GDN.isActive ? 'active' : ''}" id="gdn-toggle-btn" title="Toggle Extension">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zM7 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
        </svg>
        <span class="gdn-tooltip">${GDN.isActive ? 'Turn OFF' : 'Turn ON'}</span>
      </button>
    </div>
  `;
}

function createSidebar() {
  return `
    <div id="gdn-sidebar" class="${GDN.sidebarExpanded ? 'gdn-expanded' : ''}">
      <div id="gdn-sidebar-header">
        <div id="gdn-sidebar-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
          <span>My Drive</span>
        </div>
        <div id="gdn-sidebar-controls">
          <button class="gdn-header-button" id="gdn-refresh-btn" title="Refresh">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button class="gdn-header-button" id="gdn-pin-btn" title="Pin Sidebar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
            </svg>
          </button>
          <button class="gdn-header-button" id="gdn-close-sidebar-btn" title="Close">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
      <div id="gdn-sidebar-content">
        <div id="gdn-auth-screen">
          <h3>Google Drive Navigator</h3>
          <p>Sign in to access your Google Drive files and folders</p>
          <button class="gdn-btn gdn-btn-primary" id="gdn-sign-in-btn">Sign In with Google</button>
          <div class="gdn-error-message gdn-hidden" id="gdn-auth-error"></div>
        </div>
        <div id="gdn-tree-container" class="gdn-hidden">
          <div class="gdn-spinner">Loading...</div>
        </div>
      </div>
    </div>
  `;
}

function createSearchOverlay() {
  return `
    <div id="gdn-search-overlay">
      <div id="gdn-search-popup">
        <div id="gdn-search-input-container">
          <input
            type="text"
            id="gdn-search-input"
            placeholder="Search Google Drive..."
            autocomplete="off"
          />
          <button id="gdn-search-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </div>
        <div id="gdn-search-suggestions"></div>
      </div>
    </div>
  `;
}

function createModalOverlay() {
  return `
    <div id="gdn-modal-overlay">
      <div id="gdn-modal">
        <div id="gdn-modal-header">
          <h4 id="gdn-modal-title">Modal Title</h4>
          <button id="gdn-modal-close" class="gdn-header-button">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div id="gdn-modal-body"></div>
        <div id="gdn-modal-footer"></div>
      </div>
    </div>
  `;
}

function createToastContainer() {
  return `<div id="gdn-toast-container"></div>`;
}

// ========== ELEMENT CACHING ==========

function cacheElements() {
  GDN.elements = {
    root: document.getElementById('gdn-root'),
    iconbar: document.getElementById('gdn-iconbar'),
    sidebar: document.getElementById('gdn-sidebar'),
    searchOverlay: document.getElementById('gdn-search-overlay'),
    modalOverlay: document.getElementById('gdn-modal-overlay'),
    toastContainer: document.getElementById('gdn-toast-container'),

    // Buttons
    folderBtn: document.getElementById('gdn-folder-btn'),
    searchBtn: document.getElementById('gdn-search-btn'),
    createBtn: document.getElementById('gdn-create-btn'),
    toggleBtn: document.getElementById('gdn-toggle-btn'),
    refreshBtn: document.getElementById('gdn-refresh-btn'),
    pinBtn: document.getElementById('gdn-pin-btn'),
    closeSidebarBtn: document.getElementById('gdn-close-sidebar-btn'),

    // Auth
    authScreen: document.getElementById('gdn-auth-screen'),
    signInBtn: document.getElementById('gdn-sign-in-btn'),
    authError: document.getElementById('gdn-auth-error'),

    // Content
    treeContainer: document.getElementById('gdn-tree-container'),
    searchInput: document.getElementById('gdn-search-input'),
    searchSuggestions: document.getElementById('gdn-search-suggestions'),

    // Modal
    modal: document.getElementById('gdn-modal'),
    modalTitle: document.getElementById('gdn-modal-title'),
    modalBody: document.getElementById('gdn-modal-body'),
    modalFooter: document.getElementById('gdn-modal-footer'),
    modalClose: document.getElementById('gdn-modal-close')
  };
}

// ========== EVENT LISTENERS ==========

function attachEventListeners() {
  // Toggle extension ON/OFF
  GDN.elements.toggleBtn?.addEventListener('click', handleToggle);

  // Folder button - expand sidebar
  GDN.elements.folderBtn?.addEventListener('click', handleFolderClick);

  // Search button - open search overlay
  GDN.elements.searchBtn?.addEventListener('click', handleSearchClick);

  // Create button
  GDN.elements.createBtn?.addEventListener('click', handleCreateClick);

  // Sidebar controls
  GDN.elements.closeSidebarBtn?.addEventListener('click', () => collapseSidebar());
  GDN.elements.refreshBtn?.addEventListener('click', handleRefresh);
  GDN.elements.pinBtn?.addEventListener('click', handlePin);

  // Auth
  GDN.elements.signInBtn?.addEventListener('click', handleSignIn);

  // Search overlay - close on outside click
  GDN.elements.searchOverlay?.addEventListener('click', (e) => {
    if (e.target === GDN.elements.searchOverlay) {
      closeSearchOverlay();
    }
  });

  // Search input
  GDN.elements.searchInput?.addEventListener('input', handleSearchInput);
  GDN.elements.searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearchSubmit();
  });

  // Modal overlay - close on outside click
  GDN.elements.modalOverlay?.addEventListener('click', (e) => {
    if (e.target === GDN.elements.modalOverlay) {
      closeModal();
    }
  });

  GDN.elements.modalClose?.addEventListener('click', closeModal);
}

// ========== STATE MANAGEMENT ==========

async function getTabState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getTabState' }, resolve);
  });
}

async function setTabState(state) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'setTabState', state }, resolve);
  });
}

// ========== ACTIVATION/DEACTIVATION ==========

async function handleToggle() {
  GDN.isActive = !GDN.isActive;

  if (GDN.isActive) {
    await activateExtension();
  } else {
    deactivateExtension();
  }

  // Save state
  await setTabState({ isActive: GDN.isActive });

  // Update button
  GDN.elements.toggleBtn.classList.toggle('active', GDN.isActive);
  const tooltip = GDN.elements.toggleBtn.querySelector('.gdn-tooltip');
  if (tooltip) {
    tooltip.textContent = GDN.isActive ? 'Turn OFF' : 'Turn ON';
  }
}

async function activateExtension() {
  GDN.isActive = true;
  GDN.elements.root?.classList.add('gdn-active');
  GDN.elements.iconbar?.classList.remove('gdn-hidden');

  // Check authentication
  await checkAuthentication();

  showToast('Drive Navigator activated', 'success');
}

function deactivateExtension() {
  GDN.isActive = false;
  GDN.elements.root?.classList.remove('gdn-active');
  GDN.elements.iconbar?.classList.add('gdn-hidden');

  // Close sidebar and overlays
  collapseSidebar();
  closeSearchOverlay();
  closeModal();

  showToast('Drive Navigator deactivated', 'success');
}

// ========== AUTHENTICATION ==========

async function checkAuthentication() {
  try {
    const response = await sendMessageToBackground({ action: 'checkAuth' });
    GDN.isAuthenticated = response.authenticated;

    if (GDN.isAuthenticated) {
      showMainContent();
    } else {
      showAuthScreen();
    }
  } catch (error) {
    console.error('[GDN] Auth check failed:', error);
    showAuthScreen();
  }
}

async function handleSignIn() {
  try {
    GDN.elements.signInBtn.disabled = true;
    GDN.elements.signInBtn.textContent = 'Signing in...';
    GDN.elements.authError.classList.add('gdn-hidden');

    const response = await sendMessageToBackground({ action: 'signIn' });

    if (response.success) {
      GDN.isAuthenticated = true;
      showMainContent();
      await loadInitialData();
    } else {
      throw new Error(response.error || 'Sign in failed');
    }
  } catch (error) {
    console.error('[GDN] Sign in failed:', error);
    GDN.elements.authError.textContent = error.message;
    GDN.elements.authError.classList.remove('gdn-hidden');
  } finally {
    GDN.elements.signInBtn.disabled = false;
    GDN.elements.signInBtn.textContent = 'Sign In with Google';
  }
}

function showAuthScreen() {
  GDN.elements.authScreen?.classList.remove('gdn-hidden');
  GDN.elements.treeContainer?.classList.add('gdn-hidden');
}

function showMainContent() {
  GDN.elements.authScreen?.classList.add('gdn-hidden');
  GDN.elements.treeContainer?.classList.remove('gdn-hidden');
}

// ========== SIDEBAR OPERATIONS ==========

function handleFolderClick() {
  if (GDN.sidebarExpanded) {
    collapseSidebar();
  } else {
    expandSidebar();
  }
}

function expandSidebar() {
  GDN.sidebarExpanded = true;
  GDN.elements.sidebar?.classList.add('gdn-expanded');
  document.body.classList.add('gdn-sidebar-expanded');
  GDN.elements.folderBtn?.classList.add('active');

  // Load data if authenticated
  if (GDN.isAuthenticated && GDN.state.folderCache.size === 0) {
    loadInitialData();
  }
}

function collapseSidebar() {
  GDN.sidebarExpanded = false;
  GDN.elements.sidebar?.classList.remove('gdn-expanded');
  document.body.classList.remove('gdn-sidebar-expanded');
  GDN.elements.folderBtn?.classList.remove('active');
}

async function handleRefresh() {
  GDN.state.folderCache.clear();
  await sendMessageToBackground({ action: 'clearCache' });
  await loadInitialData();
  showToast('Refreshed', 'success');
}

function handlePin() {
  // Toggle pin state
  showToast('Pin feature coming soon', 'info');
}

// ========== DATA LOADING ==========

async function loadInitialData() {
  try {
    const response = await sendMessageToBackground({
      action: 'listFiles',
      folderId: 'root'
    });

    if (response.success) {
      GDN.state.folderCache.set('root', response.data);
      renderTree();
    }
  } catch (error) {
    console.error('[GDN] Failed to load data:', error);
    showToast('Failed to load Drive data', 'error');
  }
}

function renderTree() {
  if (!GDN.elements.treeContainer) return;

  const files = GDN.state.folderCache.get('root');
  if (!files) {
    GDN.elements.treeContainer.innerHTML = '<div class="gdn-spinner">Loading...</div>';
    return;
  }

  GDN.elements.treeContainer.innerHTML = '';

  files.forEach(file => {
    const item = createTreeItem(file, 0);
    GDN.elements.treeContainer.appendChild(item);
  });
}

function createTreeItem(file, level) {
  const div = document.createElement('div');
  div.className = 'gdn-tree-item';
  div.dataset.fileId = file.id;

  const isDir = file.mimeType === 'application/vnd.google-apps.folder';

  let html = '';

  // Indentation
  for (let i = 0; i < level; i++) {
    html += '<span class="gdn-tree-indent"></span>';
  }

  // Toggle for folders
  if (isDir) {
    html += `<span class="gdn-tree-toggle ${GDN.state.expandedFolders.has(file.id) ? 'expanded' : ''}"></span>`;
  } else {
    html += '<span class="gdn-tree-toggle empty"></span>';
  }

  // Icon
  html += `<img src="${file.iconLink || getDefaultIcon(file.mimeType)}" class="gdn-tree-icon" alt="" />`;

  // Name
  html += `<span class="gdn-tree-name">${escapeHtml(file.name)}</span>`;

  div.innerHTML = html;

  // Click handler
  if (isDir) {
    div.addEventListener('click', () => toggleFolder(file.id));
  } else {
    div.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        window.open(file.webViewLink, '_blank');
      } else {
        window.location.href = file.webViewLink;
      }
    });
  }

  return div;
}

async function toggleFolder(folderId) {
  if (GDN.state.expandedFolders.has(folderId)) {
    GDN.state.expandedFolders.delete(folderId);
  } else {
    GDN.state.expandedFolders.add(folderId);

    // Load folder if not cached
    if (!GDN.state.folderCache.has(folderId)) {
      try {
        const response = await sendMessageToBackground({
          action: 'listFiles',
          folderId
        });

        if (response.success) {
          GDN.state.folderCache.set(folderId, response.data);
        }
      } catch (error) {
        console.error('[GDN] Failed to load folder:', error);
      }
    }
  }

  renderTree();
}

// ========== SEARCH OVERLAY ==========

function handleSearchClick() {
  if (GDN.searchOpen) {
    closeSearchOverlay();
  } else {
    openSearchOverlay();
  }
}

function openSearchOverlay() {
  GDN.searchOpen = true;
  GDN.elements.searchOverlay?.classList.add('gdn-visible');
  GDN.elements.searchBtn?.classList.add('active');
  setTimeout(() => GDN.elements.searchInput?.focus(), 100);
}

function closeSearchOverlay() {
  GDN.searchOpen = false;
  GDN.elements.searchOverlay?.classList.remove('gdn-visible');
  GDN.elements.searchBtn?.classList.remove('active');
  GDN.elements.searchInput.value = '';
  GDN.elements.searchSuggestions.innerHTML = '';
}

function handleSearchInput(e) {
  const query = e.target.value.trim();

  if (!query) {
    GDN.elements.searchSuggestions.innerHTML = '';
    return;
  }

  // Debounce search
  clearTimeout(handleSearchInput.timeout);
  handleSearchInput.timeout = setTimeout(() => performSearch(query), 300);
}

async function performSearch(query) {
  try {
    const response = await sendMessageToBackground({
      action: 'searchFiles',
      searchTerm: query
    });

    if (response.success) {
      renderSearchSuggestions(response.data);
    }
  } catch (error) {
    console.error('[GDN] Search failed:', error);
  }
}

function renderSearchSuggestions(results) {
  if (!results || results.length === 0) {
    GDN.elements.searchSuggestions.innerHTML = '<div class="gdn-search-empty">No results found</div>';
    return;
  }

  GDN.elements.searchSuggestions.innerHTML = results.map(file => `
    <div class="gdn-search-suggestion" data-url="${file.webViewLink}">
      <img src="${file.iconLink || getDefaultIcon(file.mimeType)}" class="gdn-search-icon" alt="" />
      <div class="gdn-search-info">
        <div class="gdn-search-name">${escapeHtml(file.name)}</div>
        <div class="gdn-search-path">Google Drive</div>
      </div>
    </div>
  `).join('');

  // Add click handlers
  GDN.elements.searchSuggestions.querySelectorAll('.gdn-search-suggestion').forEach(el => {
    el.addEventListener('click', () => {
      window.location.href = el.dataset.url;
    });
  });
}

function handleSearchSubmit() {
  const query = GDN.elements.searchInput.value.trim();
  if (query) {
    window.open(`https://drive.google.com/drive/search?q=${encodeURIComponent(query)}`, '_blank');
    closeSearchOverlay();
  }
}

// ========== CREATE FILE ==========

function handleCreateClick() {
  showToast('Create feature coming soon', 'info');
}

// ========== MODAL ==========

function closeModal() {
  GDN.elements.modalOverlay?.classList.remove('gdn-visible');
  GDN.elements.modalBody.innerHTML = '';
  GDN.elements.modalFooter.innerHTML = '';
}

// ========== TOAST NOTIFICATIONS ==========

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `gdn-toast ${type}`;
  toast.textContent = message;

  GDN.elements.toastContainer.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// ========== MESSAGE HANDLING ==========

async function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

function handleMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'toggleExtension':
      handleToggle();
      sendResponse({ success: true });
      break;

    case 'refreshData':
      handleRefresh();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }

  return true;
}

// ========== UTILITIES ==========

function getDefaultIcon(mimeType) {
  const iconMap = {
    'application/vnd.google-apps.folder': 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%234285f4" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>'
  };
  return iconMap[mimeType] || iconMap['application/vnd.google-apps.folder'];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('[GDN] Content script loaded');
