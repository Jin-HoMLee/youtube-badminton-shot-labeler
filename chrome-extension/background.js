// Service worker for YouTube Shot Labeler

// Listen for extension icon click to toggle panel
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  // Send message to content script, ignore error if content script is not present
  chrome.tabs.sendMessage(tab.id, { action: "toggle-panel" }, (response) => {
    if (chrome.runtime.lastError) {
      // No receiving end (content script not injected), ignore error
      // Optionally log: console.warn(chrome.runtime.lastError.message);
    }
  });
});

// Listen for CSV download requests from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "download-csv" && msg.filename && msg.dataUrl) {
    chrome.downloads.download({
      url: msg.dataUrl,
      filename: msg.filename,
      saveAs: true
    });
  }
});