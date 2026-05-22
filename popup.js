const toggle = document.getElementById('enableFeature');

// Restore saved on/off state when popup is opened
chrome.storage.local.get(['bionicEnabled'], ({ bionicEnabled }) => {
  toggle.checked = bionicEnabled || false;
});

// Listen for toggle changes and save state
toggle.addEventListener('change', () => {
  const isEnabled = toggle.checked;
  // Save new state
  chrome.storage.local.set({ bionicEnabled: isEnabled });

  // Send message to content script to enable/disable feature
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { action: 'toggle', enabled: isEnabled }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
        }
      });
  });
});