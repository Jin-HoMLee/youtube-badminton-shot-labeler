// CSV import/export logic

export function setupCSV(panel, shots, updateShotList, videoUrl, sanitizedTitle) {
  // Import
  const loadBtn = panel.querySelector('#load-csv');
  const fileInput = panel.querySelector('#csv-file-input');
  loadBtn.onclick = () => fileInput.click();
  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.trim().split('\n');
      if (lines.length < 2) return;
      const header = lines[0].split(',').map(s => s.trim());
      const idxStart = header.indexOf('start_sec');
      const idxEnd = header.indexOf('end_sec');
      const idxLabel = header.indexOf('label');
      shots.length = 0;
      lines.slice(1).forEach(line => {
        const parts = [];
        let part = '', inQuotes = false;
        for (let c of line) {
          if (c === '"') inQuotes = !inQuotes;
          else if (c === ',' && !inQuotes) { parts.push(part); part = ''; }
          else part += c;
        }
        parts.push(part);
        if (!isNaN(parts[idxStart]) && !isNaN(parts[idxEnd]) && parts[idxLabel]) {
          shots.push({
            start: parseFloat(parts[idxStart]),
            end: parseFloat(parts[idxEnd]),
            label: parts[idxLabel]?.replace(/^"|"$/g, '') ?? ''
          });
        }
      });
      updateShotList();
    };
    reader.readAsText(file);
  };

  // Export
  panel.querySelector('#save-labels').onclick = () => {
    if (!shots.length) {
      alert("No labels to save!");
      return;
    }
    let csv = 'video_url,shot_id,start_sec,end_sec,label\n';
    shots.forEach((shot, idx) => {
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
}