/**
 * Sidebar Main Application
 * Handles UI, tree rendering, and user interactions
 */

// ========== STATE MANAGEMENT ==========

const state = {
  expandedFolders: new Set(['root']),
  selectedFiles: new Set(),
  pinnedFolders: new Set(),
  recentFiles: [],
  folderCache: new Map(),
  currentContextItem: null,
  searchTerm: '',
  isLoading: false
};

// ========== DOM ELEMENTS ==========

const elements = {
  authScreen: null,
  mainScreen: null,
  signInBtn: null,
  signOutBtn: null,
  authError: null,
  treeContainer: null,
  recentFilesContainer: null,
  pinnedFoldersContainer: null,
  searchInput: null,
  clearSearchBtn: null,
  refreshBtn: null,
  newFileBtn: null,
  selectionActions: null,
  selectionCount: null,
  clearSelectionBtn: null,
  deleteSelectedBtn: null,
  moveSelectedBtn: null,
  contextMenu: null,
  modalOverlay: null,
  modal: null,
  modalTitle: null,
  modalBody: null,
  modalFooter: null,
  modalCloseBtn: null,
  modalCancelBtn: null,
  modalConfirmBtn: null,
  toastContainer: null,
  recentSection: null,
  recentHeader: null,
  pinnedSection: null,
  pinnedHeader: null
};

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', async () => {
  initializeElements();
  initializeEventListeners();
  await checkAuthentication();
  loadPinnedFolders();
});

function initializeElements() {
  elements.authScreen = document.getElementById('auth-screen');
  elements.mainScreen = document.getElementById('main-screen');
  elements.signInBtn = document.getElementById('sign-in-btn');
  elements.signOutBtn = document.getElementById('sign-out-btn');
  elements.authError = document.getElementById('auth-error');
  elements.treeContainer = document.getElementById('tree-container');
  elements.recentFilesContainer = document.getElementById('recent-files-container');
  elements.pinnedFoldersContainer = document.getElementById('pinned-folders-container');
  elements.searchInput = document.getElementById('search-input');
  elements.clearSearchBtn = document.getElementById('clear-search-btn');
  elements.refreshBtn = document.getElementById('refresh-btn');
  elements.newFileBtn = document.getElementById('new-file-btn');
  elements.selectionActions = document.getElementById('selection-actions');
  elements.selectionCount = document.getElementById('selection-count');
  elements.clearSelectionBtn = document.getElementById('clear-selection-btn');
  elements.deleteSelectedBtn = document.getElementById('delete-selected-btn');
  elements.moveSelectedBtn = document.getElementById('move-selected-btn');
  elements.contextMenu = document.getElementById('context-menu');
  elements.modalOverlay = document.getElementById('modal-overlay');
  elements.modal = document.getElementById('modal');
  elements.modalTitle = document.getElementById('modal-title');
  elements.modalBody = document.getElementById('modal-body');
  elements.modalFooter = document.getElementById('modal-footer');
  elements.modalCloseBtn = document.getElementById('modal-close-btn');
  elements.modalCancelBtn = document.getElementById('modal-cancel-btn');
  elements.modalConfirmBtn = document.getElementById('modal-confirm-btn');
  elements.toastContainer = document.getElementById('toast-container');
  elements.recentSection = document.getElementById('recent-section');
  elements.recentHeader = document.getElementById('recent-header');
  elements.pinnedSection = document.getElementById('pinned-section');
  elements.pinnedHeader = document.getElementById('pinned-header');
}

function initializeEventListeners() {
  // Authentication
  elements.signInBtn?.addEventListener('click', handleSignIn);
  elements.signOutBtn?.addEventListener('click', handleSignOut);

  // Header controls
  elements.refreshBtn?.addEventListener('click', handleRefresh);
  elements.newFileBtn?.addEventListener('click', handleNewFile);

  // Search
  elements.searchInput?.addEventListener('input', handleSearch);
  elements.clearSearchBtn?.addEventListener('click', clearSearch);

  // Selection actions
  elements.clearSelectionBtn?.addEventListener('click', clearSelection);
  elements.deleteSelectedBtn?.addEventListener('click', handleDeleteSelected);
  elements.moveSelectedBtn?.addEventListener('click', handleMoveSelected);

  // Modal
  elements.modalCloseBtn?.addEventListener('click', closeModal);
  elements.modalCancelBtn?.addEventListener('click', closeModal);
  elements.modalOverlay?.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) closeModal();
  });

  // Section headers (collapsible)
  elements.recentHeader?.addEventListener('click', () => toggleSection('recent'));
  elements.pinnedHeader?.addEventListener('click', () => toggleSection('pinned'));

  // Global click handler to close context menu
  document.addEventListener('click', () => hideContextMenu());

  // Prevent context menu from closing when clicked
  elements.contextMenu?.addEventListener('click', (e) => e.stopPropagation());

  // Context menu items
  document.getElementById('context-open')?.addEventListener('click', () => handleContextAction('open'));
  document.getElementById('context-open-new-tab')?.addEventListener('click', () => handleContextAction('open-new-tab'));
  document.getElementById('context-rename')?.addEventListener('click', () => handleContextAction('rename'));
  document.getElementById('context-move')?.addEventListener('click', () => handleContextAction('move'));
  document.getElementById('context-pin')?.addEventListener('click', () => handleContextAction('pin'));
  document.getElementById('context-delete')?.addEventListener('click', () => handleContextAction('delete'));
}

// ========== AUTHENTICATION ==========

async function checkAuthentication() {
  try {
    const isAuthenticated = await auth.checkAuth();
    if (isAuthenticated) {
      showMainScreen();
      await loadInitialData();
    } else {
      showAuthScreen();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    showAuthScreen();
  }
}

async function handleSignIn() {
  try {
    elements.authError.textContent = '';
    elements.authError.classList.add('hidden');
    elements.signInBtn.disabled = true;
    elements.signInBtn.textContent = 'Signing in...';

    await auth.signIn();
    showMainScreen();
    await loadInitialData();
  } catch (error) {
    console.error('Sign in failed:', error);
    elements.authError.textContent = auth.getErrorMessage(error);
    elements.authError.classList.remove('hidden');
  } finally {
    elements.signInBtn.disabled = false;
    elements.signInBtn.textContent = 'Sign In with Google';
  }
}

async function handleSignOut() {
  try {
    await auth.signOut();
    state.expandedFolders.clear();
    state.selectedFiles.clear();
    state.folderCache.clear();
    showAuthScreen();
  } catch (error) {
    console.error('Sign out failed:', error);
    showToast('Sign out failed', 'error');
  }
}

function showAuthScreen() {
  elements.authScreen?.classList.remove('hidden');
  elements.mainScreen?.classList.add('hidden');
}

function showMainScreen() {
  elements.authScreen?.classList.add('hidden');
  elements.mainScreen?.classList.remove('hidden');
}

// ========== DATA LOADING ==========

async function loadInitialData() {
  try {
    setLoading(true);
    await Promise.all([
      loadRecentFiles(),
      loadFolderTree('root')
    ]);
  } catch (error) {
    console.error('Failed to load initial data:', error);
    showToast('Failed to load Drive data', 'error');
  } finally {
    setLoading(false);
  }
}

async function loadRecentFiles() {
  try {
    const response = await sendMessage({ action: 'getRecentFiles', limit: 10 });
    if (response.success) {
      state.recentFiles = response.data;
      renderRecentFiles();
    }
  } catch (error) {
    console.error('Failed to load recent files:', error);
  }
}

async function loadFolderTree(folderId = 'root') {
  try {
    const response = await sendMessage({
      action: 'listFiles',
      folderId,
      options: { orderBy: 'folder,name' }
    });

    if (response.success) {
      state.folderCache.set(folderId, response.data);
      renderTree();
    }
  } catch (error) {
    console.error('Failed to load folder tree:', error);
    showToast('Failed to load folders', 'error');
  }
}

async function loadFolder(folderId) {
  if (state.folderCache.has(folderId)) {
    return state.folderCache.get(folderId);
  }

  try {
    const response = await sendMessage({
      action: 'listFiles',
      folderId,
      options: { orderBy: 'folder,name' }
    });

    if (response.success) {
      state.folderCache.set(folderId, response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Failed to load folder:', error);
    throw error;
  }
}

// ========== RENDERING ==========

function renderRecentFiles() {
  if (!elements.recentFilesContainer) return;

  elements.recentFilesContainer.innerHTML = '';

  if (state.recentFiles.length === 0) {
    elements.recentFilesContainer.innerHTML = '<div class="spinner">No recent files</div>';
    return;
  }

  state.recentFiles.forEach(file => {
    const item = createRecentFileElement(file);
    elements.recentFilesContainer.appendChild(item);
  });
}

function createRecentFileElement(file) {
  const div = document.createElement('div');
  div.className = 'recent-item';
  div.dataset.fileId = file.id;

  const icon = document.createElement('img');
  icon.src = file.iconLink || getDefaultIcon(file.mimeType);
  icon.alt = '';

  const name = document.createElement('span');
  name.className = 'recent-item-name';
  name.textContent = file.name;
  name.title = file.name;

  div.appendChild(icon);
  div.appendChild(name);

  div.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey) {
      openFile(file.webViewLink, true);
    } else {
      openFile(file.webViewLink, false);
    }
  });

  return div;
}

async function renderTree() {
  if (!elements.treeContainer) return;

  elements.treeContainer.innerHTML = '';

  // Render root level
  await renderFolderContents('root', elements.treeContainer, 0);
}

async function renderFolderContents(folderId, container, level) {
  const files = state.folderCache.get(folderId);

  if (!files) {
    await loadFolder(folderId);
    return renderFolderContents(folderId, container, level);
  }

  // Apply search filter if active
  const filteredFiles = state.searchTerm
    ? files.filter(f => f.name.toLowerCase().includes(state.searchTerm.toLowerCase()))
    : files;

  // Separate folders and files
  const folders = filteredFiles.filter(f => isFolder(f.mimeType));
  const regularFiles = filteredFiles.filter(f => !isFolder(f.mimeType));

  // Render folders first
  for (const folder of folders) {
    const folderElement = createTreeItemElement(folder, level, true);
    container.appendChild(folderElement);

    // If folder is expanded, render its contents
    if (state.expandedFolders.has(folder.id)) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'tree-children expanded';
      childrenContainer.dataset.folderId = folder.id;
      container.appendChild(childrenContainer);

      await renderFolderContents(folder.id, childrenContainer, level + 1);
    }
  }

  // Render files
  for (const file of regularFiles) {
    const fileElement = createTreeItemElement(file, level, false);
    container.appendChild(fileElement);
  }
}

function createTreeItemElement(item, level, isDir) {
  const div = document.createElement('div');
  div.className = 'tree-item';
  div.dataset.fileId = item.id;
  div.dataset.fileName = item.name;
  div.dataset.mimeType = item.mimeType;
  div.dataset.webViewLink = item.webViewLink;

  if (state.selectedFiles.has(item.id)) {
    div.classList.add('selected');
  }

  if (state.pinnedFolders.has(item.id)) {
    div.classList.add('pinned');
  }

  const content = document.createElement('div');
  content.className = 'tree-item-content';

  // Indentation
  for (let i = 0; i < level; i++) {
    const indent = document.createElement('span');
    indent.className = 'tree-indent';
    content.appendChild(indent);
  }

  // Toggle arrow for folders
  if (isDir) {
    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle';
    toggle.classList.add(state.expandedFolders.has(item.id) ? 'expanded' : 'collapsed');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFolder(item.id);
    });
    content.appendChild(toggle);
  } else {
    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle empty';
    content.appendChild(toggle);
  }

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'tree-checkbox';
  checkbox.checked = state.selectedFiles.has(item.id);
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSelection(item.id);
  });
  content.appendChild(checkbox);

  // Icon
  const icon = document.createElement('img');
  icon.src = item.iconLink || getDefaultIcon(item.mimeType);
  icon.className = 'tree-icon';
  icon.alt = '';
  content.appendChild(icon);

  // Name
  const name = document.createElement('span');
  name.className = 'tree-name';
  name.textContent = item.name;
  name.title = item.name;
  content.appendChild(name);

  // Pin indicator for folders
  if (isDir) {
    const pin = document.createElement('span');
    pin.className = 'tree-pin';
    pin.textContent = '📌';
    pin.title = state.pinnedFolders.has(item.id) ? 'Unpin folder' : 'Pin folder';
    content.appendChild(pin);
  }

  div.appendChild(content);

  // Event listeners
  div.addEventListener('click', (e) => {
    if (isDir) {
      toggleFolder(item.id);
    } else {
      if (e.ctrlKey || e.metaKey) {
        openFile(item.webViewLink, true);
      } else {
        openFile(item.webViewLink, false);
      }
    }
  });

  div.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, item);
  });

  return div;
}

function renderPinnedFolders() {
  if (!elements.pinnedFoldersContainer) return;

  elements.pinnedFoldersContainer.innerHTML = '';

  if (state.pinnedFolders.size === 0) {
    elements.pinnedSection?.classList.add('hidden');
    return;
  }

  elements.pinnedSection?.classList.remove('hidden');

  // Get pinned folder data
  const pinnedItems = [];
  for (const folderId of state.pinnedFolders) {
    // Try to find in cache
    for (const [_, files] of state.folderCache) {
      const folder = files.find(f => f.id === folderId);
      if (folder) {
        pinnedItems.push(folder);
        break;
      }
    }
  }

  pinnedItems.forEach(folder => {
    const item = createTreeItemElement(folder, 0, true);
    elements.pinnedFoldersContainer.appendChild(item);
  });
}

// ========== FOLDER OPERATIONS ==========

async function toggleFolder(folderId) {
  if (state.expandedFolders.has(folderId)) {
    state.expandedFolders.delete(folderId);
  } else {
    state.expandedFolders.add(folderId);
    // Load folder contents if not cached
    if (!state.folderCache.has(folderId)) {
      await loadFolder(folderId);
    }
  }
  renderTree();
}

function toggleSelection(fileId) {
  if (state.selectedFiles.has(fileId)) {
    state.selectedFiles.delete(fileId);
  } else {
    state.selectedFiles.add(fileId);
  }
  updateSelectionUI();
}

function clearSelection() {
  state.selectedFiles.clear();
  updateSelectionUI();
}

function updateSelectionUI() {
  // Update checkboxes
  document.querySelectorAll('.tree-checkbox').forEach(cb => {
    const fileId = cb.closest('.tree-item')?.dataset.fileId;
    if (fileId) {
      cb.checked = state.selectedFiles.has(fileId);
      if (cb.checked) {
        cb.closest('.tree-item')?.classList.add('selected');
      } else {
        cb.closest('.tree-item')?.classList.remove('selected');
      }
    }
  });

  // Update selection actions panel
  if (state.selectedFiles.size > 0) {
    elements.selectionActions?.classList.remove('hidden');
    if (elements.selectionCount) {
      elements.selectionCount.textContent = `${state.selectedFiles.size} item${state.selectedFiles.size === 1 ? '' : 's'} selected`;
    }
  } else {
    elements.selectionActions?.classList.add('hidden');
  }
}

// ========== FILE OPERATIONS ==========

function openFile(url, newTab = false) {
  if (url) {
    if (newTab) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  }
}

async function handleDeleteSelected() {
  if (state.selectedFiles.size === 0) return;

  const count = state.selectedFiles.size;
  const confirmed = await showConfirmDialog(
    'Delete Files',
    `Are you sure you want to delete ${count} item${count === 1 ? '' : 's'}? This action cannot be undone.`,
    'Delete',
    'danger'
  );

  if (!confirmed) return;

  try {
    const fileIds = Array.from(state.selectedFiles);
    const response = await sendMessage({
      action: 'batchDeleteFiles',
      fileIds
    });

    if (response.success) {
      showToast(`Deleted ${response.data.successful} item${response.data.successful === 1 ? '' : 's'}`, 'success');
      clearSelection();
      await handleRefresh();
    }
  } catch (error) {
    console.error('Delete failed:', error);
    showToast('Failed to delete items', 'error');
  }
}

async function handleMoveSelected() {
  if (state.selectedFiles.size === 0) return;

  const folder = await showFolderPickerDialog('Move Items', 'Select destination folder');

  if (!folder) return;

  try {
    const fileIds = Array.from(state.selectedFiles);
    const response = await sendMessage({
      action: 'batchMoveFiles',
      fileIds,
      newParentId: folder.id
    });

    if (response.success) {
      showToast(`Moved ${response.data.successful} item${response.data.successful === 1 ? '' : 's'}`, 'success');
      clearSelection();
      await handleRefresh();
    }
  } catch (error) {
    console.error('Move failed:', error);
    showToast('Failed to move items', 'error');
  }
}

async function handleNewFile() {
  const template = await showNewFileDialog();

  if (!template) return;

  try {
    const response = await sendMessage({
      action: 'createFile',
      name: template.name,
      mimeType: template.mimeType,
      parentId: 'root'
    });

    if (response.success) {
      showToast(`Created ${template.name}`, 'success');
      await handleRefresh();
      // Open the new file
      openFile(response.data.webViewLink, false);
    }
  } catch (error) {
    console.error('Create file failed:', error);
    showToast('Failed to create file', 'error');
  }
}

async function handleRefresh() {
  state.folderCache.clear();
  await sendMessage({ action: 'clearCache' });
  await loadInitialData();
  showToast('Refreshed', 'success');
}

// ========== SEARCH ==========

function handleSearch(e) {
  state.searchTerm = e.target.value.trim();

  if (state.searchTerm) {
    elements.clearSearchBtn?.classList.remove('hidden');
  } else {
    elements.clearSearchBtn?.classList.add('hidden');
  }

  // Debounce search
  clearTimeout(handleSearch.timeout);
  handleSearch.timeout = setTimeout(() => {
    renderTree();
  }, 300);
}

function clearSearch() {
  elements.searchInput.value = '';
  state.searchTerm = '';
  elements.clearSearchBtn?.classList.add('hidden');
  renderTree();
}

// ========== CONTEXT MENU ==========

function showContextMenu(x, y, item) {
  state.currentContextItem = item;

  // Update context menu items based on item type
  const isDir = isFolder(item.mimeType);

  document.getElementById('context-pin').textContent = state.pinnedFolders.has(item.id) ? 'Unpin Folder' : 'Pin Folder';
  document.getElementById('context-pin').style.display = isDir ? 'block' : 'none';

  elements.contextMenu.style.left = `${x}px`;
  elements.contextMenu.style.top = `${y}px`;
  elements.contextMenu.classList.remove('hidden');
}

function hideContextMenu() {
  elements.contextMenu?.classList.add('hidden');
  state.currentContextItem = null;
}

async function handleContextAction(action) {
  hideContextMenu();

  if (!state.currentContextItem) return;

  const item = state.currentContextItem;

  switch (action) {
    case 'open':
      openFile(item.webViewLink, false);
      break;

    case 'open-new-tab':
      openFile(item.webViewLink, true);
      break;

    case 'rename':
      await handleRename(item);
      break;

    case 'move':
      await handleMove(item);
      break;

    case 'pin':
      await handlePin(item);
      break;

    case 'delete':
      await handleDelete(item);
      break;
  }
}

async function handleRename(item) {
  const newName = await showInputDialog('Rename', 'Enter new name:', item.name);

  if (!newName || newName === item.name) return;

  try {
    const response = await sendMessage({
      action: 'renameFile',
      fileId: item.id,
      newName
    });

    if (response.success) {
      showToast('Renamed successfully', 'success');
      await handleRefresh();
    }
  } catch (error) {
    console.error('Rename failed:', error);
    showToast('Failed to rename', 'error');
  }
}

async function handleMove(item) {
  const folder = await showFolderPickerDialog('Move Item', 'Select destination folder');

  if (!folder) return;

  try {
    const response = await sendMessage({
      action: 'moveFile',
      fileId: item.id,
      newParentId: folder.id
    });

    if (response.success) {
      showToast('Moved successfully', 'success');
      await handleRefresh();
    }
  } catch (error) {
    console.error('Move failed:', error);
    showToast('Failed to move', 'error');
  }
}

async function handlePin(item) {
  if (state.pinnedFolders.has(item.id)) {
    state.pinnedFolders.delete(item.id);
    showToast('Unpinned folder', 'success');
  } else {
    state.pinnedFolders.add(item.id);
    showToast('Pinned folder', 'success');
  }

  savePinnedFolders();
  renderPinnedFolders();
  renderTree();
}

async function handleDelete(item) {
  const confirmed = await showConfirmDialog(
    'Delete Item',
    `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
    'Delete',
    'danger'
  );

  if (!confirmed) return;

  try {
    const response = await sendMessage({
      action: 'deleteFile',
      fileId: item.id
    });

    if (response.success) {
      showToast('Deleted successfully', 'success');
      await handleRefresh();
    }
  } catch (error) {
    console.error('Delete failed:', error);
    showToast('Failed to delete', 'error');
  }
}

// ========== DIALOGS ==========

function showConfirmDialog(title, message, confirmText = 'Confirm', type = 'primary') {
  return new Promise((resolve) => {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = `<p>${message}</p>`;
    elements.modalConfirmBtn.textContent = confirmText;
    elements.modalConfirmBtn.className = `btn ${type === 'danger' ? 'danger-btn' : 'primary-btn'}`;

    elements.modalConfirmBtn.onclick = () => {
      closeModal();
      resolve(true);
    };

    elements.modalCancelBtn.onclick = () => {
      closeModal();
      resolve(false);
    };

    elements.modalOverlay.classList.remove('hidden');
  });
}

function showInputDialog(title, message, defaultValue = '') {
  return new Promise((resolve) => {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = `
      <div class="form-group">
        <label>${message}</label>
        <input type="text" id="dialog-input" value="${escapeHtml(defaultValue)}" />
      </div>
    `;

    const input = elements.modalBody.querySelector('#dialog-input');

    elements.modalConfirmBtn.textContent = 'OK';
    elements.modalConfirmBtn.className = 'btn primary-btn';

    const handleConfirm = () => {
      const value = input.value.trim();
      closeModal();
      resolve(value || null);
    };

    elements.modalConfirmBtn.onclick = handleConfirm;
    elements.modalCancelBtn.onclick = () => {
      closeModal();
      resolve(null);
    };

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleConfirm();
    });

    elements.modalOverlay.classList.remove('hidden');

    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);
  });
}

async function showFolderPickerDialog(title, message) {
  return new Promise(async (resolve) => {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = `
      <p>${message}</p>
      <div id="folder-picker-tree" class="modal-tree">
        <div class="spinner">Loading folders...</div>
      </div>
    `;

    const pickerTree = elements.modalBody.querySelector('#folder-picker-tree');
    let selectedFolder = null;

    // Load and render folders
    try {
      await renderFolderPicker(pickerTree);
    } catch (error) {
      pickerTree.innerHTML = '<p style="color: var(--danger-color);">Failed to load folders</p>';
    }

    elements.modalConfirmBtn.textContent = 'Select';
    elements.modalConfirmBtn.className = 'btn primary-btn';
    elements.modalConfirmBtn.disabled = true;

    // Handle folder selection in picker
    pickerTree.addEventListener('click', (e) => {
      const item = e.target.closest('.tree-item');
      if (item) {
        pickerTree.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedFolder = {
          id: item.dataset.fileId,
          name: item.dataset.fileName
        };
        elements.modalConfirmBtn.disabled = false;
      }
    });

    elements.modalConfirmBtn.onclick = () => {
      closeModal();
      resolve(selectedFolder);
    };

    elements.modalCancelBtn.onclick = () => {
      closeModal();
      resolve(null);
    };

    elements.modalOverlay.classList.remove('hidden');
  });
}

async function renderFolderPicker(container) {
  container.innerHTML = '';

  // Add root option
  const rootItem = createFolderPickerItem({ id: 'root', name: 'My Drive', mimeType: 'application/vnd.google-apps.folder' }, 0);
  container.appendChild(rootItem);

  // Load and render top-level folders
  const response = await sendMessage({
    action: 'listFiles',
    folderId: 'root',
    options: { foldersOnly: true }
  });

  if (response.success) {
    response.data.forEach(folder => {
      const item = createFolderPickerItem(folder, 1);
      container.appendChild(item);
    });
  }
}

function createFolderPickerItem(folder, level) {
  const div = document.createElement('div');
  div.className = 'tree-item';
  div.dataset.fileId = folder.id;
  div.dataset.fileName = folder.name;
  div.style.paddingLeft = `${level * 20 + 12}px`;

  const icon = document.createElement('img');
  icon.src = folder.iconLink || getDefaultIcon(folder.mimeType);
  icon.className = 'tree-icon';

  const name = document.createElement('span');
  name.className = 'tree-name';
  name.textContent = folder.name;

  div.appendChild(icon);
  div.appendChild(name);

  return div;
}

async function showNewFileDialog() {
  return new Promise((resolve) => {
    elements.modalTitle.textContent = 'Create New File';
    elements.modalBody.innerHTML = `
      <div class="form-group">
        <label>File Name:</label>
        <input type="text" id="new-file-name" placeholder="Untitled" />
      </div>
      <div class="form-group">
        <label>File Type:</label>
        <div class="template-grid" id="template-grid">
          <div class="template-item" data-mime="application/vnd.google-apps.document">
            <div class="template-icon">📄</div>
            <div class="template-name">Document</div>
          </div>
          <div class="template-item" data-mime="application/vnd.google-apps.spreadsheet">
            <div class="template-icon">📊</div>
            <div class="template-name">Spreadsheet</div>
          </div>
          <div class="template-item" data-mime="application/vnd.google-apps.presentation">
            <div class="template-icon">📽️</div>
            <div class="template-name">Presentation</div>
          </div>
          <div class="template-item" data-mime="application/vnd.google-apps.form">
            <div class="template-icon">📋</div>
            <div class="template-name">Form</div>
          </div>
          <div class="template-item" data-mime="application/vnd.google-apps.folder">
            <div class="template-icon">📁</div>
            <div class="template-name">Folder</div>
          </div>
        </div>
      </div>
    `;

    const nameInput = elements.modalBody.querySelector('#new-file-name');
    const templateGrid = elements.modalBody.querySelector('#template-grid');
    let selectedTemplate = null;

    templateGrid.addEventListener('click', (e) => {
      const item = e.target.closest('.template-item');
      if (item) {
        templateGrid.querySelectorAll('.template-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedTemplate = {
          mimeType: item.dataset.mime,
          name: item.querySelector('.template-name').textContent
        };
        elements.modalConfirmBtn.disabled = false;

        // Auto-fill name if empty
        if (!nameInput.value.trim()) {
          nameInput.value = `Untitled ${selectedTemplate.name}`;
        }
      }
    });

    elements.modalConfirmBtn.textContent = 'Create';
    elements.modalConfirmBtn.className = 'btn primary-btn';
    elements.modalConfirmBtn.disabled = true;

    elements.modalConfirmBtn.onclick = () => {
      if (selectedTemplate) {
        closeModal();
        resolve({
          name: nameInput.value.trim() || `Untitled ${selectedTemplate.name}`,
          mimeType: selectedTemplate.mimeType
        });
      }
    };

    elements.modalCancelBtn.onclick = () => {
      closeModal();
      resolve(null);
    };

    elements.modalOverlay.classList.remove('hidden');
    nameInput.focus();
  });
}

function closeModal() {
  elements.modalOverlay?.classList.add('hidden');
  elements.modalBody.innerHTML = '';
}

// ========== UTILITIES ==========

function sendMessage(message) {
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

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  elements.toastContainer?.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function isFolder(mimeType) {
  return mimeType === 'application/vnd.google-apps.folder';
}

function getDefaultIcon(mimeType) {
  const iconMap = {
    'application/vnd.google-apps.folder': '📁',
    'application/vnd.google-apps.document': '📄',
    'application/vnd.google-apps.spreadsheet': '📊',
    'application/vnd.google-apps.presentation': '📽️',
    'application/vnd.google-apps.form': '📋',
    'application/pdf': '📕',
    'image/png': '🖼️',
    'image/jpeg': '🖼️',
  };

  return iconMap[mimeType] || '📄';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setLoading(loading) {
  state.isLoading = loading;
  const spinner = elements.treeContainer?.querySelector('.spinner');

  if (loading) {
    if (!spinner) {
      elements.treeContainer.innerHTML = '<div class="spinner">Loading...</div>';
    }
  } else {
    if (spinner && elements.treeContainer.children.length === 1) {
      spinner.remove();
    }
  }
}

function toggleSection(sectionName) {
  let header, container;

  if (sectionName === 'recent') {
    header = elements.recentHeader;
    container = elements.recentFilesContainer;
  } else if (sectionName === 'pinned') {
    header = elements.pinnedHeader;
    container = elements.pinnedFoldersContainer;
  }

  if (header && container) {
    header.classList.toggle('collapsed');
    container.classList.toggle('hidden');
  }
}

function savePinnedFolders() {
  const pinned = Array.from(state.pinnedFolders);
  chrome.storage.local.set({ pinnedFolders: pinned });
}

function loadPinnedFolders() {
  chrome.storage.local.get(['pinnedFolders'], (result) => {
    if (result.pinnedFolders) {
      state.pinnedFolders = new Set(result.pinnedFolders);
      renderPinnedFolders();
    }
  });
}

console.log('Sidebar initialized');
