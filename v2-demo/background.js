/**
 * Background Service Worker - V2 DEMO
 * No API calls - everything is local!
 */

// Check if URL is restricted (cannot inject scripts)
function isRestrictedUrl(url) {
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

  // Check protocols
  if (restrictedProtocols.some(protocol => url.startsWith(protocol))) {
    return true;
  }

  // Check domains
  if (restrictedDomains.some(domain => url.includes(domain))) {
    return true;
  }

  return false;
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Check if page is restricted
  if (isRestrictedUrl(tab.url)) {
    console.log('[GDN Demo] Cannot run on restricted pages:', tab.url);
    console.log('[GDN Demo] Please navigate to a regular webpage to use the extension.');
    return;
  }

  try {
    // Try to send message to content script
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleExtension' });
  } catch (error) {
    console.log('[GDN Demo] Content script not loaded, injecting now...');

    // Content script not loaded - inject it
    try {
      // Inject CSS first
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content.css']
      });

      // Then inject JS files
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['demo-data.js', 'content.js']
      });

      console.log('[GDN Demo] Content script injected successfully');
    } catch (injectError) {
      console.error('[GDN Demo] Failed to inject content script:', injectError);
    }
  }
});

console.log('[GDN Demo] Background service worker initialized - No auth required!');
