// Panel resizing logic

export function addResizeHandles(panel) {
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

  let resizing = false, resizeDir = '', startX, startY, startW, startH, startL, startT;
  panel.querySelectorAll('.yt-shot-labeler-resize-handle').forEach(handle => {
    handle.addEventListener("mousedown", function(e) {
      e.preventDefault(); e.stopPropagation();
      resizing = true;
      resizeDir = Array.from(handle.classList).find(c => c.length <= 2 && c !== "yt-shot-labeler-resize-handle");
      startX = e.clientX; startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      startW = rect.width; startH = rect.height;
      startL = rect.left; startT = rect.top;
      document.body.style.userSelect = "none";
    });
  });
  document.addEventListener("mousemove", function(e) {
    if (!resizing) return;
    let dx = e.clientX - startX;
    let dy = e.clientY - startY;
    let minW = 280, minH = 200, maxW = window.innerWidth * 0.98, maxH = window.innerHeight * 0.98;
    let newW = startW, newH = startH, newL = startL, newT = startT;
    if (resizeDir.includes('e')) newW = Math.min(maxW, Math.max(minW, startW + dx));
    if (resizeDir.includes('s')) newH = Math.min(maxH, Math.max(minH, startH + dy));
    if (resizeDir.includes('w')) { newW = Math.min(maxW, Math.max(minW, startW - dx)); newL = startL + dx; }
    if (resizeDir.includes('n')) { newH = Math.min(maxH, Math.max(minH, startH - dy)); newT = startT + dy; }
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
}