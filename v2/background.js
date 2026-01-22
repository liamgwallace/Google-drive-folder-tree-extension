/**
 * Google Drive Navigator V2 - Background Service Worker
 * Handles API calls, per-tab state management, and child tab inheritance
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

// Per-tab state storage
const tabStates = new Map();
const tabParentRelationships = new Map(); // childTabId -> parentTabId

// Folder cache
const folderCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ========== TAB STATE MANAGEMENT ==========

/**
 * Get state for a specific tab
 */
function getTabState(tabId) {
  if (!tabStates.has(tabId)) {
    // Check if this tab has a parent (child tab inheritance)
    const parentId = tabParentRelationships.get(tabId);
    if (parentId && tabStates.has(parentId)) {
      // Inherit parent's state
      const parentState = tabStates.get(parentId);
      const inheritedState = {
        isActive: parentState.isActive,
        sidebarExpanded: false,
        parentTabId: parentId
      };
      tabStates.set(tabId, inheritedState);
      return inheritedState;
    }

    // Default state: OFF
    const defaultState = {
      isActive: false,
      sidebarExpanded: false
    };
    tabStates.set(tabId, defaultState);
    return defaultState;
  }

  return tabStates.get(tabId);
}

/**
 * Set state for a specific tab
 */
function setTabState(tabId, state) {
  const currentState = getTabState(tabId);
  tabStates.set(tabId, { ...currentState, ...state });
}

/**
 * Clean up state when tab is closed
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
  tabParentRelationships.delete(tabId);
});

// ========== CHILD TAB INHERITANCE ==========

/**
 * Track when a tab is created from another tab (Ctrl+Click, middle click, etc.)
 */
chrome.tabs.onCreated.addListener((tab) => {
  // If tab has an openerTabId, it's a child tab
  if (tab.openerTabId) {
    tabParentRelationships.set(tab.id, tab.openerTabId);
    console.log(`[GDN] Tab ${tab.id} created from parent ${tab.openerTabId}`);

    // Inherit state will happen on getTabState call
  }
});

/**
 * Track navigation to detect manual URL entry vs link click
 */
chrome.webNavigation.onCommitted.addListener((details) => {
  // If transitionType is 'typed' or 'generated', user manually navigated
  // In this case, don't inherit - start fresh
  if (details.transitionType === 'typed' || details.transitionType === 'generated' || details.transitionType === 'auto_bookmark') {
    // Clear parent relationship if it exists
    tabParentRelationships.delete(details.tabId);
  }
});

// ========== AUTHENTICATION ==========

async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (token) {
        resolve(token);
      } else {
        reject(new Error('No token available'));
      }
    });
  });
}

async function signIn() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (token) {
        resolve(token);
      } else {
        reject(new Error('Authentication failed'));
      }
    });
  });
}

async function checkAuth() {
  try {
    const token = await getAuthToken();
    console.log('[GDN] Auth check: token exists =', !!token);
    return true;
  } catch (error) {
    console.log('[GDN] Auth check: no token -', error.message);
    return false;
  }
}

// ========== API CALLS ==========

async function makeApiRequest(url, options = {}) {
  try {
    const token = await getAuthToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Token expired, clear and retry
      await new Promise((resolve) => {
        chrome.identity.removeCachedAuthToken({ token }, resolve);
      });
      throw new Error('Token expired');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[GDN] API request error:', error);
    throw error;
  }
}

async function listFiles(folderId = 'root', options = {}) {
  const cacheKey = `${folderId}-${JSON.stringify(options)}`;

  // Check cache
  if (!options.skipCache && folderCache.has(cacheKey)) {
    const cached = folderCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    } else {
      folderCache.delete(cacheKey);
    }
  }

  const query = `'${folderId}' in parents and trashed=false`;
  const fields = 'files(id,name,mimeType,iconLink,webViewLink,modifiedTime,parents)';

  const params = new URLSearchParams({
    q: query,
    fields: fields,
    pageSize: '100',
    orderBy: 'folder,name',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true'
  });

  const url = `${DRIVE_API_BASE}/files?${params}`;
  const response = await makeApiRequest(url);

  const files = response.files || [];

  // Cache the result
  folderCache.set(cacheKey, {
    data: files,
    timestamp: Date.now()
  });

  return files;
}

async function searchFiles(searchTerm) {
  const query = `name contains '${searchTerm.replace(/'/g, "\\'")}' and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,mimeType,iconLink,webViewLink)',
    pageSize: '20',
    orderBy: 'recency desc',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true'
  });

  const url = `${DRIVE_API_BASE}/files?${params}`;
  const response = await makeApiRequest(url);
  return response.files || [];
}

async function getRecentFiles() {
  const cacheKey = 'recent-files';

  // Check cache
  if (folderCache.has(cacheKey)) {
    const cached = folderCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    } else {
      folderCache.delete(cacheKey);
    }
  }

  const query = 'trashed=false';
  const fields = 'files(id,name,mimeType,iconLink,webViewLink,modifiedTime,parents)';

  const params = new URLSearchParams({
    q: query,
    fields: fields,
    pageSize: '20',
    orderBy: 'recency desc',
    spaces: 'drive',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true'
  });

  const url = `${DRIVE_API_BASE}/files?${params}`;
  const response = await makeApiRequest(url);

  const files = response.files || [];

  // Cache the result
  folderCache.set(cacheKey, {
    data: files,
    timestamp: Date.now()
  });

  return files;
}

async function deleteFile(fileId) {
  const params = new URLSearchParams({
    supportsAllDrives: 'true'
  });

  const url = `${DRIVE_API_BASE}/files/${fileId}?${params}`;

  const token = await getAuthToken();
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    await new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, resolve);
    });
    throw new Error('Token expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Delete failed: ${response.status}`);
  }

  // DELETE returns empty body (204 No Content), don't try to parse JSON
  clearCache();
  return { success: true };
}

async function moveFile(fileId, newParentId, oldParentId) {
  const params = new URLSearchParams({
    addParents: newParentId,
    supportsAllDrives: 'true',
    ...(oldParentId && { removeParents: oldParentId })
  });

  const url = `${DRIVE_API_BASE}/files/${fileId}?${params}`;
  const response = await makeApiRequest(url, { method: 'PATCH' });
  clearCache();
  return response;
}

async function renameFile(fileId, newName) {
  const params = new URLSearchParams({
    supportsAllDrives: 'true'
  });

  const url = `${DRIVE_API_BASE}/files/${fileId}?${params}`;
  const response = await makeApiRequest(url, {
    method: 'PATCH',
    body: JSON.stringify({ name: newName })
  });
  clearCache();
  return response;
}

async function createFile(name, mimeType, parentId = 'root') {
  const metadata = {
    name,
    mimeType,
    parents: [parentId]
  };

  const params = new URLSearchParams({
    supportsAllDrives: 'true'
  });

  const url = `${DRIVE_API_BASE}/files?${params}`;
  const response = await makeApiRequest(url, {
    method: 'POST',
    body: JSON.stringify(metadata)
  });
  clearCache();
  return response;
}

async function createFolder(name, parentId = 'root') {
  return await createFile(name, 'application/vnd.google-apps.folder', parentId);
}

async function getFolderMetadata(folderId) {
  const params = new URLSearchParams({
    fields: 'id,name,mimeType,webViewLink',
    supportsAllDrives: 'true'
  });

  const url = `${DRIVE_API_BASE}/files/${folderId}?${params}`;
  const response = await makeApiRequest(url);

  // Validate it's a folder
  if (response.mimeType !== 'application/vnd.google-apps.folder' && folderId !== 'root') {
    throw new Error('The provided ID is not a folder');
  }

  return response;
}

function clearCache() {
  folderCache.clear();
}

// ========== ROOT FOLDERS STORAGE ==========

async function getRootFolders() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['rootFolders'], (result) => {
      const rootFolders = result.rootFolders || [
        {
          id: 'root',
          name: 'My Drive',
          url: 'https://drive.google.com/drive/my-drive'
        }
      ];
      resolve(rootFolders);
    });
  });
}

async function saveRootFolders(rootFolders) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ rootFolders }, () => {
      resolve({ success: true });
    });
  });
}

async function addRootFolder(rootFolder) {
  const rootFolders = await getRootFolders();

  // Check if already exists
  if (rootFolders.some(r => r.id === rootFolder.id)) {
    throw new Error('This folder is already in your root folders list');
  }

  rootFolders.push(rootFolder);
  await saveRootFolders(rootFolders);
  return rootFolders;
}

async function deleteRootFolder(folderId) {
  const rootFolders = await getRootFolders();
  const filtered = rootFolders.filter(r => r.id !== folderId);

  // Prevent deleting all roots
  if (filtered.length === 0) {
    throw new Error('Cannot delete the last root folder');
  }

  await saveRootFolders(filtered);
  return filtered;
}

async function getCurrentRoot() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['currentRootId'], (result) => {
      resolve(result.currentRootId || 'root');
    });
  });
}

async function setCurrentRoot(rootId) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ currentRootId: rootId }, () => {
      resolve({ success: true });
    });
  });
}

// ========== UI STATE PERSISTENCE ==========

async function getUIState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['uiState'], (result) => {
      resolve(result.uiState || {
        sidebarExpanded: false,
        expandedFolders: [],
        lastRootId: 'root'
      });
    });
  });
}

async function saveUIState(state) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ uiState: state }, resolve);
  });
}

// ========== SETTINGS STORAGE ==========

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve(result.settings || {
        startupMode: 'manual',  // 'manual' or 'auto'
        darkMode: false,
        autoLoadDomains: ['drive.google.com', 'docs.google.com', 'sheets.google.com', 'slides.google.com']
      });
    });
  });
}

async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, resolve);
  });
}

// ========== CONTEXT MENU ==========

/**
 * Create context menu items
 */
function createContextMenus() {
  chrome.contextMenus.create({
    id: 'add-drive-folder-root',
    title: 'Add to Drive Navigator as Root Folder',
    contexts: ['link'],
    targetUrlPatterns: [
      'https://drive.google.com/drive/folders/*',
      'https://drive.google.com/drive/u/*/folders/*'
    ]
  });

  console.log('[GDN] Context menu created');
}

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'add-drive-folder-root') {
    try {
      console.log('[GDN] Adding folder from context menu:', info.linkUrl);

      // Check if user is authenticated
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        // Try to sign in
        try {
          await signIn();
        } catch (authError) {
          throw new Error('Please sign in to use this feature');
        }
      }

      // Extract folder ID from URL
      const match = info.linkUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (!match) {
        throw new Error('Invalid Google Drive folder URL');
      }

      const folderId = match[1];

      // Get folder metadata to validate and get name
      const metadata = await getFolderMetadata(folderId);

      // Create root folder object
      const rootFolder = {
        id: folderId,
        name: metadata.name,
        url: info.linkUrl
      };

      // Add to root folders
      await addRootFolder(rootFolder);

      // Activate extension and open sidebar if not already active
      chrome.tabs.sendMessage(tab.id, {
        action: 'activateAndShowRoot',
        folder: rootFolder
      }).catch(err => {
        console.log('[GDN] Could not send activation message to tab:', err);
      });

      // Send success notification
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: `Added "${metadata.name}" to root folders`,
        type: 'success'
      }).catch(err => {
        console.log('[GDN] Could not send notification to tab:', err);
      });

      console.log('[GDN] Folder added successfully:', metadata.name);
    } catch (error) {
      console.error('[GDN] Failed to add folder:', error);

      // Send error notification
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: error.message,
        type: 'error'
      }).catch(err => {
        console.log('[GDN] Could not send error to tab:', err);
      });
    }
  }
});

// ========== MESSAGE HANDLER ==========

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      let response;

      switch (request.action) {
        // Tab state management
        case 'getTabState':
          response = getTabState(sender.tab?.id);
          break;

        case 'setTabState':
          if (sender.tab?.id) {
            setTabState(sender.tab.id, request.state);
            response = { success: true };
          } else {
            throw new Error('No tab ID available');
          }
          break;

        // Authentication
        case 'checkAuth':
          const authenticated = await checkAuth();
          response = { authenticated };
          break;

        case 'signIn':
          await signIn();
          response = { success: true };
          break;

        // Drive API operations
        case 'listFiles':
          response = await listFiles(request.folderId, request.options || {});
          break;

        case 'searchFiles':
          response = await searchFiles(request.searchTerm);
          break;

        case 'getRecentFiles':
          response = await getRecentFiles();
          break;

        case 'deleteFile':
          response = await deleteFile(request.fileId);
          break;

        case 'moveFile':
          response = await moveFile(request.fileId, request.newParentId, request.oldParentId);
          break;

        case 'renameFile':
          response = await renameFile(request.fileId, request.newName);
          break;

        case 'createFile':
          response = await createFile(request.name, request.mimeType, request.parentId);
          break;

        case 'createFolder':
          response = await createFolder(request.name, request.parentId);
          break;

        case 'clearCache':
          clearCache();
          response = { success: true };
          break;

        // Root folders management
        case 'getRootFolders':
          response = await getRootFolders();
          break;

        case 'addRootFolder':
          response = await addRootFolder(request.rootFolder);
          break;

        case 'deleteRootFolder':
          response = await deleteRootFolder(request.folderId);
          break;

        case 'getCurrentRoot':
          response = await getCurrentRoot();
          break;

        case 'setCurrentRoot':
          await setCurrentRoot(request.rootId);
          response = { success: true };
          break;

        case 'getUIState':
          response = await getUIState();
          break;

        case 'saveUIState':
          await saveUIState(request.state);
          response = { success: true };
          break;

        case 'getFolderMetadata':
          response = await getFolderMetadata(request.folderId);
          break;

        case 'getSettings':
          response = await getSettings();
          break;

        case 'saveSettings':
          await saveSettings(request.settings);
          response = { success: true };
          break;

        default:
          throw new Error(`Unknown action: ${request.action}`);
      }

      sendResponse({ success: true, data: response });
    } catch (error) {
      console.error('[GDN] Background error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Async response
});

// ========== EXTENSION INSTALLATION ==========

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[GDN] Extension installed');
    createContextMenus();
  } else if (details.reason === 'update') {
    console.log('[GDN] Extension updated');
    clearCache();
    createContextMenus();
  }
});

// ========== BROWSER ACTION ==========

// Check if URL is restricted (cannot inject scripts)
function isRestrictedUrl(url) {
  if (!url) return true;

  const restrictedProtocols = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'data:',
    'file://',
    'view-source:'
  ];

  const restrictedDomains = [
    'chrome.google.com/webstore',
    'chromewebstore.google.com',
    'microsoftedge.microsoft.com/addons'
  ];

  if (restrictedProtocols.some(protocol => url.startsWith(protocol))) {
    return true;
  }

  if (restrictedDomains.some(domain => url.includes(domain))) {
    return true;
  }

  return false;
}

chrome.action.onClicked.addListener(async (tab) => {
  // Check if page is restricted
  if (isRestrictedUrl(tab.url)) {
    console.log('[GDN] Cannot run on restricted pages:', tab.url);
    return;
  }

  // Toggle extension for current tab
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleExtension' });
  } catch (error) {
    // Content script not loaded - inject it
    console.log('[GDN] Content script not loaded, injecting...');
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content.css']
      });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      console.log('[GDN] Content script injected successfully');
    } catch (injectError) {
      console.error('[GDN] Failed to inject content script:', injectError);
    }
  }
});

console.log('[GDN] Background service worker initialized');
