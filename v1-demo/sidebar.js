/**
 * Sidebar Main Application - DEMO VERSION
 * Uses dummy data - no authentication required!
 */

// ========== STATE MANAGEMENT ==========

const state = {
  expandedFolders: new Set(['root']),
  selectedFiles: new Set(),
  pinnedFolders: new Set(['folder-work', 'folder-projects']),
  searchTerm: ''
};

// ========== DOM ELEMENTS ==========

const elements = {};

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', async () => {
  initializeElements();
  initializeEventListeners();
  showMainScreen();
  await loadInitialData();
  showWelcomeToast();
});

function initializeElements() {
  elements.mainScreen = document.getElementById('main-screen');
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

  // Section headers
  elements.recentHeader?.addEventListener('click', () => toggleSection('recent'));
  elements.pinnedHeader?.addEventListener('click', () => toggleSection('pinned'));

  // Global click handler to close context menu
  document.addEventListener('click', () => hideContextMenu());
  elements.contextMenu?.addEventListener('click', (e) => e.stopPropagation());

  // Context menu items
  document.getElementById('context-open')?.addEventListener('click', () => handleContextAction('open'));
  document.getElementById('context-open-new-tab')?.addEventListener('click', () => handleContextAction('open-new-tab'));
  document.getElementById('context-rename')?.addEventListener('click', () => handleContextAction('rename'));
  document.getElementById('context-move')?.addEventListener('click', () => handleContextAction('move'));
  document.getElementById('context-pin')?.addEventListener('click', () => handleContextAction('pin'));
  document.getElementById('context-delete')?.addEventListener('click', () => handleContextAction('delete'));
}

function showMainScreen() {
  elements.mainScreen?.classList.remove('hidden');
}

function showWelcomeToast() {
  showToast('🎭 Demo Mode - Using sample data (no auth required!)', 'success');
}

// ========== DATA LOADING ==========

async function loadInitialData() {
  try {
    setLoading(true);
    await Promise.all([
      loadRecentFiles(),
      loadPinnedFolders(),
      loadFolderTree('root')
    ]);
  } catch (error) {
    console.error('Failed to load initial data:', error);
    showToast('Failed to load data', 'error');
  } finally {
    setLoading(false);
  }
}

async function loadRecentFiles() {
  try {
    const files = getRecentFiles(10);
    state.recentFiles = files;
    renderRecentFiles();
  } catch (error) {
    console.error('Failed to load recent files:', error);
  }
}

async function loadFolderTree(folderId = 'root') {
  // Simulated async delay
  await new Promise(resolve => setTimeout(resolve, 100));
  renderTree();
}

async function loadPinnedFolders() {
  renderPinnedFolders();
}

// ========== RENDERING ==========

function renderRecentFiles() {
  if (!elements.recentFilesContainer) return;

  elements.recentFilesContainer.innerHTML = '';

  if (!state.recentFiles || state.recentFiles.length === 0) {
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

  div.innerHTML = `
    <span style="font-size: 20px; margin-right: 8px;">${file.iconLink}</span>
    <span class="recent-item-name">${escapeHtml(file.name)}</span>
  `;

  div.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey) {
      showToast(`Would open "${file.name}" in new tab`, 'info');
    } else {
      showToast(`Would open "${file.name}"`, 'info');
    }
  });

  return div;
}

async function renderTree() {
  if (!elements.treeContainer) return;

  elements.treeContainer.innerHTML = '';
  await renderFolderContents('root', elements.treeContainer, 0);
}

async function renderFolderContents(folderId, container, level) {
  const files = getDemoFiles(folderId);

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

  // Icon (emoji)
  const icon = document.createElement('span');
  icon.style.fontSize = '20px';
  icon.style.marginRight = '8px';
  icon.textContent = item.iconLink;
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
      showToast(`Would open "${item.name}"`, 'info');
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
    const allFiles = getDemoFiles('root').concat(
      getDemoFiles('folder-work'),
      getDemoFiles('folder-personal'),
      getDemoFiles('folder-projects'),
      getDemoFiles('folder-photos')
    );
    const folder = allFiles.find(f => f.id === folderId);
    if (folder) {
      pinnedItems.push(folder);
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

  if (state.selectedFiles.size > 0) {
    elements.selectionActions?.classList.remove('hidden');
    if (elements.selectionCount) {
      elements.selectionCount.textContent = `${state.selectedFiles.size} item${state.selectedFiles.size === 1 ? '' : 's'} selected`;
    }
  } else {
    elements.selectionActions?.classList.add('hidden');
  }
}

// ========== FILE OPERATIONS (DEMO) ==========

async function handleDeleteSelected() {
  if (state.selectedFiles.size === 0) return;

  const count = state.selectedFiles.size;
  showToast(`🎭 Demo: Would delete ${count} item${count === 1 ? '' : 's'}`, 'warning');

  // Simulate deletion
  setTimeout(() => {
    clearSelection();
    showToast('✅ Demo: Files "deleted" (not really!)', 'success');
  }, 1000);
}

async function handleMoveSelected() {
  if (state.selectedFiles.size === 0) return;
  showToast('🎭 Demo: Move dialog would appear here', 'info');
}

async function handleNewFile() {
  showToast('🎭 Demo: Create new file dialog would appear', 'info');
}

async function handleRefresh() {
  showToast('🔄 Refreshing demo data...', 'info');
  await loadInitialData();
  showToast('✅ Refreshed!', 'success');
}

// ========== SEARCH ==========

function handleSearch(e) {
  state.searchTerm = e.target.value.trim();

  if (state.searchTerm) {
    elements.clearSearchBtn?.classList.remove('hidden');
  } else {
    elements.clearSearchBtn?.classList.add('hidden');
  }

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

let currentContextItem = null;

function showContextMenu(x, y, item) {
  currentContextItem = item;

  const isDir = isFolder(item.mimeType);
  document.getElementById('context-pin').textContent = state.pinnedFolders.has(item.id) ? 'Unpin Folder' : 'Pin Folder';
  document.getElementById('context-pin').style.display = isDir ? 'block' : 'none';

  elements.contextMenu.style.left = `${x}px`;
  elements.contextMenu.style.top = `${y}px`;
  elements.contextMenu.classList.remove('hidden');
}

function hideContextMenu() {
  elements.contextMenu?.classList.add('hidden');
  currentContextItem = null;
}

async function handleContextAction(action) {
  hideContextMenu();

  if (!currentContextItem) return;

  const item = currentContextItem;

  switch (action) {
    case 'open':
      showToast(`🎭 Demo: Would open "${item.name}"`, 'info');
      break;
    case 'open-new-tab':
      showToast(`🎭 Demo: Would open "${item.name}" in new tab`, 'info');
      break;
    case 'rename':
      showToast(`🎭 Demo: Rename dialog for "${item.name}"`, 'info');
      break;
    case 'move':
      showToast(`🎭 Demo: Move dialog for "${item.name}"`, 'info');
      break;
    case 'pin':
      handlePin(item);
      break;
    case 'delete':
      showToast(`🎭 Demo: Would delete "${item.name}"`, 'warning');
      break;
  }
}

async function handlePin(item) {
  if (state.pinnedFolders.has(item.id)) {
    state.pinnedFolders.delete(item.id);
    showToast('📌 Unpinned folder', 'success');
  } else {
    state.pinnedFolders.add(item.id);
    showToast('📌 Pinned folder', 'success');
  }

  renderPinnedFolders();
  renderTree();
}

// ========== MODAL ==========

function closeModal() {
  elements.modalOverlay?.classList.remove('hidden');
  elements.modalBody.innerHTML = '';
  elements.modalFooter.innerHTML = '';
}

// ========== UTILITIES ==========

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function isFolder(mimeType) {
  return mimeType === 'application/vnd.google-apps.folder';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setLoading(loading) {
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

console.log('🎭 Demo sidebar initialized');
