// Listens for the extension icon click and tells the content script to toggle the panel.

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {action: "toggle-panel"});
});