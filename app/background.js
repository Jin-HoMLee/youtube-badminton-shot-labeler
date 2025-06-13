// Listens for the extension icon click and tells the content script to toggle the panel.
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {action: "toggle-panel"});
});

// Handles CSV download to a "folder" named after the video title
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "download-csv") {
    chrome.downloads.download({
      url: msg.dataUrl,
      filename: msg.filename, // e.g. "MyVideoTitle/labeled_shots.csv"
      saveAs: false
    });
  }
});