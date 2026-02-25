# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

This is **Random Search** — a static GitHub Pages site (`andreasringdal.github.io/randomsearch`) that randomly selects a search engine from a configurable list when the user submits a query. It also supports `!shortcut` syntax (e.g., `!d query` for DuckDuckGo).

### Running the dev server

No build step or dependencies. Serve files with Python's built-in HTTP server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/` in a browser.

### Key files

| File | Purpose |
|---|---|
| `index.html` | Main search page UI |
| `search.js` | Core logic: loads engines, random selection, shortcut parsing, redirect |
| `engines.json` | Search engine definitions (displayName, shortcut, urlTemplate) |
| `opensearch.xml` | OpenSearch description for browser integration |
| `favicon.svg` | SVG favicon |

### Caveats

- **No linter, tests, or build step.** Validation is done by serving the files and testing search functionality in a browser.
- **Search redirects to external sites.** Testing the core flow means the browser navigates away from localhost to the selected search engine. Use the browser back button to return to the app.
- **OpenSearch URL is hardcoded** to `https://andreasringdal.github.io/randomsearch/` in `opensearch.xml`. This only matters for browser search-bar integration, not for local dev testing.