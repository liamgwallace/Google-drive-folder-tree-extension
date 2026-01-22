/**
 * Google Drive Navigator V2 - Content Script
 * Injects and manages the UI on all webpages
 */

// Global state for this tab
const GDN = {
  isActive: false,
  isAuthenticated: false,
  sidebarExpanded: false,
  isPinned: false,
  isResizing: false,
  searchOpen: false,
  elements: {},
  state: {
    expandedFolders: new Set(),
    selectedFiles: new Set(),
    folderCache: new Map(),
    currentContextItem: null,
    contextMenuTarget: null,
    recentFiles: [],
    currentRootId: 'root',
    rootFolders: [],
    recentFilesCollapsed: true  // Default to collapsed
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
    // Load UI state from storage FIRST
    const uiState = await sendMessageToBackground({ action: 'getUIState' });
    if (uiState.success && uiState.data) {
      GDN.state.expandedFolders = new Set(uiState.data.expandedFolders || []);
      GDN.state.currentRootId = uiState.data.lastRootId || 'root';
      GDN.sidebarExpanded = uiState.data.sidebarExpanded || false;
      GDN.state.recentFilesCollapsed = uiState.data.recentFilesCollapsed !== false;
      GDN.isPinned = uiState.data.isPinned || false;

      // Load saved sidebar width
      if (uiState.data.sidebarWidth) {
        document.documentElement.style.setProperty('--gdn-sidebar-width', uiState.data.sidebarWidth + 'px');
      }
    }

    // Load settings
    const settingsResponse = await sendMessageToBackground({ action: 'getSettings' });
    const settings = settingsResponse.success ? settingsResponse.data : { startupMode: 'manual', darkMode: false };
    GDN.settings = settings;

    // Check if extension was active (from tab state OR UI state showing it was in use)
    const tabState = await getTabState();
    const wasActive = tabState?.isActive || GDN.sidebarExpanded || GDN.isPinned;

    // Check auto-activate for Google domains
    if (!wasActive && settings.startupMode === 'auto') {
      const autoLoadDomains = settings.autoLoadDomains || ['drive.google.com', 'docs.google.com', 'sheets.google.com', 'slides.google.com'];
      const currentHost = window.location.hostname;
      if (autoLoadDomains.some(domain => currentHost.includes(domain))) {
        GDN.isActive = true;
      }
    } else if (wasActive) {
      GDN.isActive = true;
    }

    // If active, inject UI and restore state
    if (GDN.isActive) {
      injectUI();

      if (settings.darkMode) {
        applyDarkMode(true);
      }

      // Activate and restore previous state
      await activateExtensionWithState();
    }

    // Listen for messages from background
    chrome.runtime.onMessage.addListener(handleMessage);

    console.log('[GDN] Initialized', { isActive: GDN.isActive, sidebarExpanded: GDN.sidebarExpanded, isPinned: GDN.isPinned });
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
    ${createContextMenu()}
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
      <button class="gdn-icon-button" id="gdn-search-btn" title="Search">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <span class="gdn-tooltip">Search Drive</span>
      </button>

      <button class="gdn-icon-button" id="gdn-folder-btn" title="Folders">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
        <span class="gdn-tooltip">Folders</span>
      </button>

      <div class="gdn-icon-spacer"></div>

      <button class="gdn-icon-button" id="gdn-settings-btn" title="Settings">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22l-1.91 3.32c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.07.63-.07.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
        <span class="gdn-tooltip">Settings</span>
      </button>

      <button class="gdn-icon-button gdn-toggle-button" id="gdn-close-btn" title="Close Extension">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
        <span class="gdn-tooltip">Close Extension</span>
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
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
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
        <div id="gdn-main-content" class="gdn-hidden">
          <div id="gdn-root-folders-section">
            <div class="gdn-root-folders-header">
              <span class="gdn-root-folders-title">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                </svg>
                Root Folders
              </span>
              <button class="gdn-root-add-btn" id="gdn-add-root-btn" title="Add Root Folder">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
            </div>
            <div id="gdn-root-folders-list">
              <div class="gdn-spinner">Loading...</div>
            </div>
          </div>
          <div id="gdn-tree-container">
            <div class="gdn-spinner">Loading...</div>
          </div>
        </div>
      </div>
      <div id="gdn-sidebar-resize-handle"></div>
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

function createContextMenu() {
  return `
    <div id="gdn-context-menu" class="gdn-hidden">
      <div class="gdn-context-menu-item" data-action="open-main">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
        </svg>
        <span>Open in Main Tab</span>
      </div>
      <div class="gdn-context-menu-item" data-action="open-new">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
        </svg>
        <span>Open in New Tab</span>
      </div>
      <div class="gdn-context-menu-separator"></div>
      <div class="gdn-context-menu-item gdn-folder-only" data-action="create-new">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        <span>Create New</span>
        <svg class="gdn-submenu-arrow" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        </svg>
        <div class="gdn-context-submenu">
          <div class="gdn-context-menu-item" data-action="create-doc">
            <span>Document</span>
          </div>
          <div class="gdn-context-menu-item" data-action="create-sheet">
            <span>Spreadsheet</span>
          </div>
          <div class="gdn-context-menu-item" data-action="create-slides">
            <span>Presentation</span>
          </div>
          <div class="gdn-context-menu-item" data-action="create-form">
            <span>Form</span>
          </div>
          <div class="gdn-context-menu-separator"></div>
          <div class="gdn-context-menu-item" data-action="create-folder">
            <span>Folder</span>
          </div>
          <div class="gdn-context-menu-separator"></div>
          <div class="gdn-context-menu-item" data-action="template-meeting">
            <span>Meeting Notes Template</span>
          </div>
          <div class="gdn-context-menu-item" data-action="template-project">
            <span>Project Plan Template</span>
          </div>
          <div class="gdn-context-menu-item" data-action="template-report">
            <span>Report Template</span>
          </div>
        </div>
      </div>
      <div class="gdn-context-menu-item gdn-folder-only" data-action="create-folder-direct">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          <path d="M13 13h-2v-2h-2v2H7v2h2v2h2v-2h2z"/>
        </svg>
        <span>Create New Folder</span>
      </div>
      <div class="gdn-context-menu-separator"></div>
      <div class="gdn-context-menu-item gdn-file-only" data-action="rename">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        <span>Rename</span>
      </div>
      <div class="gdn-context-menu-item" data-action="move">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/>
        </svg>
        <span>Move to...</span>
      </div>
      <div class="gdn-context-menu-separator"></div>
      <div class="gdn-context-menu-item gdn-danger" data-action="delete">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
        <span>Delete</span>
      </div>
    </div>
  `;
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
    settingsBtn: document.getElementById('gdn-settings-btn'),
    closeBtn: document.getElementById('gdn-close-btn'),
    refreshBtn: document.getElementById('gdn-refresh-btn'),
    pinBtn: document.getElementById('gdn-pin-btn'),
    closeSidebarBtn: document.getElementById('gdn-close-sidebar-btn'),

    // Auth
    authScreen: document.getElementById('gdn-auth-screen'),
    signInBtn: document.getElementById('gdn-sign-in-btn'),
    authError: document.getElementById('gdn-auth-error'),

    // Content
    mainContent: document.getElementById('gdn-main-content'),
    treeContainer: document.getElementById('gdn-tree-container'),
    searchInput: document.getElementById('gdn-search-input'),
    searchSuggestions: document.getElementById('gdn-search-suggestions'),

    // Root Folders
    rootFoldersSection: document.getElementById('gdn-root-folders-section'),
    rootFoldersList: document.getElementById('gdn-root-folders-list'),
    addRootBtn: document.getElementById('gdn-add-root-btn'),

    // Modal
    modal: document.getElementById('gdn-modal'),
    modalTitle: document.getElementById('gdn-modal-title'),
    modalBody: document.getElementById('gdn-modal-body'),
    modalFooter: document.getElementById('gdn-modal-footer'),
    modalClose: document.getElementById('gdn-modal-close'),

    // Context Menu
    contextMenu: document.getElementById('gdn-context-menu'),

    // Resize Handle
    resizeHandle: document.getElementById('gdn-sidebar-resize-handle')
  };
}

// ========== EVENT LISTENERS ==========

function attachEventListeners() {
  // Close extension button
  GDN.elements.closeBtn?.addEventListener('click', closeExtension);

  // Folder button - expand sidebar
  GDN.elements.folderBtn?.addEventListener('click', handleFolderClick);

  // Search button - open search overlay
  GDN.elements.searchBtn?.addEventListener('click', handleSearchClick);

  // Create button
  GDN.elements.createBtn?.addEventListener('click', handleCreateClick);

  // Settings button
  GDN.elements.settingsBtn?.addEventListener('click', showSettingsModal);

  // Sidebar controls
  GDN.elements.closeSidebarBtn?.addEventListener('click', () => collapseSidebar());
  GDN.elements.refreshBtn?.addEventListener('click', handleRefresh);
  GDN.elements.pinBtn?.addEventListener('click', handlePin);

  // Auth
  GDN.elements.signInBtn?.addEventListener('click', handleSignIn);

  // Root Folders
  GDN.elements.addRootBtn?.addEventListener('click', handleAddRootClick);

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

  // Context menu - close on outside click
  document.addEventListener('click', (e) => {
    if (GDN.elements.contextMenu && !GDN.elements.contextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });

  // Context menu items
  GDN.elements.contextMenu?.addEventListener('click', handleContextMenuClick);

  // Right-click on tree container whitespace
  GDN.elements.treeContainer?.addEventListener('contextmenu', handleTreeContainerContextMenu);

  // Sidebar resize handle
  GDN.elements.resizeHandle?.addEventListener('mousedown', startResize);
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

async function saveCurrentUIState() {
  try {
    const state = {
      sidebarExpanded: GDN.sidebarExpanded,
      expandedFolders: Array.from(GDN.state.expandedFolders),
      lastRootId: GDN.state.currentRootId,
      recentFilesCollapsed: GDN.state.recentFilesCollapsed,
      isPinned: GDN.isPinned
    };
    await sendMessageToBackground({ action: 'saveUIState', state });
  } catch (error) {
    console.error('[GDN] Failed to save UI state:', error);
  }
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
}

async function activateExtension() {
  // Inject UI if not already done
  if (!document.getElementById('gdn-root')) {
    injectUI();
    if (GDN.settings?.darkMode) {
      applyDarkMode(true);
    }
  }

  // Show the extension
  if (GDN.elements.root) {
    GDN.elements.root.style.display = '';
  }

  GDN.isActive = true;
  GDN.elements.root?.classList.add('gdn-active');
  GDN.elements.iconbar?.classList.remove('gdn-hidden');

  // Push content by iconbar width
  document.body.classList.add('gdn-iconbar-active');

  // Check authentication
  await checkAuthentication();

  // Restore sidebar state if it was expanded
  if (GDN.sidebarExpanded) {
    expandSidebar();
  }

  // Restore pin button state
  if (GDN.isPinned) {
    GDN.elements.pinBtn?.classList.add('active');
  }

  showToast('Drive Navigator activated', 'success');
}

async function activateExtensionWithState() {
  // Inject UI if not already done
  if (!document.getElementById('gdn-root')) {
    injectUI();
    if (GDN.settings?.darkMode) {
      applyDarkMode(true);
    }
  }

  // Show the extension
  if (GDN.elements.root) {
    GDN.elements.root.style.display = '';
  }

  GDN.isActive = true;
  GDN.elements.root?.classList.add('gdn-active');
  GDN.elements.iconbar?.classList.remove('gdn-hidden');

  // Push content by iconbar width
  document.body.classList.add('gdn-iconbar-active');

  // Restore pin button state
  if (GDN.isPinned) {
    GDN.elements.pinBtn?.classList.add('active');
  }

  // Check authentication
  await checkAuthentication();

  // Restore sidebar expanded state
  if (GDN.sidebarExpanded) {
    GDN.elements.sidebar?.classList.add('gdn-expanded');
    GDN.elements.folderBtn?.classList.add('active');

    // Apply pinned margin if pinned
    if (GDN.isPinned) {
      document.body.classList.add('gdn-sidebar-pinned');
    }

    // Load data
    if (GDN.isAuthenticated) {
      await loadInitialData();
    }
  }

  // Apply saved sidebar width
  const uiState = await sendMessageToBackground({ action: 'getUIState' });
  if (uiState.success && uiState.data?.sidebarWidth) {
    GDN.elements.sidebar.style.width = uiState.data.sidebarWidth + 'px';
    document.documentElement.style.setProperty('--gdn-sidebar-width', uiState.data.sidebarWidth + 'px');
  }
}

function deactivateExtension() {
  // Completely hide the entire extension
  if (GDN.elements.root) {
    GDN.elements.root.style.display = 'none';
  }

  GDN.isActive = false;
  document.body.classList.remove('gdn-iconbar-active');
  document.body.classList.remove('gdn-sidebar-pinned');

  // Reset body margin
  document.body.style.marginLeft = '';

  // Close sidebar and overlays
  GDN.sidebarExpanded = false;
  GDN.searchOpen = false;

  showToast('Drive Navigator deactivated', 'success');
}

function closeExtension() {
  // Completely hide the entire extension
  if (GDN.elements.root) {
    GDN.elements.root.style.display = 'none';
  }

  // Remove body classes
  document.body.classList.remove('gdn-iconbar-active');
  document.body.classList.remove('gdn-sidebar-pinned');

  // Reset body margin
  document.body.style.marginLeft = '';

  // Update state
  GDN.isActive = false;
  GDN.sidebarExpanded = false;
  GDN.searchOpen = false;

  // Save state
  setTabState({ isActive: false });
  saveCurrentUIState();
}

// ========== AUTHENTICATION ==========

async function checkAuthentication() {
  try {
    const response = await sendMessageToBackground({ action: 'checkAuth' });
    // Response is { success: true, data: { authenticated: true/false } }
    GDN.isAuthenticated = response.success && response.data?.authenticated;

    console.log('[GDN] Auth check result:', GDN.isAuthenticated);

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
  GDN.elements.mainContent?.classList.add('gdn-hidden');
}

function showMainContent() {
  GDN.elements.authScreen?.classList.add('gdn-hidden');
  GDN.elements.mainContent?.classList.remove('gdn-hidden');
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
  GDN.elements.folderBtn?.classList.add('active');

  // If pinned, push content
  if (GDN.isPinned) {
    document.body.classList.add('gdn-sidebar-pinned');
  }

  // Load data if authenticated
  if (GDN.isAuthenticated && GDN.state.folderCache.size === 0) {
    loadInitialData();
  }

  saveCurrentUIState();
}

function collapseSidebar() {
  GDN.sidebarExpanded = false;
  GDN.elements.sidebar?.classList.remove('gdn-expanded');
  GDN.elements.folderBtn?.classList.remove('active');
  document.body.classList.remove('gdn-sidebar-pinned');

  saveCurrentUIState();
}

async function handleRefresh() {
  GDN.state.folderCache.clear();
  await sendMessageToBackground({ action: 'clearCache' });
  await loadInitialData();
  showToast('Refreshed', 'success');
}

async function handlePin() {
  GDN.isPinned = !GDN.isPinned;

  // Update pin button appearance
  GDN.elements.pinBtn?.classList.toggle('active', GDN.isPinned);

  // Update body class for content pushing
  if (GDN.isPinned && GDN.sidebarExpanded) {
    document.body.classList.add('gdn-sidebar-pinned');
  } else {
    document.body.classList.remove('gdn-sidebar-pinned');
  }

  // Save state
  await sendMessageToBackground({
    action: 'saveUIState',
    state: { isPinned: GDN.isPinned }
  });

  showToast(GDN.isPinned ? 'Sidebar pinned' : 'Sidebar unpinned', 'success');
}

// ========== SIDEBAR RESIZE ==========

function startResize(e) {
  e.preventDefault();
  GDN.isResizing = true;
  GDN.elements.resizeHandle?.classList.add('dragging');

  document.addEventListener('mousemove', doResize);
  document.addEventListener('mouseup', stopResize);

  // Prevent text selection while dragging
  document.body.style.userSelect = 'none';
}

function doResize(e) {
  if (!GDN.isResizing) return;

  // Calculate new width (mouse X position minus icon bar width)
  const iconBarWidth = 60;
  let newWidth = e.clientX - iconBarWidth;

  // Constrain width between min and max
  const minWidth = 200;
  const maxWidth = 500;
  newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

  // Apply width
  GDN.elements.sidebar.style.width = newWidth + 'px';

  // Update CSS variable for body margin if pinned
  document.documentElement.style.setProperty('--gdn-sidebar-width', newWidth + 'px');
}

function stopResize() {
  if (!GDN.isResizing) return;

  GDN.isResizing = false;
  GDN.elements.resizeHandle?.classList.remove('dragging');

  document.removeEventListener('mousemove', doResize);
  document.removeEventListener('mouseup', stopResize);

  document.body.style.userSelect = '';

  // Save the width
  const currentWidth = parseInt(GDN.elements.sidebar.style.width) || 280;
  saveSidebarWidth(currentWidth);
}

async function saveSidebarWidth(width) {
  try {
    await sendMessageToBackground({
      action: 'saveUIState',
      state: { sidebarWidth: width }
    });
  } catch (error) {
    console.error('[GDN] Failed to save sidebar width:', error);
  }
}

// ========== DATA LOADING ==========

async function loadInitialData() {
  try {
    // Load root folders, current root, and recent files in parallel
    const [rootFoldersResponse, currentRootResponse, recentResponse] = await Promise.all([
      sendMessageToBackground({ action: 'getRootFolders' }),
      sendMessageToBackground({ action: 'getCurrentRoot' }),
      sendMessageToBackground({ action: 'getRecentFiles' })
    ]);

    if (rootFoldersResponse.success) {
      GDN.state.rootFolders = rootFoldersResponse.data;
      renderRootFolders();
    }

    if (currentRootResponse.success) {
      GDN.state.currentRootId = currentRootResponse.data;
      GDN.state.expandedFolders.add(currentRootResponse.data);
    }

    if (recentResponse.success) {
      GDN.state.recentFiles = recentResponse.data;
    }

    // Load current root folder contents
    const rootContentResponse = await sendMessageToBackground({
      action: 'listFiles',
      folderId: GDN.state.currentRootId
    });

    if (rootContentResponse.success) {
      GDN.state.folderCache.set(GDN.state.currentRootId, rootContentResponse.data);
    }

    renderTree();
  } catch (error) {
    console.error('[GDN] Failed to load data:', error);
    showToast('Failed to load Drive data', 'error');
  }
}

function renderTree() {
  if (!GDN.elements.treeContainer) return;

  const files = GDN.state.folderCache.get(GDN.state.currentRootId);
  if (!files) {
    GDN.elements.treeContainer.innerHTML = '<div class="gdn-spinner">Loading...</div>';
    return;
  }

  GDN.elements.treeContainer.innerHTML = '';

  // Render recent files section first
  if (GDN.state.recentFiles && GDN.state.recentFiles.length > 0) {
    const recentSection = createRecentFilesSection();
    GDN.elements.treeContainer.appendChild(recentSection);
  }

  // Add section header for folder tree
  const folderHeader = document.createElement('div');
  folderHeader.className = 'gdn-section-header';
  folderHeader.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
    <span>Folders</span>
  `;
  GDN.elements.treeContainer.appendChild(folderHeader);

  // Render main folder tree recursively
  renderTreeLevel(files, 0, GDN.elements.treeContainer);
}

function renderTreeLevel(files, level, container) {
  files.forEach(file => {
    const item = createTreeItem(file, level);
    container.appendChild(item);

    // If this is an expanded folder, render its children
    const isDir = file.mimeType === 'application/vnd.google-apps.folder';
    if (isDir && GDN.state.expandedFolders.has(file.id)) {
      const children = GDN.state.folderCache.get(file.id);
      if (children && children.length > 0) {
        renderTreeLevel(children, level + 1, container);
      }
    }
  });
}

function createTreeItem(file, level) {
  const div = document.createElement('div');
  div.className = 'gdn-tree-item';
  div.dataset.fileId = file.id;
  div.dataset.fileName = file.name;
  div.dataset.fileMimeType = file.mimeType;
  div.dataset.fileLink = file.webViewLink;
  div.dataset.fileParents = JSON.stringify(file.parents || []);

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

  // Name with tooltip data attribute
  html += `<span class="gdn-tree-name" data-full-name="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>`;

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

  // Context menu handler
  div.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(e, file, isDir);
  });

  return div;
}

async function toggleFolder(folderId) {
  if (GDN.state.expandedFolders.has(folderId)) {
    // Collapse
    GDN.state.expandedFolders.delete(folderId);
  } else {
    // Expand
    GDN.state.expandedFolders.add(folderId);

    // Load folder contents if not cached
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
        showToast('Failed to load folder', 'error');
      }
    }
  }

  // Save UI state
  saveCurrentUIState();

  // Re-render tree
  renderTree();
}

// ========== SEARCH OVERLAY ==========
// ========== ROOT FOLDERS MANAGEMENT ==========

function renderRootFolders() {
  if (!GDN.elements.rootFoldersList) return;

  if (!GDN.state.rootFolders || GDN.state.rootFolders.length === 0) {
    GDN.elements.rootFoldersList.innerHTML = '<div class="gdn-empty-message">No root folders</div>';
    return;
  }

  GDN.elements.rootFoldersList.innerHTML = '';

  GDN.state.rootFolders.forEach(root => {
    const rootItem = createRootFolderItem(root);
    GDN.elements.rootFoldersList.appendChild(rootItem);
  });
}

function createRootFolderItem(root) {
  const div = document.createElement('div');
  div.className = 'gdn-root-folder-item';
  div.dataset.rootId = root.id;

  if (root.id === GDN.state.currentRootId) {
    div.classList.add('active');
  }

  div.innerHTML = `
    <svg class="gdn-root-folder-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
    <span class="gdn-root-folder-name" data-full-name="${escapeHtml(root.name)}">${escapeHtml(root.name)}</span>
  `;

  // Click handler - switch to this root
  div.addEventListener('click', () => handleRootFolderClick(root.id));

  // Right-click handler - show delete option
  div.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    handleRootFolderRightClick(root, e);
  });

  return div;
}

async function handleRootFolderClick(rootId) {
  if (rootId === GDN.state.currentRootId) return;

  try {
    // Update current root
    GDN.state.currentRootId = rootId;
    await sendMessageToBackground({ action: 'setCurrentRoot', rootId });

    // Clear folder cache for new root
    GDN.state.folderCache.clear();
    GDN.state.expandedFolders.clear();
    GDN.state.expandedFolders.add(rootId);

    // Save UI state
    saveCurrentUIState();

    // Load new root folder contents
    const response = await sendMessageToBackground({
      action: 'listFiles',
      folderId: rootId
    });

    if (response.success) {
      GDN.state.folderCache.set(rootId, response.data);
    }

    // Update UI
    renderRootFolders();
    renderTree();

    showToast('Switched root folder', 'success');
  } catch (error) {
    console.error('[GDN] Failed to switch root:', error);
    showToast('Failed to switch root folder', 'error');
  }
}

function handleRootFolderRightClick(root, event) {
  // Hide any existing context menu first
  hideContextMenu();

  // Create root folder context menu
  const menu = document.createElement('div');
  menu.id = 'gdn-root-context-menu';
  menu.className = 'gdn-context-menu';

  // Apply dark mode class if active
  if (GDN.elements.root?.classList.contains('gdn-dark-mode')) {
    menu.classList.add('gdn-dark-mode');
  }

  menu.style.position = 'fixed';
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;

  menu.innerHTML = `
    <div class="gdn-context-menu-item" data-action="open-root">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
      </svg>
      <span>Open in Drive</span>
    </div>
    <div class="gdn-context-menu-item" data-action="set-default">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
      <span>Set as Default</span>
    </div>
    <div class="gdn-context-menu-separator"></div>
    <div class="gdn-context-menu-item gdn-danger" data-action="remove-root">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
      <span>Remove from Sidebar</span>
    </div>
  `;

  document.body.appendChild(menu);

  // Adjust position to not go off-screen (after adding to DOM so getBoundingClientRect works)
  const menuRect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let x = event.clientX;
  let y = event.clientY;

  if (x + menuRect.width > viewportWidth) {
    x = viewportWidth - menuRect.width - 10;
  }

  if (y + menuRect.height > viewportHeight) {
    y = viewportHeight - menuRect.height - 10;
  }

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  // Add click handlers
  menu.querySelectorAll('.gdn-context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      handleRootContextAction(action, root);
      menu.remove();
    });
  });

  // Close menu on click outside
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };

  setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

async function handleRootContextAction(action, root) {
  switch (action) {
    case 'open-root':
      window.open(`https://drive.google.com/drive/folders/${root.id}`, '_blank');
      break;
    case 'set-default':
      // Save as default root
      await sendMessageToBackground({ action: 'saveSettings', settings: { defaultRootId: root.id } });
      showToast(`Set "${root.name}" as default folder`, 'success');
      break;
    case 'remove-root':
      handleDeleteRoot(root.id);
      break;
  }
}

async function handleDeleteRoot(rootId) {
  try {
    // Confirm if it's the current root
    if (rootId === GDN.state.currentRootId) {
      if (!confirm('This is your current root folder. Are you sure you want to delete it? You will be switched to My Drive.')) {
        return;
      }
    }

    // Delete root folder
    const response = await sendMessageToBackground({
      action: 'deleteRootFolder',
      folderId: rootId
    });

    if (response.success) {
      GDN.state.rootFolders = response.data;

      // If we deleted the current root, switch to 'root'
      if (rootId === GDN.state.currentRootId) {
        await handleRootFolderClick('root');
      } else {
        renderRootFolders();
      }

      showToast('Root folder deleted', 'success');
    }
  } catch (error) {
    console.error('[GDN] Failed to delete root:', error);
    showToast(error.message || 'Failed to delete root folder', 'error');
  }
}

function handleAddRootClick() {
  showAddRootModal();
}

function showAddRootModal() {
  GDN.elements.modalTitle.textContent = 'Add Root Folder';

  GDN.elements.modalBody.innerHTML = `
    <div class="gdn-modal-section">
      <label class="gdn-label">Google Drive Folder URL or ID</label>
      <input type="text" id="gdn-root-url-input" class="gdn-input"
             placeholder="https://drive.google.com/drive/folders/... or folder ID"
             autocomplete="off"
             autocapitalize="off"
             autocorrect="off"
             spellcheck="false" />
      <div class="gdn-help-text">Paste a folder URL or ID from My Drive or Shared Drives</div>
      <div class="gdn-error-message gdn-hidden" id="gdn-add-root-error"></div>
    </div>
  `;

  GDN.elements.modalFooter.innerHTML = `
    <button class="gdn-btn" id="gdn-cancel-add-root">Cancel</button>
    <button class="gdn-btn gdn-btn-primary" id="gdn-confirm-add-root">Add Folder</button>
  `;

  // Show modal
  GDN.elements.modalOverlay.classList.add('gdn-visible');

  // Attach event listeners
  document.getElementById('gdn-cancel-add-root').addEventListener('click', closeModal);
  document.getElementById('gdn-confirm-add-root').addEventListener('click', handleConfirmAddRoot);

  // Focus input
  setTimeout(() => document.getElementById('gdn-root-url-input')?.focus(), 100);
}

async function handleConfirmAddRoot() {
  const input = document.getElementById('gdn-root-url-input');
  const errorDiv = document.getElementById('gdn-add-root-error');
  const confirmBtn = document.getElementById('gdn-confirm-add-root');

  const value = input.value.trim();

  if (!value) {
    errorDiv.textContent = 'Please enter a folder URL or ID';
    errorDiv.classList.remove('gdn-hidden');
    return;
  }

  try {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Adding...';
    errorDiv.classList.add('gdn-hidden');

    // Extract folder ID from URL or use as-is
    const folderId = extractFolderId(value);

    if (!folderId) {
      throw new Error('Invalid Google Drive folder URL or ID');
    }

    // Get folder metadata to validate and get name
    const metadataResponse = await sendMessageToBackground({
      action: 'getFolderMetadata',
      folderId
    });

    if (!metadataResponse.success) {
      throw new Error(metadataResponse.error || 'Failed to fetch folder metadata');
    }

    const metadata = metadataResponse.data;

    // Create root folder object
    const rootFolder = {
      id: folderId,
      name: metadata.name,
      url: metadata.webViewLink || value
    };

    // Add to root folders
    const addResponse = await sendMessageToBackground({
      action: 'addRootFolder',
      rootFolder
    });

    if (addResponse.success) {
      GDN.state.rootFolders = addResponse.data;
      renderRootFolders();
      closeModal();
      showToast(`Added "${metadata.name}" to root folders`, 'success');
    } else {
      throw new Error(addResponse.error || 'Failed to add root folder');
    }
  } catch (error) {
    console.error('[GDN] Failed to add root:', error);
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('gdn-hidden');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Add Folder';
  }
}

function extractFolderId(input) {
  // Try to match various Google Drive URL patterns (including Shared Drives)
  const urlPatterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,           // /folders/ID (My Drive & Shared Drives)
    /\/drive\/folders\/([a-zA-Z0-9_-]+)/,    // /drive/folders/ID
    /\/drive\/u\/\d+\/folders\/([a-zA-Z0-9_-]+)/, // /drive/u/0/folders/ID
    /id=([a-zA-Z0-9_-]+)/,                   // ?id=ID
    /\/folderview\?id=([a-zA-Z0-9_-]+)/      // /folderview?id=ID
  ];

  for (const pattern of urlPatterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // If no URL pattern matches, check if it's a valid folder ID format
  // Google Drive IDs (including Shared Drive IDs) are typically 10-50 characters
  if (/^[a-zA-Z0-9_-]{10,}$/.test(input.trim())) {
    return input.trim();
  }

  return null;
}

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

  GDN.elements.searchSuggestions.innerHTML = '';

  results.forEach(file => {
    const div = document.createElement('div');
    div.className = 'gdn-search-suggestion';
    div.dataset.url = file.webViewLink;

    const icon = document.createElement('img');
    icon.src = file.iconLink || getDefaultIcon(file.mimeType);
    icon.className = 'gdn-search-icon';
    icon.alt = '';

    const info = document.createElement('div');
    info.className = 'gdn-search-info';

    const name = document.createElement('div');
    name.className = 'gdn-search-name';
    name.textContent = file.name;

    const path = document.createElement('div');
    path.className = 'gdn-search-path';
    path.textContent = 'Google Drive';

    info.appendChild(name);
    info.appendChild(path);
    div.appendChild(icon);
    div.appendChild(info);

    // Click handler
    div.addEventListener('click', () => {
      window.location.href = file.webViewLink;
    });

    // Context menu handler
    div.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
      showContextMenu(e, file, isFolder);
    });

    GDN.elements.searchSuggestions.appendChild(div);
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
      (async () => {
        if (GDN.isActive) {
          deactivateExtension();
        } else {
          await activateExtension();
        }
        await setTabState({ isActive: GDN.isActive });
        sendResponse({ success: true });
      })();
      return true; // Async response

    case 'refreshData':
      handleRefresh();
      sendResponse({ success: true });
      break;

    case 'showNotification':
      showToast(request.message, request.type || 'info');
      sendResponse({ success: true });
      break;

    case 'activateAndShowRoot':
      (async () => {
        try {
          // Activate extension if not already active
          if (!GDN.isActive) {
            await activateExtension();
            await setTabState({ isActive: true });
          }

          // Open sidebar
          if (!GDN.sidebarExpanded) {
            expandSidebar();
          }

          // Reload tree to show new root folder
          await loadInitialData();

          sendResponse({ success: true });
        } catch (error) {
          console.error('[GDN] Failed to activate and show root:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true; // Async response

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

function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

function createRecentFilesSection() {
  const section = document.createElement('div');
  section.className = 'gdn-recent-section';
  section.id = 'gdn-recent-section';

  // Header with toggle
  const header = document.createElement('div');
  header.className = 'gdn-recent-header gdn-collapsible-header';
  header.innerHTML = `
    <span class="gdn-collapse-toggle ${GDN.state.recentFilesCollapsed ? '' : 'expanded'}"></span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
    </svg>
    <span>Recent Files</span>
  `;

  // Click to toggle
  header.addEventListener('click', toggleRecentFiles);
  section.appendChild(header);

  // Recent files list (collapsible)
  const list = document.createElement('div');
  list.className = 'gdn-recent-list';
  list.id = 'gdn-recent-list';

  // Hide if collapsed
  if (GDN.state.recentFilesCollapsed) {
    list.style.display = 'none';
  }

  // SORT by modifiedTime descending (most recent first)
  const sortedFiles = [...GDN.state.recentFiles].sort((a, b) => {
    return new Date(b.modifiedTime) - new Date(a.modifiedTime);
  });

  sortedFiles.slice(0, 10).forEach(file => {
    const item = createRecentFileItem(file);
    list.appendChild(item);
  });

  section.appendChild(list);

  // Divider
  const divider = document.createElement('div');
  divider.className = 'gdn-recent-divider';
  section.appendChild(divider);

  return section;
}

function toggleRecentFiles() {
  GDN.state.recentFilesCollapsed = !GDN.state.recentFilesCollapsed;

  const list = document.getElementById('gdn-recent-list');
  const toggle = document.querySelector('.gdn-recent-header .gdn-collapse-toggle');

  if (GDN.state.recentFilesCollapsed) {
    list.style.display = 'none';
    toggle?.classList.remove('expanded');
  } else {
    list.style.display = 'block';
    toggle?.classList.add('expanded');
  }

  saveCurrentUIState();
}

function createRecentFileItem(file) {
  const div = document.createElement('div');
  div.className = 'gdn-recent-item';
  div.dataset.fileId = file.id;

  const icon = document.createElement('img');
  icon.src = file.iconLink || getDefaultIcon(file.mimeType);
  icon.className = 'gdn-recent-icon';
  icon.alt = '';

  const info = document.createElement('div');
  info.className = 'gdn-recent-info';

  const name = document.createElement('div');
  name.className = 'gdn-recent-name';
  name.textContent = file.name;
  name.setAttribute('data-full-name', file.name);

  const time = document.createElement('div');
  time.className = 'gdn-recent-time';
  time.textContent = getRelativeTime(file.modifiedTime);

  info.appendChild(name);
  info.appendChild(time);

  div.appendChild(icon);
  div.appendChild(info);

  // Click handler
  div.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey) {
      window.open(file.webViewLink, '_blank');
    } else {
      window.location.href = file.webViewLink;
    }
  });

  // Context menu handler
  div.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
    showContextMenu(e, file, isFolder);
  });

  return div;
}

// ========== CONTEXT MENU ==========

function handleTreeContainerContextMenu(e) {
  // Only trigger if clicking on the container itself, not on a tree item
  if (e.target === GDN.elements.treeContainer ||
      e.target.closest('.gdn-tree-item') === null &&
      e.target.closest('.gdn-recent-section') === null) {
    e.preventDefault();
    e.stopPropagation();

    // Set context target to current root folder for creating items there
    GDN.state.contextMenuTarget = {
      id: GDN.state.currentRootId,
      name: 'Current Folder',
      mimeType: 'application/vnd.google-apps.folder'
    };

    // Show context menu with folder options
    showContextMenu(e, GDN.state.contextMenuTarget, true);
  }
}

function showContextMenu(event, file, isFolder) {
  const menu = GDN.elements.contextMenu;
  if (!menu) return;

  // Store reference to the file
  GDN.state.contextMenuTarget = file;

  // Show/hide items based on file type
  const folderOnlyItems = menu.querySelectorAll('.gdn-folder-only');
  const fileOnlyItems = menu.querySelectorAll('.gdn-file-only');

  folderOnlyItems.forEach(item => {
    item.style.display = isFolder ? 'flex' : 'none';
  });

  fileOnlyItems.forEach(item => {
    item.style.display = isFolder ? 'none' : 'flex';
  });

  // Position the menu
  menu.classList.remove('gdn-hidden');

  // Calculate position
  let x = event.clientX;
  let y = event.clientY;

  // Make sure menu doesn't go off screen
  const menuRect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (x + menuRect.width > viewportWidth) {
    x = viewportWidth - menuRect.width - 10;
  }

  if (y + menuRect.height > viewportHeight) {
    y = viewportHeight - menuRect.height - 10;
  }

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
}

function hideContextMenu() {
  GDN.elements.contextMenu?.classList.add('gdn-hidden');
  GDN.state.contextMenuTarget = null;
}

function handleContextMenuClick(e) {
  const item = e.target.closest('.gdn-context-menu-item');
  if (!item) return;

  const action = item.dataset.action;
  if (!action) return;

  const file = GDN.state.contextMenuTarget;
  if (!file) return;

  // Don't close menu for submenu parent
  if (action !== 'create-new') {
    hideContextMenu();
  }

  // Handle actions
  switch (action) {
    case 'open-main':
      window.location.href = file.webViewLink;
      break;

    case 'open-new':
      window.open(file.webViewLink, '_blank');
      break;

    case 'create-doc':
      createFileInFolder(file.id, 'Untitled Document', 'application/vnd.google-apps.document');
      hideContextMenu();
      break;

    case 'create-sheet':
      createFileInFolder(file.id, 'Untitled Spreadsheet', 'application/vnd.google-apps.spreadsheet');
      hideContextMenu();
      break;

    case 'create-slides':
      createFileInFolder(file.id, 'Untitled Presentation', 'application/vnd.google-apps.presentation');
      hideContextMenu();
      break;

    case 'create-form':
      createFileInFolder(file.id, 'Untitled Form', 'application/vnd.google-apps.form');
      hideContextMenu();
      break;

    case 'create-folder':
      showCreateFolderModal(file.id);
      hideContextMenu();
      break;

    case 'create-folder-direct':
      showCreateFolderModal(file.id);
      break;

    case 'rename':
      showRenameModal(file);
      break;

    case 'move':
      showMoveModal(file);
      break;

    case 'delete':
      showDeleteConfirmation(file);
      break;

    case 'template-meeting':
      // Open Google Docs template
      window.open('https://docs.google.com/document/create?usp=docs_alf&template=meeting_notes', '_blank');
      hideContextMenu();
      break;

    case 'template-project':
      window.open('https://docs.google.com/spreadsheets/create?usp=sheets_alf&template=project_plan', '_blank');
      hideContextMenu();
      break;

    case 'template-report':
      window.open('https://docs.google.com/document/create?usp=docs_alf&template=report', '_blank');
      hideContextMenu();
      break;
  }
}

// ========== CREATE FILE/FOLDER ==========

function createFileInFolder(parentId, defaultName, mimeType) {
  showModal('Create New File', `
    <div class="gdn-form-group">
      <label for="gdn-file-name">File Name:</label>
      <input type="text" id="gdn-file-name" class="gdn-input" value="${escapeHtml(defaultName)}" autocomplete="off" />
    </div>
  `, [
    {
      text: 'Cancel',
      onClick: closeModal
    },
    {
      text: 'Create',
      primary: true,
      onClick: async () => {
        const nameInput = document.getElementById('gdn-file-name');
        const name = nameInput?.value.trim();

        if (!name) {
          showToast('Please enter a file name', 'error');
          return;
        }

        try {
          const response = await sendMessageToBackground({
            action: 'createFile',
            name,
            mimeType,
            parentId
          });

          if (response.success) {
            showToast('File created successfully', 'success');
            closeModal();
            await refreshTree();
          } else {
            throw new Error(response.error || 'Failed to create file');
          }
        } catch (error) {
          console.error('[GDN] Create file error:', error);
          showToast(error.message || 'Failed to create file', 'error');
        }
      }
    }
  ]);

  // Focus and select the input
  setTimeout(() => {
    const input = document.getElementById('gdn-file-name');
    input?.focus();
    input?.select();
  }, 100);
}

function showCreateFolderModal(parentId) {
  showModal('Create New Folder', `
    <div class="gdn-form-group">
      <label for="gdn-folder-name">Folder Name:</label>
      <input type="text" id="gdn-folder-name" class="gdn-input" value="Untitled Folder" autocomplete="off" />
    </div>
  `, [
    {
      text: 'Cancel',
      onClick: closeModal
    },
    {
      text: 'Create',
      primary: true,
      onClick: async () => {
        const nameInput = document.getElementById('gdn-folder-name');
        const name = nameInput?.value.trim();

        if (!name) {
          showToast('Please enter a folder name', 'error');
          return;
        }

        try {
          const response = await sendMessageToBackground({
            action: 'createFolder',
            name,
            parentId
          });

          if (response.success) {
            showToast('Folder created successfully', 'success');
            closeModal();
            await refreshTree();
          } else {
            throw new Error(response.error || 'Failed to create folder');
          }
        } catch (error) {
          console.error('[GDN] Create folder error:', error);
          showToast(error.message || 'Failed to create folder', 'error');
        }
      }
    }
  ]);

  // Focus and select the input
  setTimeout(() => {
    const input = document.getElementById('gdn-folder-name');
    input?.focus();
    input?.select();
  }, 100);
}

// ========== RENAME ==========

function showRenameModal(file) {
  showModal('Rename', `
    <div class="gdn-form-group">
      <label for="gdn-rename-input">New Name:</label>
      <input type="text" id="gdn-rename-input" class="gdn-input" value="${escapeHtml(file.name)}" autocomplete="off" />
    </div>
  `, [
    {
      text: 'Cancel',
      onClick: closeModal
    },
    {
      text: 'Rename',
      primary: true,
      onClick: async () => {
        const nameInput = document.getElementById('gdn-rename-input');
        const newName = nameInput?.value.trim();

        if (!newName) {
          showToast('Please enter a new name', 'error');
          return;
        }

        if (newName === file.name) {
          closeModal();
          return;
        }

        try {
          const response = await sendMessageToBackground({
            action: 'renameFile',
            fileId: file.id,
            newName
          });

          if (response.success) {
            showToast('Renamed successfully', 'success');
            closeModal();
            await refreshTree();
          } else {
            throw new Error(response.error || 'Failed to rename');
          }
        } catch (error) {
          console.error('[GDN] Rename error:', error);
          showToast(error.message || 'Failed to rename', 'error');
        }
      }
    }
  ]);

  // Focus and select the input
  setTimeout(() => {
    const input = document.getElementById('gdn-rename-input');
    input?.focus();
    input?.select();
  }, 100);
}

// ========== DELETE ==========

function showDeleteConfirmation(file) {
  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
  const itemType = isFolder ? 'folder' : 'file';

  showModal('Delete Confirmation', `
    <p>Are you sure you want to delete this ${itemType}?</p>
    <p><strong>${escapeHtml(file.name)}</strong></p>
    <p class="gdn-warning-text">This will move the ${itemType} to trash.</p>
  `, [
    {
      text: 'Cancel',
      onClick: closeModal
    },
    {
      text: 'Delete',
      danger: true,
      onClick: async () => {
        try {
          const response = await sendMessageToBackground({
            action: 'deleteFile',
            fileId: file.id
          });

          if (response.success) {
            showToast('Deleted successfully', 'success');
            closeModal();
            await refreshTree();
          } else {
            throw new Error(response.error || 'Failed to delete');
          }
        } catch (error) {
          console.error('[GDN] Delete error:', error);
          showToast(error.message || 'Failed to delete', 'error');
        }
      }
    }
  ]);
}

// ========== MOVE ==========

function showMoveModal(file) {
  showModal('Move to Folder', `
    <div id="gdn-folder-picker">
      <div class="gdn-spinner">Loading folders...</div>
    </div>
  `, [
    {
      text: 'Cancel',
      onClick: closeModal
    },
    {
      text: 'Move Here',
      primary: true,
      onClick: async () => {
        const selectedFolder = document.querySelector('.gdn-folder-picker-item.selected');
        if (!selectedFolder) {
          showToast('Please select a destination folder', 'error');
          return;
        }

        const newParentId = selectedFolder.dataset.folderId;
        const oldParentId = file.parents && file.parents[0];

        if (newParentId === oldParentId) {
          showToast('File is already in this folder', 'info');
          closeModal();
          return;
        }

        try {
          const response = await sendMessageToBackground({
            action: 'moveFile',
            fileId: file.id,
            newParentId,
            oldParentId
          });

          if (response.success) {
            showToast('Moved successfully', 'success');
            closeModal();
            await refreshTree();
          } else {
            throw new Error(response.error || 'Failed to move');
          }
        } catch (error) {
          console.error('[GDN] Move error:', error);
          showToast(error.message || 'Failed to move', 'error');
        }
      }
    }
  ]);

  // Load folders
  loadFolderPicker();
}

async function loadFolderPicker() {
  const picker = document.getElementById('gdn-folder-picker');
  if (!picker) return;

  try {
    // Load root folder first
    const response = await sendMessageToBackground({
      action: 'listFiles',
      folderId: GDN.state.currentRootId || 'root'
    });

    if (response.success) {
      renderFolderPicker(response.data || [], picker);
    } else {
      throw new Error(response.error || 'Failed to load folders');
    }
  } catch (error) {
    console.error('[GDN] Load folder picker error:', error);
    picker.innerHTML = '<p class="gdn-error-text">Failed to load folders</p>';
  }
}

function renderFolderPicker(files, container, level = 0) {
  const folders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');

  if (level === 0) {
    container.innerHTML = '';

    // Add root folder option
    const rootItem = document.createElement('div');
    rootItem.className = 'gdn-folder-picker-item';
    rootItem.dataset.folderId = GDN.state.currentRootId || 'root';
    rootItem.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
      </svg>
      <span>My Drive</span>
    `;
    rootItem.addEventListener('click', () => {
      document.querySelectorAll('.gdn-folder-picker-item').forEach(item => {
        item.classList.remove('selected');
      });
      rootItem.classList.add('selected');
    });
    container.appendChild(rootItem);
  }

  folders.forEach(folder => {
    const item = document.createElement('div');
    item.className = 'gdn-folder-picker-item';
    item.style.paddingLeft = `${20 + (level * 20)}px`;
    item.dataset.folderId = folder.id;

    item.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
      </svg>
      <span>${escapeHtml(folder.name)}</span>
    `;

    item.addEventListener('click', () => {
      document.querySelectorAll('.gdn-folder-picker-item').forEach(i => {
        i.classList.remove('selected');
      });
      item.classList.add('selected');
    });

    container.appendChild(item);
  });
}

// ========== MODAL HELPER ==========

function showModal(title, bodyHTML, buttons = []) {
  if (!GDN.elements.modal || !GDN.elements.modalOverlay) return;

  GDN.elements.modalTitle.textContent = title;
  GDN.elements.modalBody.innerHTML = bodyHTML;

  // Render buttons
  GDN.elements.modalFooter.innerHTML = '';
  buttons.forEach(button => {
    const btn = document.createElement('button');
    btn.className = `gdn-btn ${button.primary ? 'gdn-btn-primary' : ''} ${button.danger ? 'gdn-btn-danger' : ''}`;
    btn.textContent = button.text;
    btn.addEventListener('click', button.onClick);
    GDN.elements.modalFooter.appendChild(btn);
  });

  GDN.elements.modalOverlay.classList.add('gdn-visible');
}

// ========== SETTINGS ==========

function showSettingsModal() {
  // Load current settings first
  sendMessageToBackground({ action: 'getSettings' }).then(response => {
    const settings = response.data || { startupMode: 'manual', darkMode: false };

    showModal('Settings', `
      <div class="gdn-settings-section">
        <div class="gdn-setting-item">
          <label class="gdn-setting-label">
            <span>Startup Mode</span>
            <select id="gdn-startup-mode" class="gdn-select">
              <option value="manual" ${settings.startupMode === 'manual' ? 'selected' : ''}>Manual - Click to open</option>
              <option value="auto" ${settings.startupMode === 'auto' ? 'selected' : ''}>Auto on Google Domains</option>
            </select>
          </label>
          <div class="gdn-setting-help">Auto mode loads minimized on Google Drive, Docs, Sheets, Slides</div>
        </div>
        <div class="gdn-setting-item">
          <label class="gdn-setting-label">
            <span>Dark Mode</span>
            <input type="checkbox" id="gdn-dark-mode" class="gdn-toggle" ${settings.darkMode ? 'checked' : ''} />
          </label>
        </div>
      </div>
    `, [
      { text: 'Cancel', onClick: closeModal },
      { text: 'Save', primary: true, onClick: saveSettingsFromModal }
    ]);
  });
}

async function saveSettingsFromModal() {
  const startupMode = document.getElementById('gdn-startup-mode').value;
  const darkMode = document.getElementById('gdn-dark-mode').checked;

  await sendMessageToBackground({
    action: 'saveSettings',
    settings: { startupMode, darkMode }
  });

  // Apply dark mode immediately
  applyDarkMode(darkMode);

  closeModal();
  showToast('Settings saved', 'success');
}

function applyDarkMode(enabled) {
  if (enabled) {
    GDN.elements.root?.classList.add('gdn-dark-mode');
  } else {
    GDN.elements.root?.classList.remove('gdn-dark-mode');
  }
}

// ========== TREE REFRESH ==========

async function refreshTree() {
  GDN.state.folderCache.clear();
  await sendMessageToBackground({ action: 'clearCache' });

  // Reload based on current view
  if (typeof loadInitialData === 'function') {
    await loadInitialData();
  } else if (typeof loadCurrentRoot === 'function') {
    await loadCurrentRoot();
  }
}

console.log('[GDN] Content script loaded');
