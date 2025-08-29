// glossary.js
export function setupGlossaryButtons(panel, getCurrentShot, updateStatus) {
  const labelDiv = panel.querySelector('#label-buttons');
  labelDiv.innerHTML = "";  // Clear old buttons

  // Mapping of category names to shot object fields
  const categoryFieldMap = {
    'Serve': 'label',
    'Clear': 'label', 
    'Lift': 'label',
    'Drop': 'label',
    'Net Shot': 'label',
    'Smash & Kill': 'label',
    'Drive & Block': 'label',
    'Longitudinal Position': 'longitudinalPosition',
    'Lateral Position': 'lateralPosition',
    'Timing': 'timing',
    'Intention': 'intention',
    'Stroke': 'stroke',
    'Impact': 'impact',
    'Direction': 'direction'
  };

  fetch(chrome.runtime.getURL('badminton_shots_glossary.json'))
    .then(r => r.json())
    .then(glossaryData => {
      glossaryData.categories.forEach(category => {
        const catSection = document.createElement('div');
        catSection.className = "yt-shot-labeler-category-section";
        const categoryHeader = document.createElement('div');
        categoryHeader.textContent = category.category;
        categoryHeader.className = "yt-shot-labeler-category-title";
        catSection.appendChild(categoryHeader);

        const fieldName = categoryFieldMap[category.category];

        category.shots.forEach(shot => {
          const btn = document.createElement('button');
          btn.textContent = shot.term;
          btn.className = "yt-shot-labeler-label-btn";
          btn.title = shot.definition;
          btn.dataset.field = fieldName;
          btn.dataset.value = shot.term;

          btn.onclick = () => {
            const currentShot = getCurrentShot();
            currentShot[fieldName] = shot.term;
            
            // Remove selection from other buttons in the same category
            catSection.querySelectorAll('button').forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            updateStatus();
          };

          catSection.appendChild(btn);
        });

        labelDiv.appendChild(catSection);
      });
    });
}