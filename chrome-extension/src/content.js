import { createLabelerPanel } from './panel.js';

const PANEL_ID = 'yt-shot-labeler-panel';

/**
 * Handles messages from the browser extension runtime
 * Toggles the labeler panel on and off when requested
 */
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