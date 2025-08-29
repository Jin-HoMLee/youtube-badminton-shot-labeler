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
      
      // Find column indices for required and optional fields
      const idxStart = header.indexOf('start_sec');
      const idxEnd = header.indexOf('end_sec');
      const idxLabel = header.indexOf('label');
      const idxLongitudinalPosition = header.indexOf('longitudinal_position');
      const idxLateralPosition = header.indexOf('lateral_position');
      const idxTiming = header.indexOf('timing');
      const idxIntention = header.indexOf('intention');
      const idxStroke = header.indexOf('stroke');
      const idxImpact = header.indexOf('impact');
      const idxDirection = header.indexOf('direction');
      
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
        
        // Only require start_sec and end_sec, make other fields optional
        if (!isNaN(parts[idxStart]) && !isNaN(parts[idxEnd])) {
          const shot = {
            start: parseFloat(parts[idxStart]),
            end: parseFloat(parts[idxEnd]),
            label: idxLabel >= 0 ? (parts[idxLabel]?.replace(/^"|"$/g, '') ?? '') : '',
            longitudinalPosition: idxLongitudinalPosition >= 0 ? (parts[idxLongitudinalPosition]?.replace(/^"|"$/g, '') ?? '') : null,
            lateralPosition: idxLateralPosition >= 0 ? (parts[idxLateralPosition]?.replace(/^"|"$/g, '') ?? '') : null,
            timing: idxTiming >= 0 ? (parts[idxTiming]?.replace(/^"|"$/g, '') ?? '') : null,
            intention: idxIntention >= 0 ? (parts[idxIntention]?.replace(/^"|"$/g, '') ?? '') : null,
            stroke: idxStroke >= 0 ? (parts[idxStroke]?.replace(/^"|"$/g, '') ?? '') : null,
            impact: idxImpact >= 0 ? (parts[idxImpact]?.replace(/^"|"$/g, '') ?? '') : null,
            direction: idxDirection >= 0 ? (parts[idxDirection]?.replace(/^"|"$/g, '') ?? '') : null
          };
          
          // Convert empty strings to null for consistency
          Object.keys(shot).forEach(key => {
            if (shot[key] === '') shot[key] = null;
          });
          
          shots.push(shot);
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
    let csv = 'video_url,shot_id,start_sec,end_sec,label,longitudinal_position,lateral_position,timing,intention,stroke,impact,direction\n';
    shots.forEach((shot, idx) => {
      const safeLabel = `"${(shot.label ?? '').replace(/"/g, '""')}"`;
      const safeUrl = `"${videoUrl.replace(/"/g, '""')}"`;
      const safeLongitudinalPosition = `"${(shot.longitudinalPosition ?? '').replace(/"/g, '""')}"`;
      const safeLateralPosition = `"${(shot.lateralPosition ?? '').replace(/"/g, '""')}"`;
      const safeTiming = `"${(shot.timing ?? '').replace(/"/g, '""')}"`;
      const safeIntention = `"${(shot.intention ?? '').replace(/"/g, '""')}"`;
      const safeStroke = `"${(shot.stroke ?? '').replace(/"/g, '""')}"`;
      const safeImpact = `"${(shot.impact ?? '').replace(/"/g, '""')}"`;
      const safeDirection = `"${(shot.direction ?? '').replace(/"/g, '""')}"`;
      csv += `${safeUrl},${idx + 1},${shot.start},${shot.end},${safeLabel},${safeLongitudinalPosition},${safeLateralPosition},${safeTiming},${safeIntention},${safeStroke},${safeImpact},${safeDirection}\n`;
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