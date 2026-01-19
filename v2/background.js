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
    await getAuthToken();
    return true;
  } catch (error) {
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
    orderBy: 'folder,name'
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
    orderBy: 'recency desc'
  });

  const url = `${DRIVE_API_BASE}/files?${params}`;
  const response = await makeApiRequest(url);
  return response.files || [];
}

async function deleteFile(fileId) {
  const url = `${DRIVE_API_BASE}/files/${fileId}`;
  await makeApiRequest(url, { method: 'DELETE' });
  clearCache();
  return { success: true };
}

async function moveFile(fileId, newParentId, oldParentId) {
  const params = new URLSearchParams({
    addParents: newParentId,
    ...(oldParentId && { removeParents: oldParentId })
  });

  const url = `${DRIVE_API_BASE}/files/${fileId}?${params}`;
  const response = await makeApiRequest(url, { method: 'PATCH' });
  clearCache();
  return response;
}

async function renameFile(fileId, newName) {
  const url = `${DRIVE_API_BASE}/files/${fileId}`;
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

  const url = `${DRIVE_API_BASE}/files`;
  const response = await makeApiRequest(url, {
    method: 'POST',
    body: JSON.stringify(metadata)
  });
  clearCache();
  return response;
}

function clearCache() {
  folderCache.clear();
}

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

        case 'clearCache':
          clearCache();
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
  } else if (details.reason === 'update') {
    console.log('[GDN] Extension updated');
    clearCache();
  }
});

// ========== BROWSER ACTION ==========

chrome.action.onClicked.addListener(async (tab) => {
  // Toggle extension for current tab
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleExtension' });
  } catch (error) {
    console.error('[GDN] Failed to toggle extension:', error);
  }
});

console.log('[GDN] Background service worker initialized');
