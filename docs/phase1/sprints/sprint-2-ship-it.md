# Sprint 2 — Ship it
## Duration: 2-3 weeks
## Goal: Complete product, package for both targets, ready for beta users

---

## Sprint objective

Sprint 1 delivered the core workflow. Sprint 2 completes everything around it: MRT screen, report generation in all formats, project save/load, desktop packaging, web deployment, and chart export. By the end, v1.0 is shippable.

**Prerequisite:** Sprint 1 gate passed. The hot path works.

---

## Tasks

### Task 2.1 — MRT screen
**Requirement:** INP-05, CMP-05, VRD-03
**Effort:** Medium (4-6 hours)

**What to do:**
Build the Mechanical Running Test screen with input fields and pass/fail verdicts.

**Fields:**
| Field | Unit | Acceptance limit (API 610) |
|---|---|---|
| Vibration — drive end | mm/s | Per API 610 table, based on power rating |
| Vibration — non-drive end | mm/s | Same |
| Bearing temperature — DE | °C | Per API 610 (typically ambient + 50°C) |
| Bearing temperature — NDE | °C | Same |
| Noise level | dB(A) | Per contract or local regulation |
| Seal leakage | mL/h | Per API 610 seal type table |

**Acceptance criteria:**
- [ ] All 6 fields accept numeric input with validation
- [ ] Each field shows PASS/FAIL based on API 610 threshold
- [ ] MRT overall verdict computed (all pass = PASS, any fail = FAIL)
- [ ] MRT data included in project state (for save/load)
- [ ] Labels bilingual (EN/PT)

**Claude Code prompt:**
```
Create MRTScreen.jsx with a form for 6 mechanical test parameters.
Each field needs:
- Numeric input with unit label
- An inline PASS/FAIL badge that updates on input
- Threshold comparison logic (API 610 limits)

Create an API endpoint POST /api/analysis/check-mrt that accepts the measurements
and returns per-parameter verdicts. Keep the threshold values in the Python library,
not in the frontend.
```

---

### Task 2.2 — Report generation — .docx
**Requirement:** RPT-01, RPT-04
**Effort:** Medium (4-6 hours)

**What to do:**
Complete the `/api/report/generate` endpoint for .docx format. The library already has `create_report()` — wrap it properly.

**Report sections:**
1. Header: project name, pump tag, date, report number
2. Input data table: design point values
3. Test data table: all test points
4. Curve charts: H-Q, P-Q, η-Q with tolerance bands (embedded as images)
5. Verdict table: per-point deviations and pass/fail
6. MRT results table (if MRT data exists)
7. Overall conclusion: ACCEPTED / REJECTED
8. Notes field (user-provided text)

**Acceptance criteria:**
- [ ] .docx file generates without error
- [ ] All 8 sections present and correctly populated
- [ ] Charts embedded as images at print resolution
- [ ] Report renders correctly in Word, LibreOffice, and Google Docs
- [ ] Language selection (EN/PT) affects all text in the report
- [ ] File downloads in browser (web) or opens save dialog (desktop)

---

### Task 2.3 — Report generation — .json
**Requirement:** RPT-02
**Effort:** Small (2-3 hours)

**What to do:**
Create the JSON report output — machine-readable export of all analysis data.

**Acceptance criteria:**
- [ ] JSON contains: metadata, design_point, test_points, curve_fit, tolerance_check, mrt_results
- [ ] Schema is documented (JSON Schema or equivalent)
- [ ] Round-trip: loading the JSON into the library reproduces the same results
- [ ] Validates against schema without errors

---

### Task 2.4 — Report generation — .html
**Requirement:** RPT-03
**Effort:** Medium (4-6 hours)

**What to do:**
Create a standalone HTML report — single file, no external dependencies, viewable in any browser.

**Acceptance criteria:**
- [ ] Single .html file with embedded CSS and chart images (base64)
- [ ] Same content as .docx report
- [ ] Renders correctly in Chrome, Firefox, Safari, Edge
- [ ] Printable (Ctrl+P produces clean A4 output)
- [ ] Bilingual (EN/PT)

---

### Task 2.5 — Report preview screen
**Requirement:** RPT-01-04
**Effort:** Medium (3-4 hours)

**What to do:**
Build the report screen where the user previews and configures report generation.

**UI elements:**
- Read-only preview of report content (rendered in the browser)
- Language selector: EN / PT
- Format selector: .docx / .json / .html
- Include MRT: yes / no toggle
- Custom notes: text area (500 char max)
- Generate button → triggers download
- Chart export buttons (PNG/SVG for individual charts, VIZ-07)

**Acceptance criteria:**
- [ ] Preview shows approximate report layout
- [ ] All options affect the generated output correctly
- [ ] Generate button produces the correct file format
- [ ] Chart export works independently of report generation
- [ ] Notes text appears in generated report

---

### Task 2.6 — Project save/load
**Requirement:** PRJ-01, PRJ-02, PRJ-03, PRJ-04, PRJ-05
**Effort:** Medium (4-6 hours)

**What to do:**
Implement the full project persistence cycle.

**Save serializes:**
- Schema version
- Design point
- Test points
- Curve fit config (polynomial degree)
- MRT data
- Report preferences (language, format, notes)
- Last active screen

**Acceptance criteria:**
- [ ] Save produces a human-readable .json file
- [ ] Load restores all state and navigates to last active screen
- [ ] Round-trip: save → load → save produces identical files (NFR-10)
- [ ] Schema version field present
- [ ] Loading a file with wrong version shows clear error message
- [ ] Loading a corrupt file shows error, does not crash (PRJ-05)
- [ ] Unsaved changes prompt on close/new project (PRJ-04)
- [ ] Keyboard shortcut: Ctrl+S / Cmd+S to save

**Claude Code prompt:**
```
Create a useProject hook that manages save/load state.

Save: serialize the entire app state to JSON with a version field.
Trigger a file download with the project name as filename.

Load: accept a file upload, parse JSON, validate the schema version,
hydrate the app state, navigate to the last active screen.

Add a beforeunload listener that warns about unsaved changes.
Add Ctrl+S / Cmd+S keyboard shortcut for save.

Write tests that verify round-trip fidelity and corrupt file handling.
```

---

### Task 2.7 — Desktop wrapper
**Requirement:** DSK-01, DSK-02, DSK-06, DSK-07
**Effort:** Large (8-12 hours)

**What to do:**
Based on the Sprint 0 prototype evaluation, implement the chosen desktop wrapper (Electron, Tauri, or pywebview). Document the decision in ADR-002.

**Acceptance criteria:**
- [ ] Desktop app renders the same React UI as the web version
- [ ] Python computation runs locally (no server needed)
- [ ] All features work offline (DSK-06)
- [ ] ADR-002 written with rationale for wrapper choice

---

### Task 2.8 — Desktop installers
**Requirement:** DSK-03, DSK-04, DSK-05
**Effort:** Large (6-10 hours)

**What to do:**
Build installers for all three target platforms.

**Acceptance criteria:**
- [ ] Windows: .exe or .msi installer, < 5 clicks to install, < 200 MB
- [ ] macOS: .dmg, drag-to-Applications, < 200 MB
- [ ] Linux: .deb or AppImage, < 200 MB
- [ ] Each tested on a clean machine (no dev tools pre-installed)
- [ ] App launches and completes one full FAT analysis cycle after install

---

### Task 2.9 — Web deployment
**Requirement:** M-12
**Effort:** Medium (4-6 hours)

**What to do:**
Set up deployment for the web target. This depends on the hosting decision (OQ-10).

**Acceptance criteria:**
- [ ] FastAPI + React build deploys to target environment
- [ ] CORS configured for production domain
- [ ] Environment variables for configuration (no secrets in code)
- [ ] Health check endpoint: `GET /api/health`
- [ ] The full FAT workflow works in a browser on the deployed version

---

### Task 2.10 — End-to-end validation
**Requirement:** CMP-07, NFR-06, NFR-18
**Effort:** Medium (4-6 hours)

**What to do:**
Run the complete workflow using the reference dataset. Verify accuracy. Fuzz test edge cases.

**Acceptance criteria:**
- [ ] Complete FAT analysis with B-432301D data produces correct verdict
- [ ] All computed values within ±2% of reference
- [ ] Report generates correctly in all three formats
- [ ] Edge case inputs (empty fields, extreme values, 5 vs 50 test points) don't crash
- [ ] Desktop and web produce identical results for the same input

---

### Task 2.11 — Documentation
**Requirement:** NFR-14, NFR-15
**Effort:** Medium (3-4 hours)

**What to do:**
Complete all documentation.

**Acceptance criteria:**
- [ ] Root README.md: install instructions, quickstart, screenshots
- [ ] All public library functions have docstrings (Args, Returns, Raises, Example)
- [ ] API documented via Swagger (auto-generated from Pydantic models)
- [ ] All 8 concept domains have complete documentation pages
- [ ] User guide for the application (how to run a FAT analysis)

**Claude Code prompt:**
```
Scan all public functions in the pump/ package.
For any function missing a docstring, write one following this format:

def function_name(param1: Type, param2: Type) -> ReturnType:
    \"\"\"One-line summary.

    Longer description if needed.

    Args:
        param1: Description with unit.
        param2: Description with unit.

    Returns:
        Description of return value.

    Raises:
        ValueError: When input is invalid.

    Example:
        >>> result = function_name(100.0, 50.0)
        >>> print(result.head)
        49.8
    \"\"\"

Then update the root README.md with:
- Project description
- Install instructions (pip install -e .)
- Quickstart (5-line code example)
- Link to docs/ folder
- Link to API docs (/docs endpoint)
```

---

## Sprint 2 gate review (= v1.0 release gate)

| Check | Status |
|---|---|
| MRT screen accepts data and shows pass/fail | [ ] |
| .docx report generates correctly in EN and PT | [ ] |
| .json report validates against schema | [ ] |
| .html report renders in 4 major browsers | [ ] |
| Report preview shows correct content | [ ] |
| Chart export (PNG/SVG) works | [ ] |
| Project save/load round-trips without data loss | [ ] |
| Corrupt project file handled gracefully | [ ] |
| Unsaved changes prompt works | [ ] |
| Desktop app installs and runs on Windows | [ ] |
| Desktop app installs and runs on macOS | [ ] |
| Desktop app installs and runs on Linux | [ ] |
| Desktop app works fully offline | [ ] |
| Web deployment accessible and functional | [ ] |
| Reference dataset produces correct results on both targets | [ ] |
| All public functions documented | [ ] |
| Root README complete | [ ] |
| No untranslated strings in either language | [ ] |
| `pytest tests/ -v` — all green | [ ] |

**When all boxes are checked: v1.0 is ready for beta users.**

---

## What you learn in Sprint 2

- How to generate professional documents programmatically (python-docx)
- How to serialize and deserialize application state reliably
- How to package a desktop app with bundled Python
- How to deploy a web application
- The gap between "it works on my machine" and "it works for users"
- The discipline of a release checklist
