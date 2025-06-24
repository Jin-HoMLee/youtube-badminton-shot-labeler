// Utility functions

export function formatDateTime(dt) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

export function sanitize(str) {
  return str.replace(/[<>:"/\\|?*]+/g, '').trim();
}

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

export function getVideo() {
  return document.querySelector("video");
}