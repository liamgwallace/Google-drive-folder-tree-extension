/**
 * Background Service Worker - V2 DEMO
 * No API calls - everything is local!
 */

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleExtension' });
  } catch (error) {
    console.error('[GDN Demo] Failed to toggle extension:', error);
  }
});

console.log('[GDN Demo] Background service worker initialized - No auth required!');
