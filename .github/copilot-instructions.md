# YouTube Badminton Shot Labeler Chrome Extension

YouTube Badminton Shot Labeler is a Chrome browser extension that allows users to label shots/events in badminton videos on YouTube and export the labels as CSV files. The extension uses JavaScript ES6 modules, esbuild for bundling, and Chrome Extension Manifest V3.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

- **Bootstrap and build the repository:**
  - `cd /path/to/youtube-badminton-shot-labeler`
  - `npm install` -- installs esbuild dependency. Takes under 1 second. NEVER CANCEL.
  - `cd chrome-extension`
  - `node esbuild.config.js` -- builds the extension. Takes under 1 second. NEVER CANCEL.

- **Alternative build command:**
  - From `chrome-extension/` directory: `npx esbuild src/content.js --bundle --outfile=dist/content.js` (requires being in repository root or having local esbuild)

- **Verify build output:**
  - Check that `chrome-extension/dist/content.js` and `chrome-extension/dist/content.js.map` are created
  - Validate JavaScript syntax: `node -c dist/content.js`

## Manual Validation and Testing

**CRITICAL**: Always manually validate any code changes by testing the extension functionality. Simply building is NOT sufficient.

### Load Extension in Chrome Browser
- Open `chrome://extensions/` in Chrome
- Enable "Developer mode" (toggle in top-right)
- Click "Load unpacked" and select the `chrome-extension/` folder
- Navigate to any YouTube video (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
- Click the extension icon in the browser toolbar to toggle the panel

### Required Manual Validation Scenarios
After making any changes, ALWAYS test these complete user scenarios:

1. **Panel Toggle Test:**
   - Click extension icon → panel should appear
   - Click extension icon again → panel should disappear
   - Click extension icon again → panel should reappear

2. **Shot Labeling Workflow Test:**
   - Open panel on a YouTube video
   - Click "Mark Start" → verify status shows start time
   - Select a shot label (e.g., "Short") → verify status shows selected label
   - Click "Mark End" → verify shot is added to labeled shots list
   - Verify the labeled shot appears in the list with correct timing

3. **Panel Functionality Test:**
   - Verify video details section shows correct date/time, video title, and URL
   - Test panel dragging by dragging the title bar
   - Test panel resizing using corner/edge handles
   - Test "Download CSV" button (should prompt for download location)

4. **Error Handling Test:**
   - Try "Mark End" without "Mark Start" → should show alert
   - Try "Mark End" with same time as start → should show alert  
   - Try "Download CSV" with no labeled shots → should show alert

## Repository Structure and Navigation

### Key Directories and Files
```
├── chrome-extension/          # Main extension directory
│   ├── src/                  # Source JavaScript files
│   │   ├── content.js        # Main entry point, message handling
│   │   ├── panel.js          # Panel creation and UI logic
│   │   ├── utils.js          # Utility functions
│   │   ├── csv.js            # CSV import/export functionality  
│   │   ├── drag.js           # Panel dragging behavior
│   │   ├── resize.js         # Panel resizing behavior
│   │   └── glossary.js       # Shot glossary button creation
│   ├── dist/                 # Build output directory
│   │   ├── content.js        # Bundled content script
│   │   └── content.js.map    # Source map
│   ├── manifest.json         # Chrome extension manifest
│   ├── background.js         # Service worker script
│   ├── styles.css            # Extension panel styles
│   ├── badminton_shots_glossary.json  # Shot definitions
│   └── esbuild.config.js     # Build configuration
├── package.json              # Node.js dependencies (esbuild)
└── README.md                 # Usage instructions
```

### Frequently Modified Files
- **`src/panel.js`** - Main UI logic, shot labeling workflow
- **`src/glossary.js`** - Shot button generation from JSON glossary
- **`badminton_shots_glossary.json`** - Shot definitions (easily customizable)
- **`styles.css`** - Panel appearance and styling
- **`manifest.json`** - Extension permissions and configuration

### Common Code Patterns
- All source files use ES6 module imports/exports
- Panel creation uses `document.createElement` and direct DOM manipulation
- Chrome extension APIs accessed via `chrome.runtime.*` and `chrome.tabs.*`
- Event handlers use anonymous arrow functions
- Time formatting uses `toFixed(2)` for seconds display

## Build Process Details

### Dependencies
- **esbuild ^0.25.5** - JavaScript bundler (only dev dependency)
- No runtime dependencies
- No testing frameworks configured
- No linting tools configured

### Build Configuration
- Entry point: `src/content.js`
- Output: `dist/content.js` (bundled)
- Target: Chrome 110+
- Source maps enabled for debugging
- Minification disabled by default

### Build Timing Expectations
- **npm install**: Under 1 second - NEVER CANCEL
- **esbuild build**: Under 1 second - NEVER CANCEL  
- **Clean rebuild**: Under 2 seconds total - NEVER CANCEL

## Validation Requirements

### Before Committing Changes
- **ALWAYS** build the extension: `cd chrome-extension && node esbuild.config.js`
- **ALWAYS** manually test the extension in Chrome with the validation scenarios above
- **ALWAYS** verify no JavaScript console errors when using the extension
- **ALWAYS** test on an actual YouTube video page, not just the repository files

### No Automated Testing
- **No unit tests** - manual testing is the only validation method
- **No CI/CD pipelines** - all validation must be done locally
- **No linting** - check syntax manually with `node -c` commands

## Troubleshooting Common Issues

### Build Fails
- Ensure you're in the `chrome-extension/` directory when running build commands
- Verify `node_modules/` exists in repository root (run `npm install` if missing)
- Check all source files are syntactically valid: `find src/ -name "*.js" -exec node -c {} \;`

### Extension Not Loading
- Verify `dist/content.js` exists and is not empty
- Check Chrome extension console for errors at `chrome://extensions/`
- Ensure manifest.json permissions are correct
- Reload the extension after any code changes

### Panel Not Appearing
- Verify you're on a YouTube video page (`youtube.com/watch?v=*`)
- Check browser console for JavaScript errors
- Ensure content script is properly injected (visible in DevTools Sources tab)

## Important Notes

- **Extension Type**: Unpacked Chrome extension for development
- **Manifest Version**: 3 (latest Chrome extension format)
- **Content Script Injection**: Automatic on YouTube watch pages
- **File Access**: Uses `chrome.runtime.getURL()` for accessing extension files
- **CSV Export**: Uses Chrome Downloads API with user file picker
- **No External Dependencies**: Pure JavaScript, no frameworks or libraries