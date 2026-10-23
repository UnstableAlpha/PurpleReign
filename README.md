# PurpleReign

An interactive web application for browsing, searching, and annotating Purple Team test cases aligned to the MITRE ATT&CK framework.

---

## What It Is

PurpleReign is a searchable, dark-themed reference tool for Purple Team engagements, built around the MITRE ATT&CK framework. The app is the **source of truth** for test case data — the original spreadsheet was used for the initial data migration only.

The dataset covers **615 test cases** across **12 MITRE ATT&CK tactics**, plus a **397-entry Detection Engineering Reference** that maps techniques to specific detection logic and log sources. Both datasets are fully editable and extensible within the app.

---

## Features

- **Tactic sidebar** — navigate by ATT&CK tactic (ordered by kill chain), with case counts per tactic
- **Global search** — real-time filtering across technique ID, name, description, tools, test steps, expected detection, and log sources
- **Sub-technique nesting** — parent techniques (e.g. `T1059`) show an expand toggle (`▶ +N`) to reveal child sub-techniques (`T1059.001`, `T1059.002`, etc.)
- **Detail drawer** — click any row to open a right-hand panel showing:
  - Full description, test tools, numbered test steps, expected detection narrative, log sources/event IDs, and notes
  - A collapsible **Detection Engineering Reference** block matched by Technique ID, showing actionable detection logic broken out by rule type
- **In-browser editing** — each technique's fields are editable via an Edit/Save/Cancel flow; edits persist across sessions via `localStorage`
- **Bulk import** — upload CSV or JSON files to add or update test cases and detection reference entries in bulk; see `templates/` for format guides
- **Export JSON** — download the full live dataset (base data + all edits + imports) as `purplereign.json` to commit back to the repo
- **Virtualised table** — only visible rows are rendered regardless of dataset size, keeping scroll performance fast
- **Static build** — the production output is plain HTML/JS/CSS with no server dependency, deployable anywhere

---

## Project Structure

```
purplereign-app/
├── scripts/
│   └── convert_xlsx.py          # One-time migration tool (xlsx → JSON); not needed for ongoing use
├── src/
│   ├── data/
│   │   └── purplereign.json     # Canonical dataset — lazy-loaded on first visit, then localStorage takes over
│   ├── hooks/
│   │   └── useAppData.js        # Unified data state, localStorage persistence, export/import logic
│   ├── components/
│   │   ├── Sidebar.jsx          # Tactic navigation
│   │   ├── SearchBar.jsx        # Search input
│   │   ├── TestCaseTable.jsx    # Virtualised, grouped, sortable test case table
│   │   ├── DetailPanel.jsx      # Right-hand detail drawer with edit mode
│   │   ├── DetectionPanel.jsx   # Detection Engineering Reference block
│   │   └── ImportModal.jsx      # Bulk import UI (CSV + JSON, with validation and preview)
│   ├── App.jsx                  # Root component, layout, header actions
│   ├── main.jsx                 # React entry point
│   └── index.css                # Tailwind + custom scrollbar styles
├── templates/
│   ├── test_case_import.csv     # CSV template for importing test cases
│   ├── test_case_import.json    # JSON template for importing test cases
│   ├── detection_ref_import.csv # CSV template for importing detection reference entries
│   └── detection_ref_import.json
├── public/
│   └── favicon.svg
├── index.html
├── package.json
└── vite.config.js
```

---

## Requirements

- **Node.js** 18 or later
- **Python** 3.x with `openpyxl` (only needed when regenerating data from the spreadsheet)

---

## Getting Started

### 1. Install dependencies

```powershell
# From the purplereign-app directory
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
npm install
```

### 2. Convert the spreadsheet to JSON

Only required once, or whenever `PURPLEREIGN_v13_windows.xlsx` changes.

```powershell
# openpyxl is required
pip install openpyxl

# Run from the purplereign-app directory
python scripts\convert_xlsx.py
```

This writes `src/data/purplereign.json`.

### 3. Start the development server

```powershell
npm run dev
# → http://localhost:5173
```

---

## Production Build

```powershell
npm run build
# Output: dist/
```

The `dist/` directory is fully static. Deploy it to GitHub Pages, Netlify, an internal Nginx instance, or any static host. No backend is required.

To preview the production build locally:

```powershell
npm run preview
```

---

## Managing Data

### How data persistence works

On first visit, the app lazy-loads `src/data/purplereign.json` and copies it into `localStorage` as the live working copy. All subsequent edits, imports, and additions are written directly to localStorage — the bundled JSON is never touched again unless you explicitly reset.

```
purplereign.json  ──(first visit only)──▶  localStorage['purplereign-data']
                                                        │
                                              All edits/imports go here
                                                        │
                                            Export JSON ▼
                                         purplereign.json (download)
                                                        │
                                         Commit to repo + npm run build
```

### Editing individual test cases

Click any row to open the detail drawer, then click **Edit** in the top-right corner. All fields become editable. Click **Save** to persist, or **Cancel** to discard. Edits are saved immediately to localStorage and survive browser refreshes.

### Exporting data

Click **Export JSON** in the top header bar. The browser downloads `purplereign.json` containing the complete live dataset — base records plus all edits and imports.

**To make changes permanent across machines and deployments:**

1. Click **Export JSON** and save the downloaded file
2. Replace `src/data/purplereign.json` with the downloaded file
3. Run `npm run build` — the new data is baked into the production build
4. Deploy `dist/` as normal

### Importing data in bulk

Click **Import** in the header to open the import modal. Two tabs are available:

- **Test Cases** — add or update test cases
- **Detection Reference** — add or update detection logic entries

Uploading a file shows a validation summary and a 5-row preview before you confirm. Records missing required fields are listed and skipped. Existing IDs are flagged as duplicates (they will be overwritten on confirm).

#### Import formats

Both tabs accept `.csv` and `.json`. Templates are in the `templates/` directory.

**Test case fields:**

| Column | Required | Notes |
|---|---|---|
| `tactic` | ✓ | Must match an ATT&CK tactic name, or a new tactic will be created |
| `id` | ✓ | MITRE ATT&CK technique ID (e.g. `T1059.001`) |
| `name` | ✓ | Technique name |
| `description` | | Free text |
| `tools` | | Semicolon-separated tool names |
| `steps` | | Numbered steps separated by `\n` (newlines) |
| `expectedDetection` | | Free text |
| `logSource` | | Semicolon-separated log source references |
| `notes` | | Free text |

**Detection reference fields:**

| Column | Required | Notes |
|---|---|---|
| `id` | ✓ | Technique ID — links to test case records |
| `detectionLogic` | ✓ | Detection rules, separated by ` \| ` (space-pipe-space) |
| `name` | | Technique name |
| `tactics` | | Tactic name(s) |

> **CSV tip:** wrap any field containing commas or newlines in double-quotes. The `steps` and `detectionLogic` fields commonly require this.

### Resetting to factory defaults

To discard all local changes and reload from the bundled `purplereign.json`:

```javascript
// Run in the browser developer console (F12 → Console)
localStorage.removeItem('purplereign-data')
// Then reload the page
location.reload()
```

---

## Updating the Bundled Data Source

The Excel spreadsheet and converter script (`scripts/convert_xlsx.py`) were used for the initial data migration only. The app no longer depends on them.

To update `purplereign.json` for a new deployment, use the **Export JSON** workflow above rather than re-running the converter.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| Data pipeline | Python + openpyxl |
| State persistence | Browser `localStorage` |

---

## Potential Improvements

These are noted for future consideration and are not currently implemented.

### Data & Export

- **Export edits back to Excel** — a Python script (or browser-side `SheetJS`) could merge `localStorage` edits back into the `.xlsx`, making annotations portable
- **Export filtered results to CSV/PDF** — useful for sharing a scoped test plan with stakeholders
- **Multi-version diffing** — highlight techniques added, removed, or changed between spreadsheet versions

### Collaboration & Persistence

- **Shared backend** — replace `localStorage` with a lightweight API (e.g. a small FastAPI or Node service writing to a JSON file or SQLite) so a team can share annotations in real time
- **Per-user annotation tracks** — allow multiple operators to annotate independently and merge views
- **Engagement sessions** — group a run of test cases into a named session with a date and operator, separate from the reference data

### UI & Workflow

- **Pass/Fail tracking** — add a per-technique pass/fail toggle (currently the column was removed as the source data is empty; it could be reintroduced as a local annotation)
- **Keyboard navigation** — `j`/`k` to move between rows, `Enter` to open the drawer, `e` to enter edit mode, `Esc` to close
- **MITRE ATT&CK Navigator export** — generate a Navigator layer JSON from the current tactic/technique selection for visual heat-mapping
- **Technique coverage heatmap** — a matrix view showing which ATT&CK techniques are covered vs. not, colour-coded by test outcome
- **Print / report mode** — a clean printable view of selected test cases suitable for a formal exercise report

### Performance

- **Lazy-load the JSON** — at ~950 KB the bundle is large; dynamic `import()` of `purplereign.json` would cut initial load time and is a one-line Vite change
- **Virtualised table rows** — with 615+ rows, a windowing library (`@tanstack/react-virtual`) would keep rendering fast as the dataset grows
