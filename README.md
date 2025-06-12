# YouTube Shot Labeler Extension

This browser extension lets you label shots/events in any YouTube video and export the results as a CSV file.

## How to Use

1. **Download and Place Files:**
   - Place `manifest.json`, `background.js`, `content.js`, `styles.css`, and `README.md` into a folder.

2. **Load as Unpacked Extension:**
   - Open `chrome://extensions` in Chrome (or your browser's extensions page).
   - Enable "Developer mode".
   - Click "Load unpacked" and select your folder.

3. **Go to YouTube:**
   - Open any YouTube video.
   - Click the extension icon to show/hide the labeling panel.

4. **Labeling:**
   - Play/pause the video. 
   - Click "Mark Start" at the start of an event, select a shot label, then "Mark End" at the end.
   - Repeat for as many shots as you want.
   - Each shot can be deleted (🗑️) from the list.
   - Click "Download CSV" to export the labels (button is below the shot list).

5. **Move the Panel:**
   - Drag the panel by its title bar to reposition anywhere in the window.

6. **Close/Reopen the Panel:**
   - Click the `×` button to close the panel.
   - Click the extension icon again to bring it back.

## Features

- Show/hide panel with the extension icon.
- Movable (draggable) panel.
- Displays current date/time, video title, and URL at the top.
- Works on any YouTube video page.
- Lets you label shots/events using customizable buttons.
- Download all labels as a CSV file.
- Delete shots if mis-labeled.
- Non-destructive: no changes to the video or your YouTube account.

## Customization

- To add new labels, edit the `SHOT_LABELS` array in `content.js`.

---

**Enjoy!**