// Utility functions

/**
 * Formats a Date object into a readable string format
 * @param {Date} dt - The date object to format
 * @returns {string} Formatted date string in YYYY-MM-DD HH:mm:ss format
 */
export function formatDateTime(dt) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

/**
 * Sanitizes a string by removing invalid filename characters
 * @param {string} str - The string to sanitize
 * @returns {string} Sanitized string safe for use in filenames
 */
export function sanitize(str) {
  return str.replace(/[<>:"/\\|?*]+/g, '').trim();
}

/**
 * Extracts the title from the current YouTube video page
 * @returns {string} The video title or fallback from document.title
 */
export function getVideoTitle() {
  let title =
    document.querySelector('h1.title')?.innerText ||
    document.querySelector('h1.ytd-watch-metadata')?.innerText ||
    document.querySelector('.title.style-scope.ytd-video-primary-info-renderer')?.innerText ||
    null;
  if (!title || title.trim() === '') {
    title = document.title
      .replace(/^\(\d+\)\s*/, '')
      .replace(/ - YouTube$/, '')
      .trim();
  }
  return title;
}

/**
 * Gets the video element from the current page
 * @returns {HTMLVideoElement|null} The video element or null if not found
 */
export function getVideo() {
  return document.querySelector("video");
}