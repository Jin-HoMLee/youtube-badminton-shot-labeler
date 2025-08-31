// glossary.js
export function setupGlossaryButtons(panel, getCurrentShot, updateStatus) {
  const labelDiv = panel.querySelector('#label-buttons');
  labelDiv.innerHTML = "";  // Clear old buttons

  fetch(chrome.runtime.getURL('badminton_shots_glossary.json'))
    .then(r => r.json())
    .then(glossaryData => {
      glossaryData.dimensions.forEach(dimension => {
        const dimSection = document.createElement('div');
        dimSection.className = "yt-shot-labeler-category-section";
        const dimensionHeader = document.createElement('div');
        dimensionHeader.textContent = dimension.term;
        dimensionHeader.className = "yt-shot-labeler-category-title";
        dimensionHeader.title = dimension.description;
        dimSection.appendChild(dimensionHeader);

        dimension.values.forEach(value => {
          const btn = document.createElement('button');
          btn.textContent = value.term;
          btn.className = "yt-shot-labeler-label-btn";
          btn.title = value.description;

          btn.onclick = () => {
            const currentShot = getCurrentShot();
            // Initialize dimensions object if it doesn't exist
            if (!currentShot.dimensions) {
              currentShot.dimensions = {};
            }
            // Store the selected value for this dimension
            currentShot.dimensions[dimension.term] = value.term;
            
            // Remove selected class from all buttons in this dimension section
            dimSection.querySelectorAll('button').forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            updateStatus();
          };

          dimSection.appendChild(btn);
        });

        labelDiv.appendChild(dimSection);
      });
    });
}