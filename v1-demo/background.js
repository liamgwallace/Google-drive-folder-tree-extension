/**
 * Background Service Worker - DEMO VERSION
 * No API calls - everything is local!
 */

// Enable side panel on action click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting panel behavior:', error));

console.log('🎭 Demo background service worker initialized - No auth required!');
