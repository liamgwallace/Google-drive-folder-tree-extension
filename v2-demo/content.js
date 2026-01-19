/**
 * Google Drive Navigator V2 DEMO - Content Script
 * No authentication required - uses dummy data!
 */

// Global state for this tab
const GDN = {
  isActive: true, // Start ON for demo
  sidebarExpanded: false,
  searchOpen: false,
  elements: {},
  state: {
    expandedFolders: new Set(['root']),
    selectedFiles: new Set(),
    currentContextItem: null
  }
};

// Initialize extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  try {
    injectUI();
    activateExtension();
    console.log('[GDN Demo] Initialized - Using dummy data!');
  } catch (error) {
    console.error('[GDN Demo] Initialization failed:', error);
  }
}

// ========== UI INJECTION ==========

function injectUI() {
  if (document.getElementById('gdn-root')) {
    console.log('[GDN Demo] UI already injected');
    return;
  }

  const root = document.createElement('div');
  root.id = 'gdn-root';
  root.className = 'gdn-active';

  root.innerHTML = `
    ${createIconBar()}
    ${createSidebar()}
    ${createSearchOverlay()}
    ${createToastContainer()}
  `;

  document.body.appendChild(root);
  cache Elements();
  attachEventListeners();

  console.log('[GDN Demo] UI injected');
}

function createIconBar() {
  return `
    <div id="gdn-iconbar">
      <button class="gdn-icon-button" id="gdn-folder-btn" title="Folders">
        📁
        <span class="gdn-tooltip">Folders</span>
      </button>

      <button class="gdn-icon-button" id="gdn-search-btn" title="Search">
        🔍
        <span class="gdn-tooltip">Search Drive</span>
      </button>

      <button class="gdn-icon-button" id="gdn-create-btn" title="Create">
        ➕
        <span class="gdn-tooltip">Create New</span>
      </button>

      <div class="gdn-icon-spacer"></div>

      <button class="gdn-icon-button gdn-toggle-button active" id="gdn-toggle-btn" title="Toggle Extension">
        🎭
        <span class="gdn-tooltip">DEMO Mode</span>
      </button>
    </div>
  `;
}

function createSidebar() {
  return `
    <div id="gdn-sidebar">
      <div id="gdn-sidebar-header">
        <div id="gdn-sidebar-title">
          <span style="font-size: 20px; margin-right: 8px;">📁</span>
          <span>My Drive 🎭 DEMO</span>
        </div>
        <div id="gdn-sidebar-controls">
          <button class="gdn-header-button" id="gdn-refresh-btn" title="Refresh">
            🔄
          </button>
          <button class="gdn-header-button" id="gdn-close-sidebar-btn" title="Close">
            ✕
          </button>
        </div>
      </div>
      <div id="gdn-sidebar-content">
        <div id="gdn-tree-container">
          <div class="gdn-spinner">Loading demo data...</div>
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
            placeholder="Search demo data..."
            autocomplete="off"
          />
          <button id="gdn-search-button">
            🔍
          </button>
        </div>
        <div id="gdn-search-suggestions"></div>
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
    toastContainer: document.getElementById('gdn-toast-container'),
    folderBtn: document.getElementById('gdn-folder-btn'),
    searchBtn: document.getElementById('gdn-search-btn'),
    createBtn: document.getElementById('gdn-create-btn'),
    toggleBtn: document.getElementById('gdn-toggle-btn'),
    refreshBtn: document.getElementById('gdn-refresh-btn'),
    closeSidebarBtn: document.getElementById('gdn-close-sidebar-btn'),
    treeContainer: document.getElementById('gdn-tree-container'),
    searchInput: document.getElementById('gdn-search-input'),
    searchSuggestions: document.getElementById('gdn-search-suggestions')
  };
}

// ========== EVENT LISTENERS ==========

function attachEventListeners() {
  GDN.elements.toggleBtn?.addEventListener('click', handleToggle);
  GDN.elements.folderBtn?.addEventListener('click', handleFolderClick);
  GDN.elements.searchBtn?.addEventListener('click', handleSearchClick);
  GDN.elements.createBtn?.addEventListener('click', handleCreateClick);
  GDN.elements.closeSidebarBtn?.addEventListener('click', () => collapseSidebar());
  GDN.elements.refreshBtn?.addEventListener('click', handleRefresh);

  GDN.elements.searchOverlay?.addEventListener('click', (e) => {
    if (e.target === GDN.elements.searchOverlay) {
      closeSearchOverlay();
    }
  });

  GDN.elements.searchInput?.addEventListener('input', handleSearchInput);
  GDN.elements.searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearchSubmit();
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

  GDN.elements.toggleBtn.classList.toggle('active', GDN.isActive);
}

async function activateExtension() {
  GDN.isActive = true;
  GDN.elements.root?.classList.add('gdn-active');
  GDN.elements.iconbar?.classList.remove('gdn-hidden');

  await loadInitialData();
  showToast('🎭 Demo Drive Navigator activated (dummy data)', 'success');
}

function deactivateExtension() {
  GDN.isActive = false;
  GDN.elements.root?.classList.remove('gdn-active');
  GDN.elements.iconbar?.classList.add('gdn-hidden');

  collapseSidebar();
  closeSearchOverlay();

  showToast('Demo Drive Navigator deactivated', 'success');
}

// ========== DATA LOADING ==========

async function loadInitialData() {
  try {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate loading
    renderTree();
    showToast('✅ Demo data loaded!', 'success');
  } catch (error) {
    console.error('[GDN Demo] Failed to load data:', error);
    showToast('Failed to load demo data', 'error');
  }
}

function renderTree() {
  if (!GDN.elements.treeContainer) return;

  const files = getDemoFiles('root');
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

  // Icon (emoji)
  html += `<span style="font-size: 20px; margin-right: 8px;">${file.iconLink}</span>`;

  // Name
  html += `<span class="gdn-tree-name">${escapeHtml(file.name)}</span>`;

  div.innerHTML = html;

  // Click handler
  if (isDir) {
    div.addEventListener('click', () => toggleFolder(file.id));
  } else {
    div.addEventListener('click', () => {
      showToast(`🎭 Demo: Would open "${file.name}"`, 'info');
    });
  }

  return div;
}

async function toggleFolder(folderId) {
  if (GDN.state.expandedFolders.has(folderId)) {
    GDN.state.expandedFolders.delete(folderId);
  } else {
    GDN.state.expandedFolders.add(folderId);
  }

  renderTree();
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

  loadInitialData();
}

function collapseSidebar() {
  GDN.sidebarExpanded = false;
  GDN.elements.sidebar?.classList.remove('gdn-expanded');
  document.body.classList.remove('gdn-sidebar-expanded');
  GDN.elements.folderBtn?.classList.remove('active');
}

async function handleRefresh() {
  await loadInitialData();
  showToast('🔄 Demo data refreshed', 'success');
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

  clearTimeout(handleSearchInput.timeout);
  handleSearchInput.timeout = setTimeout(() => performSearch(query), 300);
}

function performSearch(query) {
  const results = searchDemoFiles(query);
  renderSearchSuggestions(results);
}

function renderSearchSuggestions(results) {
  if (!results || results.length === 0) {
    GDN.elements.searchSuggestions.innerHTML = '<div class="gdn-search-empty">No results found</div>';
    return;
  }

  GDN.elements.searchSuggestions.innerHTML = results.map(file => `
    <div class="gdn-search-suggestion" data-name="${escapeHtml(file.name)}">
      <span class="gdn-search-icon" style="font-size: 24px;">${file.iconLink}</span>
      <div class="gdn-search-info">
        <div class="gdn-search-name">${escapeHtml(file.name)}</div>
        <div class="gdn-search-path">Demo Drive</div>
      </div>
    </div>
  `).join('');

  GDN.elements.searchSuggestions.querySelectorAll('.gdn-search-suggestion').forEach(el => {
    el.addEventListener('click', () => {
      const name = el.dataset.name;
      showToast(`🎭 Demo: Would open "${name}"`, 'info');
      closeSearchOverlay();
    });
  });
}

function handleSearchSubmit() {
  const query = GDN.elements.searchInput.value.trim();
  if (query) {
    showToast(`🎭 Demo: Would search for "${query}"`, 'info');
    closeSearchOverlay();
  }
}

// ========== CREATE FILE ==========

function handleCreateClick() {
  showToast('🎭 Demo: Create file dialog would appear', 'info');
}

// ========== TOAST NOTIFICATIONS ==========

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `gdn-toast ${type}`;
  toast.textContent = message;

  GDN.elements.toastContainer.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// ========== UTILITIES ==========

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('[GDN Demo] Content script loaded - No auth required!');
