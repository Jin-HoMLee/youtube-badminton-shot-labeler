# YouTube Badminton Shot Labeler Extension

This browser extension lets you label shots/events in any YouTube video and export the results as a CSV file.

## How to Use

1. **Download Extensions Folder:**
   - Download `chrome-extension` folder.

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

- To add new labels, edit the `badminton_shots_glossary.json`.

## Code Architecture

The extension follows a modular architecture with clear separation of concerns:

### Core Modules

- **`src/content.js`** - Main entry point that handles browser extension messaging and panel toggling
- **`src/panel.js`** - Creates and manages the main labeler panel UI and coordinates all functionality
- **`src/utils.js`** - Utility functions for date formatting, string sanitization, and DOM queries
- **`src/resize.js`** - Panel resizing functionality with drag handles
- **`src/drag.js`** - Panel dragging/repositioning functionality
- **`src/csv.js`** - CSV import and export logic for shot data
- **`src/glossary.js`** - Dynamic glossary button creation from JSON data

### Build System

The extension uses esbuild to bundle the modular source code:
- Run `npm install` to install dependencies
- Run `npm run build` from the project root to build the extension
- Built files are output to `chrome-extension/dist/`

### Development

All exported functions include JSDoc documentation for better maintainability. The modular structure makes it easy to:
- Add new features without affecting existing code
- Test individual components
- Maintain and debug specific functionality

---

**Enjoy!**

## Credits

The badminton shots glossary [badminton_shots_glossary.json](chrome-extension/badminton_shots_glossary.json) in this repository is adapted and modified from [WorldBadminton.com Glossary](https://www.worldbadminton.com/glossary.htm). 

Special thanks to GitHub Copilot Chat Assistant for guidance and coding help during development.

Developed by Jin-HoMLee. 