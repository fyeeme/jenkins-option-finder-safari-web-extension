# Jenkins Option Finder

Lightweight page-injected finder UI for Jenkins `gitParameterSelect` branch lists.

## Scope

This tool only supports the Jenkins DOM structure discussed in the request:

- `select.gitParameterSelect`
- child `option` nodes
- search targets: `option.text` and `option.value`

## Behavior

- Type a keyword into the floating input.
- Press `Enter` to search.
- Press `Enter` again to move to the next matching option.
- After the last match, the next `Enter` wraps back to the first match.
- When a match is activated, the script updates the select's current option and dispatches `input` and `change`.
- No match shows `0 results`.
- The floating panel starts in the top-left corner and can be dragged.
- Dragged position is saved in browser local storage.
- `Reset` clears the saved position and restores the default top-left placement.

## Files

- `src/core.js`: pure matching and wraparound logic
- `src/injector.js`: floating UI, drag behavior, and Jenkins page wiring
- `src/position.js`: panel position defaults and local storage persistence
- `src/styles.css`: reference styles matching the injected panel
- `dist/jenkins-option-finder.bundle.js`: single-file page bundle

## Test

From the repository root:

```bash
npm test
```

## Build

Regenerate the distributable bundles from `src/*.js`:

```bash
npm run build
```

## Package Safari Extension

From the repository root:

```bash
npm run package:safari
```

This command rebuilds `dist/jenkins-option-finder.bundle.js` and `safari-web-extension/content-script.js` before creating the zip archive.

## Load Into The Jenkins Page

This is not packaged as a browser extension. Load it into the target Jenkins page by injecting `src/core.js` first, `src/position.js` second, `src/selection.js` third, and `src/injector.js` last through your preferred page-script loading method.

The injector expects `window.JenkinsOptionFinderCore` to exist before it runs.

If you want a single artifact, inject `dist/jenkins-option-finder.bundle.js` instead.
