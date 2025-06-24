import { createLabelerPanel } from './panel.js';

const PANEL_ID = 'yt-shot-labeler-panel';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "toggle-panel") {
    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.remove();
    } else {
      createLabelerPanel();
    }
  }
});