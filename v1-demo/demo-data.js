/**
 * Demo Data - Simulates Google Drive API responses
 * No authentication required!
 */

const DEMO_DATA = {
  // Root level files and folders
  'root': [
    {
      id: 'folder-work',
      name: '💼 Work',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-15T10:30:00.000Z',
      starred: true
    },
    {
      id: 'folder-personal',
      name: '🏠 Personal',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-14T15:20:00.000Z',
      starred: false
    },
    {
      id: 'folder-projects',
      name: '🚀 Projects',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-16T09:00:00.000Z',
      starred: true
    },
    {
      id: 'folder-photos',
      name: '📸 Photos',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-10T12:00:00.000Z',
      starred: false
    },
    {
      id: 'doc-readme',
      name: 'README.txt',
      mimeType: 'text/plain',
      iconLink: '📄',
      webViewLink: '#',
      modifiedTime: '2024-01-18T14:30:00.000Z',
      starred: false
    }
  ],

  // Work folder contents
  'folder-work': [
    {
      id: 'folder-reports',
      name: '📊 Reports',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-15T10:00:00.000Z',
      starred: false
    },
    {
      id: 'folder-presentations',
      name: '📽️ Presentations',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-15T11:00:00.000Z',
      starred: false
    },
    {
      id: 'doc-quarterly-review',
      name: 'Q4 2023 Review',
      mimeType: 'application/vnd.google-apps.document',
      iconLink: '📝',
      webViewLink: '#',
      modifiedTime: '2024-01-15T16:45:00.000Z',
      starred: true
    },
    {
      id: 'sheet-budget',
      name: '2024 Budget',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      iconLink: '📊',
      webViewLink: '#',
      modifiedTime: '2024-01-14T09:30:00.000Z',
      starred: false
    },
    {
      id: 'doc-meeting-notes',
      name: 'Team Meeting Notes',
      mimeType: 'application/vnd.google-apps.document',
      iconLink: '📝',
      webViewLink: '#',
      modifiedTime: '2024-01-16T14:00:00.000Z',
      starred: false
    }
  ],

  // Reports subfolder
  'folder-reports': [
    {
      id: 'doc-sales-report',
      name: 'Sales Report Jan 2024',
      mimeType: 'application/vnd.google-apps.document',
      iconLink: '📝',
      webViewLink: '#',
      modifiedTime: '2024-01-15T10:15:00.000Z',
      starred: false
    },
    {
      id: 'sheet-analytics',
      name: 'Analytics Dashboard',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      iconLink: '📊',
      webViewLink: '#',
      modifiedTime: '2024-01-14T16:30:00.000Z',
      starred: false
    },
    {
      id: 'pdf-yearly-summary',
      name: '2023 Year in Review.pdf',
      mimeType: 'application/pdf',
      iconLink: '📕',
      webViewLink: '#',
      modifiedTime: '2024-01-10T11:00:00.000Z',
      starred: false
    }
  ],

  // Presentations subfolder
  'folder-presentations': [
    {
      id: 'slides-product-launch',
      name: 'Product Launch Q1',
      mimeType: 'application/vnd.google-apps.presentation',
      iconLink: '📊',
      webViewLink: '#',
      modifiedTime: '2024-01-12T15:20:00.000Z',
      starred: true
    },
    {
      id: 'slides-company-overview',
      name: 'Company Overview 2024',
      mimeType: 'application/vnd.google-apps.presentation',
      iconLink: '📊',
      webViewLink: '#',
      modifiedTime: '2024-01-08T10:00:00.000Z',
      starred: false
    }
  ],

  // Personal folder contents
  'folder-personal': [
    {
      id: 'folder-recipes',
      name: '🍳 Recipes',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-12T18:30:00.000Z',
      starred: false
    },
    {
      id: 'folder-travel',
      name: '✈️ Travel Plans',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-11T20:00:00.000Z',
      starred: false
    },
    {
      id: 'doc-wishlist',
      name: 'Shopping Wishlist',
      mimeType: 'application/vnd.google-apps.document',
      iconLink: '📝',
      webViewLink: '#',
      modifiedTime: '2024-01-14T19:45:00.000Z',
      starred: false
    },
    {
      id: 'sheet-finances',
      name: 'Personal Finances',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      iconLink: '📊',
      webViewLink: '#',
      modifiedTime: '2024-01-13T21:00:00.000Z',
      starred: false
    }
  ],

  // Recipes subfolder
  'folder-recipes': [
    {
      id: 'doc-pasta',
      name: 'Best Pasta Carbonara',
      mimeType: 'application/vnd.google-apps.document',
      iconLink: '📝',
      webViewLink: '#',
      modifiedTime: '2024-01-12T18:00:00.000Z',
      starred: true
    },
    {
      id: 'doc-cake',
      name: 'Chocolate Cake Recipe',
      mimeType: 'application/vnd.google-apps.document',
      iconLink: '📝',
      webViewLink: '#',
      modifiedTime: '2024-01-10T17:30:00.000Z',
      starred: false
    }
  ],

  // Travel subfolder
  'folder-travel': [
    {
      id: 'doc-italy-trip',
      name: 'Italy Trip 2024',
      mimeType: 'application/vnd.google-apps.document',
      iconLink: '📝',
      webViewLink: '#',
      modifiedTime: '2024-01-11T19:45:00.000Z',
      starred: true
    },
    {
      id: 'sheet-travel-budget',
      name: 'Travel Budget',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      iconLink: '📊',
      webViewLink: '#',
      modifiedTime: '2024-01-09T16:00:00.000Z',
      starred: false
    }
  ],

  // Projects folder contents
  'folder-projects': [
    {
      id: 'folder-website',
      name: '🌐 Website Redesign',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-16T08:30:00.000Z',
      starred: true
    },
    {
      id: 'folder-app-dev',
      name: '📱 Mobile App Development',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-15T14:00:00.000Z',
      starred: false
    },
    {
      id: 'doc-project-plan',
      name: 'Project Timeline',
      mimeType: 'application/vnd.google-apps.document',
      iconLink: '📝',
      webViewLink: '#',
      modifiedTime: '2024-01-16T09:15:00.000Z',
      starred: false
    }
  ],

  // Website subfolder
  'folder-website': [
    {
      id: 'doc-wireframes',
      name: 'Design Wireframes',
      mimeType: 'application/vnd.google-apps.document',
      iconLink: '📝',
      webViewLink: '#',
      modifiedTime: '2024-01-16T08:00:00.000Z',
      starred: false
    },
    {
      id: 'sheet-content-plan',
      name: 'Content Strategy',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      iconLink: '📊',
      webViewLink: '#',
      modifiedTime: '2024-01-15T17:00:00.000Z',
      starred: false
    }
  ],

  // Mobile App subfolder
  'folder-app-dev': [
    {
      id: 'doc-requirements',
      name: 'App Requirements',
      mimeType: 'application/vnd.google-apps.document',
      iconLink: '📝',
      webViewLink: '#',
      modifiedTime: '2024-01-15T13:30:00.000Z',
      starred: false
    },
    {
      id: 'slides-mockups',
      name: 'UI Mockups',
      mimeType: 'application/vnd.google-apps.presentation',
      iconLink: '📊',
      webViewLink: '#',
      modifiedTime: '2024-01-14T10:45:00.000Z',
      starred: true
    }
  ],

  // Photos folder contents
  'folder-photos': [
    {
      id: 'folder-vacation',
      name: '🏖️ Vacation 2023',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-08T14:00:00.000Z',
      starred: false
    },
    {
      id: 'folder-family',
      name: '👨‍👩‍👧‍👦 Family Photos',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '📁',
      webViewLink: '#',
      modifiedTime: '2024-01-07T16:30:00.000Z',
      starred: true
    },
    {
      id: 'img-screenshot',
      name: 'screenshot.png',
      mimeType: 'image/png',
      iconLink: '🖼️',
      webViewLink: '#',
      modifiedTime: '2024-01-10T11:15:00.000Z',
      starred: false
    }
  ],

  // Vacation photos
  'folder-vacation': [
    {
      id: 'img-beach1',
      name: 'beach-sunset.jpg',
      mimeType: 'image/jpeg',
      iconLink: '🖼️',
      webViewLink: '#',
      modifiedTime: '2024-01-08T13:00:00.000Z',
      starred: false
    },
    {
      id: 'img-beach2',
      name: 'ocean-view.jpg',
      mimeType: 'image/jpeg',
      iconLink: '🖼️',
      webViewLink: '#',
      modifiedTime: '2024-01-08T13:30:00.000Z',
      starred: false
    }
  ],

  // Family photos
  'folder-family': [
    {
      id: 'img-family1',
      name: 'family-reunion.jpg',
      mimeType: 'image/jpeg',
      iconLink: '🖼️',
      webViewLink: '#',
      modifiedTime: '2024-01-07T15:00:00.000Z',
      starred: true
    }
  ]
};

// Recent files (sorted by modifiedTime)
const RECENT_FILES = [
  DEMO_DATA['root'][4], // README.txt
  DEMO_DATA['folder-work'][2], // Q4 2023 Review
  DEMO_DATA['folder-work'][4], // Team Meeting Notes
  DEMO_DATA['folder-projects'][2], // Project Timeline
  DEMO_DATA['folder-website'][0], // Design Wireframes
  DEMO_DATA['folder-personal'][2], // Shopping Wishlist
  DEMO_DATA['folder-work'][3], // 2024 Budget
  DEMO_DATA['folder-personal'][3], // Personal Finances
  DEMO_DATA['folder-recipes'][0], // Best Pasta Carbonara
  DEMO_DATA['folder-travel'][0] // Italy Trip 2024
];

// Helper function to get files by folder ID
function getDemoFiles(folderId = 'root') {
  return DEMO_DATA[folderId] || [];
}

// Helper function to search files
function searchDemoFiles(query) {
  const results = [];
  query = query.toLowerCase();

  for (const folderId in DEMO_DATA) {
    DEMO_DATA[folderId].forEach(file => {
      if (file.name.toLowerCase().includes(query)) {
        results.push(file);
      }
    });
  }

  return results;
}

// Helper to get recent files
function getRecentFiles(limit = 10) {
  return RECENT_FILES.slice(0, limit);
}
