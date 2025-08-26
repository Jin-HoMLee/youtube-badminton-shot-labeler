// Panel drag logic

/**
 * Adds drag behavior to a panel element to enable user repositioning
 * @param {HTMLElement} panel - The panel element to make draggable
 */
export function addDragBehavior(panel) {
  const header = panel.querySelector('#yt-shot-labeler-header');
  let isDragging = false, offsetX = 0, offsetY = 0;
  header.onmousedown = function (e) {
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
}