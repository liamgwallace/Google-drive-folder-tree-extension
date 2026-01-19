/**
 * Background Service Worker
 * Handles all Google Drive API calls and communication with sidebar
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

// Cache for folder contents (5 minute TTL)
const folderCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get authentication token
 */
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

/**
 * Make an authenticated API request
 */
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
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * List files and folders
 */
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

  const query = buildQuery(folderId, options);
  const fields = 'files(id,name,mimeType,iconLink,webViewLink,modifiedTime,size,parents,starred),nextPageToken';

  let allFiles = [];
  let pageToken = null;

  do {
    const params = new URLSearchParams({
      q: query,
      fields: fields,
      pageSize: options.pageSize || '100',
      orderBy: options.orderBy || 'folder,name',
      ...(pageToken && { pageToken })
    });

    const url = `${DRIVE_API_BASE}/files?${params}`;
    const response = await makeApiRequest(url);

    allFiles = allFiles.concat(response.files || []);
    pageToken = response.nextPageToken;

  } while (pageToken && !options.singlePage);

  // Cache the result
  folderCache.set(cacheKey, {
    data: allFiles,
    timestamp: Date.now()
  });

  return allFiles;
}

/**
 * Build query string for Drive API
 */
function buildQuery(folderId, options) {
  let query = `'${folderId}' in parents and trashed=false`;

  if (options.foldersOnly) {
    query += ` and mimeType='application/vnd.google-apps.folder'`;
  }

  if (options.filesOnly) {
    query += ` and mimeType!='application/vnd.google-apps.folder'`;
  }

  if (options.searchTerm) {
    query += ` and name contains '${options.searchTerm.replace(/'/g, "\\'")}'`;
  }

  if (options.mimeType) {
    query += ` and mimeType='${options.mimeType}'`;
  }

  return query;
}

/**
 * Get file metadata
 */
async function getFile(fileId) {
  const fields = 'id,name,mimeType,iconLink,webViewLink,modifiedTime,size,parents,starred,description';
  const url = `${DRIVE_API_BASE}/files/${fileId}?fields=${fields}`;
  return await makeApiRequest(url);
}

/**
 * Search files globally
 */
async function searchFiles(searchTerm, options = {}) {
  let query = `name contains '${searchTerm.replace(/'/g, "\\'")}' and trashed=false`;

  if (options.foldersOnly) {
    query += ` and mimeType='application/vnd.google-apps.folder'`;
  }

  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,mimeType,iconLink,webViewLink,parents)',
    pageSize: options.pageSize || '50',
    orderBy: 'recency desc'
  });

  const url = `${DRIVE_API_BASE}/files?${params}`;
  const response = await makeApiRequest(url);
  return response.files || [];
}

/**
 * Get recent files
 */
async function getRecentFiles(limit = 10) {
  const params = new URLSearchParams({
    q: "trashed=false",
    fields: 'files(id,name,mimeType,iconLink,webViewLink,modifiedTime)',
    pageSize: limit.toString(),
    orderBy: 'viewedByMeTime desc'
  });

  const url = `${DRIVE_API_BASE}/files?${params}`;
  const response = await makeApiRequest(url);
  return response.files || [];
}

/**
 * Delete a file or folder
 */
async function deleteFile(fileId) {
  const url = `${DRIVE_API_BASE}/files/${fileId}`;
  await makeApiRequest(url, { method: 'DELETE' });
  clearRelatedCache(fileId);
  return { success: true };
}

/**
 * Move file(s) to a different folder
 */
async function moveFile(fileId, newParentId, oldParentId) {
  const params = new URLSearchParams({
    addParents: newParentId,
    ...(oldParentId && { removeParents: oldParentId })
  });

  const url = `${DRIVE_API_BASE}/files/${fileId}?${params}`;
  const response = await makeApiRequest(url, { method: 'PATCH' });

  clearRelatedCache(fileId);
  clearRelatedCache(newParentId);
  if (oldParentId) clearRelatedCache(oldParentId);

  return response;
}

/**
 * Rename a file or folder
 */
async function renameFile(fileId, newName) {
  const url = `${DRIVE_API_BASE}/files/${fileId}`;
  const response = await makeApiRequest(url, {
    method: 'PATCH',
    body: JSON.stringify({ name: newName })
  });

  clearRelatedCache(fileId);
  return response;
}

/**
 * Create a new file
 */
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

  clearRelatedCache(parentId);
  return response;
}

/**
 * Copy a file (for templates)
 */
async function copyFile(fileId, name, parentId = 'root') {
  const metadata = {
    name,
    parents: [parentId]
  };

  const url = `${DRIVE_API_BASE}/files/${fileId}/copy`;
  const response = await makeApiRequest(url, {
    method: 'POST',
    body: JSON.stringify(metadata)
  });

  clearRelatedCache(parentId);
  return response;
}

/**
 * Create a new folder
 */
async function createFolder(name, parentId = 'root') {
  return await createFile(name, 'application/vnd.google-apps.folder', parentId);
}

/**
 * Get shared drives
 */
async function getSharedDrives() {
  const url = `${DRIVE_API_BASE}/drives?pageSize=100`;
  const response = await makeApiRequest(url);
  return response.drives || [];
}

/**
 * Star/unstar a file
 */
async function toggleStar(fileId, starred) {
  const url = `${DRIVE_API_BASE}/files/${fileId}`;
  const response = await makeApiRequest(url, {
    method: 'PATCH',
    body: JSON.stringify({ starred })
  });

  clearRelatedCache(fileId);
  return response;
}

/**
 * Batch delete files
 */
async function batchDeleteFiles(fileIds) {
  const results = await Promise.allSettled(
    fileIds.map(id => deleteFile(id))
  );

  return {
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    total: fileIds.length
  };
}

/**
 * Batch move files
 */
async function batchMoveFiles(fileIds, newParentId, oldParentId) {
  const results = await Promise.allSettled(
    fileIds.map(id => moveFile(id, newParentId, oldParentId))
  );

  return {
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    total: fileIds.length
  };
}

/**
 * Clear cache for a specific file and its parents
 */
function clearRelatedCache(fileId) {
  // Clear all cache entries that might be affected
  const keysToDelete = [];
  for (const key of folderCache.keys()) {
    if (key.includes(fileId)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => folderCache.delete(key));
}

/**
 * Clear all cache
 */
function clearCache() {
  folderCache.clear();
}

/**
 * Get file path (breadcrumb)
 */
async function getFilePath(fileId) {
  const path = [];
  let currentId = fileId;

  try {
    while (currentId && currentId !== 'root') {
      const file = await getFile(currentId);
      path.unshift({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType
      });

      // Get parent
      if (file.parents && file.parents.length > 0) {
        currentId = file.parents[0];
      } else {
        break;
      }
    }

    // Add root
    path.unshift({ id: 'root', name: 'My Drive', mimeType: 'application/vnd.google-apps.folder' });

    return path;
  } catch (error) {
    console.error('Error getting file path:', error);
    return [];
  }
}

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle async requests
  (async () => {
    try {
      let response;

      switch (request.action) {
        case 'listFiles':
          response = await listFiles(request.folderId, request.options || {});
          break;

        case 'getFile':
          response = await getFile(request.fileId);
          break;

        case 'searchFiles':
          response = await searchFiles(request.searchTerm, request.options || {});
          break;

        case 'getRecentFiles':
          response = await getRecentFiles(request.limit);
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

        case 'copyFile':
          response = await copyFile(request.fileId, request.name, request.parentId);
          break;

        case 'createFolder':
          response = await createFolder(request.name, request.parentId);
          break;

        case 'getSharedDrives':
          response = await getSharedDrives();
          break;

        case 'toggleStar':
          response = await toggleStar(request.fileId, request.starred);
          break;

        case 'batchDeleteFiles':
          response = await batchDeleteFiles(request.fileIds);
          break;

        case 'batchMoveFiles':
          response = await batchMoveFiles(request.fileIds, request.newParentId, request.oldParentId);
          break;

        case 'getFilePath':
          response = await getFilePath(request.fileId);
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
      console.error('Background error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Return true to indicate we'll send response asynchronously
  return true;
});

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Open welcome page or setup instructions
  } else if (details.reason === 'update') {
    console.log('Extension updated');
    // Clear cache on update
    clearCache();
  }
});

/**
 * Enable side panel on action click
 */
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting panel behavior:', error));

console.log('Background service worker initialized');
