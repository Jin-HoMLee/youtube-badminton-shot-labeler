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
      
      // Check for new format columns
      const idxLongitudinal = header.indexOf('longitudinal_position');
      const idxLateral = header.indexOf('lateral_position');
      const idxTiming = header.indexOf('timing');
      const idxIntention = header.indexOf('intention');
      const idxStroke = header.indexOf('stroke');
      const idxImpact = header.indexOf('impact');
      const idxDirection = header.indexOf('direction');
      
      // Check for old format
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
        
        if (!isNaN(parts[idxStart]) && !isNaN(parts[idxEnd])) {
          const shot = {
            start: parseFloat(parts[idxStart]),
            end: parseFloat(parts[idxEnd])
          };
          
          // Handle new dimension format
          if (idxLongitudinal >= 0 || idxLateral >= 0 || idxTiming >= 0 || idxIntention >= 0 || idxStroke >= 0 || idxImpact >= 0 || idxDirection >= 0) {
            shot.dimensions = {};
            if (idxLongitudinal >= 0 && parts[idxLongitudinal]?.replace(/^"|"$/g, '')) {
              shot.dimensions['Longitudinal Position'] = parts[idxLongitudinal]?.replace(/^"|"$/g, '');
            }
            if (idxLateral >= 0 && parts[idxLateral]?.replace(/^"|"$/g, '')) {
              shot.dimensions['Lateral Position'] = parts[idxLateral]?.replace(/^"|"$/g, '');
            }
            if (idxTiming >= 0 && parts[idxTiming]?.replace(/^"|"$/g, '')) {
              shot.dimensions['Timing'] = parts[idxTiming]?.replace(/^"|"$/g, '');
            }
            if (idxIntention >= 0 && parts[idxIntention]?.replace(/^"|"$/g, '')) {
              shot.dimensions['Intention'] = parts[idxIntention]?.replace(/^"|"$/g, '');
            }
            if (idxStroke >= 0 && parts[idxStroke]?.replace(/^"|"$/g, '')) {
              shot.dimensions['Stroke'] = parts[idxStroke]?.replace(/^"|"$/g, '');
            }
            if (idxImpact >= 0 && parts[idxImpact]?.replace(/^"|"$/g, '')) {
              shot.dimensions['Impact'] = parts[idxImpact]?.replace(/^"|"$/g, '');
            }
            if (idxDirection >= 0 && parts[idxDirection]?.replace(/^"|"$/g, '')) {
              shot.dimensions['Direction'] = parts[idxDirection]?.replace(/^"|"$/g, '');
            }
          } 
          // Handle old label format for backward compatibility
          else if (idxLabel >= 0 && parts[idxLabel]) {
            shot.label = parts[idxLabel]?.replace(/^"|"$/g, '') ?? '';
          }
          
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
    let csv = 'video_url,shot_id,start_sec,end_sec,longitudinal_position,lateral_position,timing,intention,stroke,impact,direction\n';
    shots.forEach((shot, idx) => {
      const safeUrl = `"${videoUrl.replace(/"/g, '""')}"`;
      let longitudinal = '';
      let lateral = '';
      let timing = '';
      let intention = '';
      let stroke = '';
      let impact = '';
      let direction = '';
      
      if (shot.dimensions) {
        longitudinal = shot.dimensions['Longitudinal Position'] || '';
        lateral = shot.dimensions['Lateral Position'] || '';
        timing = shot.dimensions['Timing'] || '';
        intention = shot.dimensions['Intention'] || '';
        stroke = shot.dimensions['Stroke'] || '';
        impact = shot.dimensions['Impact'] || '';
        direction = shot.dimensions['Direction'] || '';
      } else if (shot.label) {
        // Backward compatibility - put old label in stroke field
        stroke = shot.label;
      }
      
      csv += `${safeUrl},${idx + 1},${shot.start},${shot.end},"${longitudinal}","${lateral}","${timing}","${intention}","${stroke}","${impact}","${direction}"\n`;
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