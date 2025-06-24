(() => {
  // src/utils.js
  function formatDateTime(dt) {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
  }
  function sanitize(str) {
    return str.replace(/[<>:"/\\|?*]+/g, "").trim();
  }
  function getVideoTitle() {
    let title = document.querySelector("h1.title")?.innerText || document.querySelector("h1.ytd-watch-metadata")?.innerText || document.querySelector(".title.style-scope.ytd-video-primary-info-renderer")?.innerText || null;
    if (!title || title.trim() === "") {
      title = document.title.replace(/^\(\d+\)\s*/, "").replace(/ - YouTube$/, "").trim();
    }
    return title;
  }
  function getVideo() {
    return document.querySelector("video");
  }

  // src/resize.js
  function addResizeHandles(panel) {
    const handles = [
      { cls: "n", cursor: "ns-resize" },
      { cls: "s", cursor: "ns-resize" },
      { cls: "e", cursor: "ew-resize" },
      { cls: "w", cursor: "ew-resize" },
      { cls: "ne", cursor: "nesw-resize" },
      { cls: "nw", cursor: "nwse-resize" },
      { cls: "se", cursor: "nwse-resize" },
      { cls: "sw", cursor: "nesw-resize" }
    ];
    handles.forEach(({ cls, cursor }) => {
      const h = document.createElement("div");
      h.className = `yt-shot-labeler-resize-handle ${cls}`;
      h.style.cursor = cursor;
      panel.appendChild(h);
    });
    let resizing = false, resizeDir = "", startX, startY, startW, startH, startL, startT;
    panel.querySelectorAll(".yt-shot-labeler-resize-handle").forEach((handle) => {
      handle.addEventListener("mousedown", function(e) {
        e.preventDefault();
        e.stopPropagation();
        resizing = true;
        resizeDir = Array.from(handle.classList).find((c) => c.length <= 2 && c !== "yt-shot-labeler-resize-handle");
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
      if (resizeDir.includes("e")) newW = Math.min(maxW, Math.max(minW, startW + dx));
      if (resizeDir.includes("s")) newH = Math.min(maxH, Math.max(minH, startH + dy));
      if (resizeDir.includes("w")) {
        newW = Math.min(maxW, Math.max(minW, startW - dx));
        newL = startL + dx;
      }
      if (resizeDir.includes("n")) {
        newH = Math.min(maxH, Math.max(minH, startH - dy));
        newT = startT + dy;
      }
      if (resizeDir.includes("w")) panel.style.left = newL + "px";
      if (resizeDir.includes("n")) panel.style.top = newT + "px";
      panel.style.width = newW + "px";
      panel.style.height = newH + "px";
    });
    document.addEventListener("mouseup", function() {
      if (resizing) {
        resizing = false;
        document.body.style.userSelect = "";
      }
    });
  }

  // src/drag.js
  function addDragBehavior(panel) {
    const header = panel.querySelector("#yt-shot-labeler-header");
    let isDragging = false, offsetX = 0, offsetY = 0;
    header.onmousedown = function(e) {
      if (e.target.classList.contains("yt-shot-labeler-resize-handle")) return;
      isDragging = true;
      offsetX = e.clientX - panel.getBoundingClientRect().left;
      offsetY = e.clientY - panel.getBoundingClientRect().top;
      document.body.style.userSelect = "none";
    };
    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        panel.style.left = e.clientX - offsetX + "px";
        panel.style.top = e.clientY - offsetY + "px";
        panel.style.right = "auto";
        panel.style.bottom = "auto";
        panel.style.margin = "0";
      }
    });
    document.addEventListener("mouseup", () => {
      isDragging = false;
      document.body.style.userSelect = "";
    });
  }

  // src/csv.js
  function setupCSV(panel, shots, updateShotList, videoUrl, sanitizedTitle) {
    const loadBtn = panel.querySelector("#load-csv");
    const fileInput = panel.querySelector("#csv-file-input");
    loadBtn.onclick = () => fileInput.click();
    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.trim().split("\n");
        if (lines.length < 2) return;
        const header = lines[0].split(",").map((s) => s.trim());
        const idxStart = header.indexOf("start_sec");
        const idxEnd = header.indexOf("end_sec");
        const idxLabel = header.indexOf("label");
        shots.length = 0;
        lines.slice(1).forEach((line) => {
          const parts = [];
          let part = "", inQuotes = false;
          for (let c of line) {
            if (c === '"') inQuotes = !inQuotes;
            else if (c === "," && !inQuotes) {
              parts.push(part);
              part = "";
            } else part += c;
          }
          parts.push(part);
          if (!isNaN(parts[idxStart]) && !isNaN(parts[idxEnd]) && parts[idxLabel]) {
            shots.push({
              start: parseFloat(parts[idxStart]),
              end: parseFloat(parts[idxEnd]),
              label: parts[idxLabel]?.replace(/^"|"$/g, "") ?? ""
            });
          }
        });
        updateShotList();
      };
      reader.readAsText(file);
    };
    panel.querySelector("#save-labels").onclick = () => {
      if (!shots.length) {
        alert("No labels to save!");
        return;
      }
      let csv = "video_url,shot_id,start_sec,end_sec,label\n";
      shots.forEach((shot, idx) => {
        const safeLabel = `"${(shot.label ?? "").replace(/"/g, '""')}"`;
        const safeUrl = `"${videoUrl.replace(/"/g, '""')}"`;
        csv += `${safeUrl},${idx + 1},${shot.start},${shot.end},${safeLabel}
`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
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
  }

  // src/glossary.js
  function setupGlossaryButtons(panel, getCurrentShot, updateStatus) {
    const labelDiv = panel.querySelector("#label-buttons");
    labelDiv.innerHTML = "";
    fetch(chrome.runtime.getURL("badminton_shots_glossary.json")).then((r) => r.json()).then((glossaryData) => {
      glossaryData.categories.forEach((category) => {
        const catSection = document.createElement("div");
        catSection.className = "yt-shot-labeler-category-section";
        const categoryHeader = document.createElement("div");
        categoryHeader.textContent = category.category;
        categoryHeader.className = "yt-shot-labeler-category-title";
        catSection.appendChild(categoryHeader);
        category.shots.forEach((shot) => {
          const btn = document.createElement("button");
          btn.textContent = shot.term;
          btn.className = "yt-shot-labeler-label-btn";
          btn.title = shot.definition;
          btn.onclick = () => {
            const currentShot = getCurrentShot();
            currentShot.label = shot.term;
            labelDiv.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
            btn.classList.add("selected");
            updateStatus();
          };
          catSection.appendChild(btn);
        });
        labelDiv.appendChild(catSection);
      });
    });
  }

  // src/panel.js
  function createLabelerPanel() {
    const PANEL_ID2 = "yt-shot-labeler-panel";
    if (document.getElementById(PANEL_ID2)) return;
    let shots = [];
    let currentShot = { start: null, end: null, label: null };
    const now = /* @__PURE__ */ new Date();
    const dateTimeStr = formatDateTime(now);
    const videoTitle = getVideoTitle();
    const sanitizedTitle = sanitize(videoTitle) || "video";
    const videoUrl = window.location.href;
    const panel = document.createElement("div");
    panel.id = PANEL_ID2;
    panel.innerHTML = `
    <div id="yt-shot-labeler-header" class="yt-shot-labeler-section-title">
      <button id="yt-shot-labeler-close" title="Close" style="float:right;background:transparent;border:none;font-size:18px;cursor:pointer;">\xD7</button>
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
    Object.assign(panel.style, {
      position: "fixed",
      top: "80px",
      right: "40px",
      zIndex: 99999,
      background: "#fff",
      border: "1px solid #222",
      padding: "0",
      borderRadius: "8px",
      boxShadow: "0 4px 16px #0002",
      width: "360px",
      fontSize: "14px",
      fontFamily: "Arial, sans-serif",
      lineHeight: "1.5",
      userSelect: "none",
      transition: "box-shadow 0.2s",
      overflow: "hidden",
      backgroundClip: "padding-box",
      display: "flex",
      flexDirection: "column",
      maxHeight: "90vh",
      minWidth: "320px",
      minHeight: "200px",
      resize: "none"
    });
    addResizeHandles(panel);
    document.body.appendChild(panel);
    const observer = new MutationObserver(() => {
      const content = panel.querySelector("#yt-shot-labeler-content");
      if (content) {
        content.style.flex = "1 1 auto";
        content.style.overflowY = "auto";
        content.style.overflowX = "hidden";
        observer.disconnect();
      }
    });
    observer.observe(panel, { childList: true, subtree: true });
    addDragBehavior(panel);
    function updateStatus() {
      const status = panel.querySelector("#shot-status");
      status.textContent = `Start: ${currentShot.start !== null ? currentShot.start.toFixed(2) + "s" : "-"} | End: ${currentShot.end !== null ? currentShot.end.toFixed(2) + "s" : "-"} | Label: ${currentShot.label ?? "-"}`;
    }
    function updateShotList() {
      const listDiv = panel.querySelector("#label-list");
      listDiv.innerHTML = shots.length === 0 ? `<div style="color:#999;">No shots labeled yet.</div>` : shots.map(
        (shot, i) => `<div style="display:flex;align-items:center;gap:6px;">
          <div style="flex:1;">#${i + 1}: <b>${shot.label}</b> [${shot.start.toFixed(2)}s - ${shot.end.toFixed(2)}s]</div>
          <button title="Delete" class="yt-shot-labeler-delete" data-index="${i}" style="background:transparent;border:none;cursor:pointer;font-size:15px;">\u{1F5D1}\uFE0F</button>
        </div>`
      ).join("");
      listDiv.querySelectorAll(".yt-shot-labeler-delete").forEach((btn) => {
        btn.onclick = function() {
          const idx = parseInt(btn.getAttribute("data-index"));
          shots.splice(idx, 1);
          updateShotList();
        };
      });
    }
    setupGlossaryButtons(panel, () => currentShot, updateStatus);
    panel.querySelector("#mark-start").onclick = () => {
      const video = getVideo();
      if (!video) return;
      currentShot.start = video.currentTime;
      updateStatus();
    };
    panel.querySelector("#mark-end").onclick = () => {
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
      updateStatus();
      setupGlossaryButtons(panel, () => currentShot, updateStatus);
    };
    setupCSV(panel, shots, updateShotList, videoUrl, sanitizedTitle);
    panel.querySelector("#yt-shot-labeler-close").onclick = () => {
      panel.remove();
    };
    updateStatus();
  }

  // src/content.js
  var PANEL_ID = "yt-shot-labeler-panel";
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
})();
//# sourceMappingURL=content.js.map
