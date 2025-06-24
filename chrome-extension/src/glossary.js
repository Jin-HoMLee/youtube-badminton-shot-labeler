// glossary.js
export function setupGlossaryButtons(panel, getCurrentShot, updateStatus) {
  const labelDiv = panel.querySelector('#label-buttons');
  labelDiv.innerHTML = "";  // Clear old buttons

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

        category.shots.forEach(shot => {
          const btn = document.createElement('button');
          btn.textContent = shot.term;
          btn.className = "yt-shot-labeler-label-btn";
          btn.title = shot.definition;

          btn.onclick = () => {
            const currentShot = getCurrentShot();
            currentShot.label = shot.term;
            labelDiv.querySelectorAll('button').forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            updateStatus();
          };

          catSection.appendChild(btn);
        });

        labelDiv.appendChild(catSection);
      });
    });
}