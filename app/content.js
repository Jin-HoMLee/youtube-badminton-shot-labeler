// YouTube Shot Labeler: content script with scrollable, fully resizable panel (all sides/corners)
// Dynamically loads label buttons from badminton_shots_glossary.json, groups by category as sub-sections

const PANEL_ID = 'yt-shot-labeler-panel';

// Utility to format date/time as YYYY-MM-DD HH:MM:SS
function formatDateTime(dt) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

// Utility to sanitize folder/file names
function sanitize(str) {
  return str.replace(/[<>:"/\\|?*]+/g, '').trim();
}

// Get Youtube video title, robustly
function getVideoTitle() {
  let title =
    document.querySelector('h1.title')?.innerText ||
    document.querySelector('h1.ytd-watch-metadata')?.innerText ||
    document.querySelector('.title.style-scope.ytd-video-primary-info-renderer')?.innerText ||
    null;
  if (!title || title.trim() === '') {
    // Remove "(n) " at the start, and " - YouTube" at the end
    title = document.title
      .replace(/^\(\d+\)\s*/, '')      // Remove leading "(number) "
      .replace(/ - YouTube$/, '')      // Remove trailing " - YouTube"
      .trim();
  }
  return title;
}

// Listen for toggle-panel message from background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "toggle-panel") {
    if (document.getElementById(PANEL_ID)) {
      document.getElementById(PANEL_ID).remove();
    } else {
      createLabelerPanel();
    }
  }
});

function createLabelerPanel() {
  if (document.getElementById(PANEL_ID)) return; // Don't double-create

  let shots = [];
  let currentShot = { start: null, end: null, label: null };

  // Top info
  const now = new Date();
  const dateTimeStr = formatDateTime(now);
  const videoTitle = getVideoTitle();
  const sanitizedTitle = sanitize(videoTitle) || "video";
  const videoUrl = window.location.href;

  // Panel container
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div id="yt-shot-labeler-header" class="yt-shot-labeler-section-title">
      <button id="yt-shot-labeler-close" title="Close" style="float:right;background:transparent;border:none;font-size:18px;cursor:pointer;">×</button>
      <strong style="font-size:16px;">YouTube Shot Labeler</strong>
    </div>
    <div id="yt-shot-labeler-content">
      <hr>
      <div class="yt-shot-labeler-section">
        <div class="yt-shot-labeler-section-title">Video Details</div>
        <div class="yt-shot-labeler-info">
          <div><b>Date/Time:</b> <span id="yt-shot-labeler-datetime">${dateTimeStr}</span></div>
          <div><b>Video Title:</b> <span id="yt-shot-labeler-videotitle">${videoTitle}</span></div>
          <div style="max-width:310px;word-break:break-all;"><b>URL:</b> <span id="yt-shot-labeler-url">${videoUrl}</span></div>
        </div>
      </div>
      <hr>
      <div class="yt-shot-labeler-section">
        <div class="yt-shot-labeler-section-title">Load Existing Labels</div>
        <button id="load-csv" style="margin-bottom:10px;">Load existing CSV</button>
        <input type="file" id="csv-file-input" accept=".csv" style="display:none;">
      </div>
      <hr>
      <div class="yt-shot-labeler-section">
        <div class="yt-shot-labeler-section-title">Label a Shot</div>
        <div style="margin:8px 0;">
          <button id="mark-start">Mark Start</button>
          <span id="shot-status" style="margin-left:10px;"></span>
        </div>
        <div id="label-buttons" style="margin-bottom:10px;"></div>
        <button id="mark-end" style="margin-bottom:10px;">Mark End</button>
      </div>
      <hr>
      <div class="yt-shot-labeler-section">
        <div class="yt-shot-labeler-section-title">Labeled Shots</div>
        <div id="label-list" style="max-height:120px;overflow:auto;font-size:13px;margin-bottom:10px;"></div>
      </div>
      <hr>
      <div class="yt-shot-labeler-section">
        <div class="yt-shot-labeler-section-title">Export Labels</div>
        <button id="save-labels" style="margin-bottom:2px;">Download CSV</button>
      </div>
    </div>
  `;

  // Styling/behavior for the panel itself
  panel.style.position = "fixed";
  panel.style.top = "80px";
  panel.style.right = "40px";
  panel.style.zIndex = 99999;
  panel.style.background = "#fff";
  panel.style.border = "1px solid #222";
  panel.style.padding = "0";
  panel.style.borderRadius = "8px";
  panel.style.boxShadow = "0 4px 16px #0002";
  panel.style.width = "360px";
  panel.style.fontSize = "14px";
  panel.style.fontFamily = "Arial, sans-serif";
  panel.style.lineHeight = "1.5";
  panel.style.userSelect = "none";
  panel.style.transition = "box-shadow 0.2s";
  panel.style.overflow = "hidden";
  panel.style.backgroundClip = "padding-box";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.maxHeight = "90vh";
  panel.style.minWidth = "320px";
  panel.style.minHeight = "200px";
  panel.style.resize = "none"; // We use custom

  // --- Add 8 resize handles (corners + sides) ---
  const handles = [
    { cls: 'n', cursor: 'ns-resize' },
    { cls: 's', cursor: 'ns-resize' },
    { cls: 'e', cursor: 'ew-resize' },
    { cls: 'w', cursor: 'ew-resize' },
    { cls: 'ne', cursor: 'nesw-resize' },
    { cls: 'nw', cursor: 'nwse-resize' },
    { cls: 'se', cursor: 'nwse-resize' },
    { cls: 'sw', cursor: 'nesw-resize' }
  ];
  handles.forEach(({ cls, cursor }) => {
    const h = document.createElement('div');
    h.className = `yt-shot-labeler-resize-handle ${cls}`;
    h.style.cursor = cursor;
    panel.appendChild(h);
  });

  // Append panel to DOM before getting content
  document.body.appendChild(panel);

  // Make the scrollable content area flex-grow
  const observer = new MutationObserver(() => {
    const content = panel.querySelector('#yt-shot-labeler-content');
    if (content) {
      content.style.flex = "1 1 auto";
      content.style.overflowY = "auto";
      content.style.overflowX = "hidden";
      observer.disconnect();
    }
  });
  observer.observe(panel, { childList: true, subtree: true });

  // --- Resize Logic for all handles ---
  let resizing = false, resizeDir = '', startX, startY, startW, startH, startL, startT;
  panel.querySelectorAll('.yt-shot-labeler-resize-handle').forEach(handle => {
    handle.addEventListener("mousedown", function(e) {
      e.preventDefault();
      e.stopPropagation();
      resizing = true;
      resizeDir = Array.from(handle.classList).find(c => c.length <= 2 && c !== "yt-shot-labeler-resize-handle");
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      startW = rect.width;
      startH = rect.height;
      startL = rect.left;
      startT = rect.top;
      document.body.style.userSelect = "none";
    });
  });
  document.addEventListener("mousemove", function(e) {
    if (!resizing) return;
    let dx = e.clientX - startX;
    let dy = e.clientY - startY;
    let minW = 280, minH = 200, maxW = window.innerWidth * 0.98, maxH = window.innerHeight * 0.98;
    let newW = startW, newH = startH, newL = startL, newT = startT;
    // Corners and sides
    if (resizeDir.includes('e')) newW = Math.min(maxW, Math.max(minW, startW + dx));
    if (resizeDir.includes('s')) newH = Math.min(maxH, Math.max(minH, startH + dy));
    if (resizeDir.includes('w')) {
      newW = Math.min(maxW, Math.max(minW, startW - dx));
      newL = startL + dx;
    }
    if (resizeDir.includes('n')) {
      newH = Math.min(maxH, Math.max(minH, startH - dy));
      newT = startT + dy;
    }
    // If resizing from left or top, move the panel
    if (resizeDir.includes('w')) panel.style.left = newL + "px";
    if (resizeDir.includes('n')) panel.style.top = newT + "px";
    panel.style.width = newW + "px";
    panel.style.height = newH + "px";
  });
  document.addEventListener("mouseup", function() {
    if (resizing) {
      resizing = false;
      document.body.style.userSelect = "";
    }
  });

  // --- Drag & Drop Logic ---
  const header = panel.querySelector('#yt-shot-labeler-header');
  let isDragging = false, offsetX = 0, offsetY = 0;
  header.onmousedown = function (e) {
    // Prevent drag if clicking resize handle
    if (e.target.classList.contains('yt-shot-labeler-resize-handle')) return;
    isDragging = true;
    offsetX = e.clientX - panel.getBoundingClientRect().left;
    offsetY = e.clientY - panel.getBoundingClientRect().top;
    document.body.style.userSelect = "none";
  };
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      panel.style.left = (e.clientX - offsetX) + "px";
      panel.style.top = (e.clientY - offsetY) + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.margin = "0";
    }
  });
  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });

  // --- DYNAMIC LABEL BUTTONS FROM GLOSSARY, group by category as sub-sections ---
  const labelDiv = panel.querySelector('#label-buttons');
  fetch(chrome.runtime.getURL('badminton_shots_glossary.json'))
    .then(r => r.json())
    .then(glossaryData => {
      glossaryData.categories.forEach(category => {
        // Create a sub-section div for the category
        const catSection = document.createElement('div');
        catSection.className = "yt-shot-labeler-category-section";

        // Category header
        const categoryHeader = document.createElement('div');
        categoryHeader.textContent = category.category;
        categoryHeader.className = "yt-shot-labeler-category-title";
        catSection.appendChild(categoryHeader);

        // Label buttons for this category
        category.shots.forEach(shot => {
          const btn = document.createElement('button');
          btn.textContent = shot.term;
          btn.className = "yt-shot-labeler-label-btn";
          btn.title = shot.definition; // Tooltip
          btn.onclick = () => {
            currentShot.label = shot.term;
            // Deselect all buttons in all categories
            labelDiv.querySelectorAll('button').forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            updateStatus();
          };
          catSection.appendChild(btn);
        });

        labelDiv.appendChild(catSection);
      });
    });

  function updateStatus() {
    const status = panel.querySelector('#shot-status');
    status.textContent = `Start: ${currentShot.start !== null ? currentShot.start.toFixed(2) + 's' : "-"} | End: ${currentShot.end !== null ? currentShot.end.toFixed(2) + 's' : "-"} | Label: ${currentShot.label ?? "-"}`;
  }

  // Get YouTube video element
  function getVideo() {
    return document.querySelector("video");
  }

  // Mark start
  panel.querySelector('#mark-start').onclick = () => {
    const video = getVideo();
    if (!video) return;
    currentShot.start = video.currentTime;
    updateStatus();
  };

  // Mark end and save
  panel.querySelector('#mark-end').onclick = () => {
    const video = getVideo();
    if (!video) return;
    if (currentShot.start === null) {
      alert("Please mark the start first!");
      return;
    }
    if (!currentShot.label) {
      alert("Please select a shot label!");
      return;
    }
    currentShot.end = video.currentTime;
    if (currentShot.end <= currentShot.start) {
      alert("End time must be after start time!");
      return;
    }
    shots.push({ ...currentShot });
    updateShotList();
    currentShot = { start: null, end: null, label: null };
    labelDiv.querySelectorAll('button').forEach(b => b.classList.remove("selected"));
    updateStatus();
  };

  function updateShotList() {
    const listDiv = panel.querySelector('#label-list');
    listDiv.innerHTML = shots.length === 0
      ? `<div style="color:#999;">No shots labeled yet.</div>`
      : shots.map((shot, i) =>
        `<div style="display:flex;align-items:center;gap:6px;">
          <div style="flex:1;">#${i + 1}: <b>${shot.label}</b> [${shot.start.toFixed(2)}s - ${shot.end.toFixed(2)}s]</div>
          <button title="Delete" class="yt-shot-labeler-delete" data-index="${i}" style="background:transparent;border:none;cursor:pointer;font-size:15px;">🗑️</button>
        </div>`
      ).join("");
    listDiv.querySelectorAll('.yt-shot-labeler-delete').forEach(btn => {
      btn.onclick = function () {
        const idx = parseInt(btn.getAttribute('data-index'));
        shots.splice(idx, 1);
        updateShotList();
      };
    });
  }

  // Load CSV logic
  const loadBtn = panel.querySelector('#load-csv');
  const fileInput = panel.querySelector('#csv-file-input');
  loadBtn.onclick = () => fileInput.click();
  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      // Parse CSV (skip header, robust to quoted values)
      const lines = text.trim().split('\n');
      if (lines.length < 2) return;
      const header = lines[0].split(',').map(s => s.trim());
      // Find column indexes
      const idxStart = header.indexOf('start_sec');
      const idxEnd = header.indexOf('end_sec');
      const idxLabel = header.indexOf('label');
      // Ignore all video_url/shot_id columns for loading shots
      shots = lines.slice(1).map(line => {
        // Handle quoted CSVs with commas in label, url, etc.
        const parts = [];
        let part = '', inQuotes = false;
        for (let c of line) {
          if (c === '"') inQuotes = !inQuotes;
          else if (c === ',' && !inQuotes) { parts.push(part); part = ''; }
          else part += c;
        }
        parts.push(part);
        return {
          start: parseFloat(parts[idxStart]),
          end: parseFloat(parts[idxEnd]),
          label: parts[idxLabel]?.replace(/^"|"$/g, '') ?? ''
        };
      }).filter(s => !isNaN(s.start) && !isNaN(s.end) && s.label);
      updateShotList();
    };
    reader.readAsText(file);
  };

  // Export labels as CSV via background.js and chrome.downloads API
  panel.querySelector('#save-labels').onclick = () => {
    if (!shots.length) {
      alert("No labels to save!");
      return;
    }
    let csv = 'video_url,shot_id,start_sec,end_sec,label\n';
    shots.forEach((shot, idx) => {
      // Escape label for CSV (quotes)
      const safeLabel = `"${(shot.label ?? '').replace(/"/g, '""')}"`;
      const safeUrl = `"${videoUrl.replace(/"/g, '""')}"`;
      csv += `${safeUrl},${idx + 1},${shot.start},${shot.end},${safeLabel}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const reader = new FileReader();
    reader.onload = () => {
      chrome.runtime.sendMessage({
        action: "download-csv",
        filename: `YouTube Shot Labeler/${sanitizedTitle}/labeled_shots.csv`,
        dataUrl: reader.result
      });
    };
    reader.readAsDataURL(blob);
  };

  // Close panel
  panel.querySelector('#yt-shot-labeler-close').onclick = () => {
    panel.remove();
  };

  updateStatus();
}