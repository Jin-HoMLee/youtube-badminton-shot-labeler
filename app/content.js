// YouTube Shot Labeler: content script
const PANEL_ID = 'yt-shot-labeler-panel';

// Utility to format date/time as YYYY-MM-DD HH:MM:SS
function formatDateTime(dt) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
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

  const SHOT_LABELS = ["net shot", "lift", "clear", "smash", "drop", "drive", "block"];
  let shots = [];
  let currentShot = {start: null, end: null, label: null};

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
    <div id="yt-shot-labeler-header" style="cursor:move;user-select:none;">
      <button id="yt-shot-labeler-close" title="Close" style="float:right;background:transparent;border:none;font-size:18px;cursor:pointer;">×</button>
      <strong style="font-size:16px;">YouTube Shot Labeler</strong>
    </div>
    <div id="yt-shot-labeler-info" style="font-size:12px;line-height:1.4;margin:7px 0 10px 0;">
      <div><b>Date/Time:</b> <span id="yt-shot-labeler-datetime">${dateTimeStr}</span></div>
      <div><b>Video Title:</b> <span id="yt-shot-labeler-videotitle">${videoTitle}</span></div>
      <div style="max-width:310px;word-break:break-all;"><b>URL:</b> <span id="yt-shot-labeler-url">${videoUrl}</span></div>
    </div>
    <button id="load-csv" style="margin-bottom:10px;">Load existing CSV</button>
    <input type="file" id="csv-file-input" accept=".csv" style="display:none;">
    <div style="margin:8px 0;">
      <button id="mark-start">Mark Start</button>
      <span id="shot-status" style="margin-left:10px;"></span>
    </div>
    <div id="label-buttons" style="margin-bottom:10px;"></div>
    <button id="mark-end" style="margin-bottom:10px;">Mark End</button>
    <div id="label-list" style="max-height:120px;overflow:auto;font-size:13px;margin-bottom:10px;"></div>
    <button id="save-labels" style="margin-bottom:2px;">Download CSV</button>
  `;

  // Styling
  panel.style.position = "fixed";
  panel.style.top = "80px";
  panel.style.right = "40px";
  panel.style.zIndex = 99999;
  panel.style.background = "#fff";
  panel.style.border = "1px solid #222";
  panel.style.padding = "10px 16px 10px 10px";
  panel.style.borderRadius = "8px";
  panel.style.boxShadow = "0 4px 16px #0002";
  panel.style.width = "340px";
  panel.style.fontSize = "14px";
  panel.style.fontFamily = "Arial, sans-serif";
  panel.style.lineHeight = "1.5";
  panel.style.minHeight = "140px";
  panel.style.userSelect = "none";
  panel.style.transition = "box-shadow 0.2s";

  document.body.appendChild(panel);

  // --- Drag & Drop Logic ---
  const header = panel.querySelector('#yt-shot-labeler-header');
  let isDragging = false, offsetX = 0, offsetY = 0;
  header.onmousedown = function(e) {
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

  // Label buttons
  const labelDiv = panel.querySelector('#label-buttons');
  SHOT_LABELS.forEach(label => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = "yt-shot-labeler-label-btn";
    btn.onclick = () => {
      currentShot.label = label;
      [...labelDiv.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      updateStatus();
    };
    labelDiv.appendChild(btn);
  });

  function updateStatus() {
    const status = panel.querySelector('#shot-status');
    status.textContent = `Start: ${currentShot.start !== null ? currentShot.start.toFixed(2)+'s' : "-"} | End: ${currentShot.end !== null ? currentShot.end.toFixed(2)+'s' : "-"} | Label: ${currentShot.label ?? "-"}`;
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
    shots.push({...currentShot});
    updateShotList();
    currentShot = {start: null, end: null, label: null};
    [...labelDiv.children].forEach(b => b.classList.remove("selected"));
    updateStatus();
  };

  function updateShotList() {
    const listDiv = panel.querySelector('#label-list');
    listDiv.innerHTML = shots.map((shot, i) =>
      `<div style="display:flex;align-items:center;gap:6px;">
        <div style="flex:1;">#${i+1}: <b>${shot.label}</b> [${shot.start.toFixed(2)}s - ${shot.end.toFixed(2)}s]</div>
        <button title="Delete" class="yt-shot-labeler-delete" data-index="${i}" style="background:transparent;border:none;cursor:pointer;font-size:15px;">🗑️</button>
      </div>`
    ).join("");
    listDiv.querySelectorAll('.yt-shot-labeler-delete').forEach(btn => {
      btn.onclick = function() {
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
      csv += `${safeUrl},${idx+1},${shot.start},${shot.end},${safeLabel}\n`;
    });
    const blob = new Blob([csv], {type: 'text/csv'});
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