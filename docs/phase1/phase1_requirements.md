# Phase 1 — Requirements specification
## PumpLab v1.0

---

## 1. Purpose

This document specifies every requirement for PumpLab v1.0. Each requirement has an ID, a plain-language description, acceptance criteria, dependencies, and a verification method. Nothing is implemented until it appears here. Nothing ships unless it passes its acceptance criteria.

Source documents: `use-cases.md`, `mvp-scope.md`, `nfr.md`, `interface-requirements.md`, `library-audit.md`, `adr/001-dual-target-architecture.md`.

---

## 2. Actors

| Actor | Description |
|---|---|
| FAT engineer | Primary user. Conducts Factory Acceptance Tests on centrifugal pumps per API 610. Enters test data, reviews curves, checks tolerances, generates reports. |
| System | PumpLab application (desktop or web). Performs computation, validation, rendering, and report generation. |

---

## 3. Functional requirements

### 3.1 Library foundation

| ID | Requirement | Acceptance criteria | Verification | Priority | Depends on |
|---|---|---|---|---|---|
| LIB-01 | Library is installable via pip | `pip install -e .` succeeds from repo root; `import pump` works in a clean venv with Python ≥ 3.12 | Automated test | Must | — |
| LIB-02 | All dependencies are pinned in pyproject.toml | `pint`, `numpy`, `matplotlib`, `tabulate`, `python-docx` listed with version constraints; `pip install` resolves without conflicts | Manual review | Must | — |
| LIB-03 | Library has at least one golden-numbers test fixture | `pytest tests/` passes with at least one test that compares library output to known reference values from `examples/B-432301D.ipynb` | Automated test | Must | LIB-01 |
| LIB-04 | Known bugs from audit are fixed | (a) `pint` import error resolved; (b) `PerformanceChecker` handles missing attributes without crash; (c) fitter sort order is deterministic; (d) hard-coded `m**3/h` replaced with configurable unit | Automated test per bug | Must | LIB-01 |
| LIB-05 | Translation catalogues compile | `msgfmt` produces `.mo` files from existing `.po` files for EN and PT; library loads them at runtime without error | Automated test | Must | LIB-01 |

### 3.2 Data input

| ID | Requirement | Acceptance criteria | Verification | Priority | Depends on |
|---|---|---|---|---|---|
| INP-01 | User can enter pump rated conditions (design point) | Form accepts: flow rate, head, efficiency, power, speed, NPSH-R, impeller diameter. All fields validated against ranges defined in `glossary-and-units.md`. Submission creates a `DesignPoint` object. | Manual + automated | Must | LIB-01 |
| INP-02 | User can enter test measurements (test points) | Table interface accepts rows of: flow rate, head, power, speed. User can add, edit, and delete rows. Minimum 5 rows enforced before curve fitting. Each row creates a `TestPoint` object. | Manual + automated | Must | LIB-01 |
| INP-03 | Input validation prevents invalid data | (a) Negative values rejected for flow, head, power, speed; (b) zero values rejected for speed and diameter; (c) efficiency range 0-100%; (d) validation messages appear inline next to the offending field, in the active language | Manual test | Must | INP-01, INP-02 |
| INP-04 | Input fields show units | Every numeric field displays its unit label. Unit follows the active unit system (SI by default). | Manual test | Must | INP-01, INP-02 |
| INP-05 | User can enter MRT data | Form accepts: vibration levels (DE and NDE), bearing temperatures (DE and NDE), noise level, seal leakage. Each field has pass/fail threshold per API 610. | Manual + automated | Must | — |
| INP-06 | User can import test data from CSV | Upload a CSV file with columns matching TestPoint fields. System parses, validates, and populates the test point table. Malformed rows produce clear error messages, not silent failures. | Manual + automated | Should | INP-02 |

### 3.3 Computation

| ID | Requirement | Acceptance criteria | Verification | Priority | Depends on |
|---|---|---|---|---|---|
| CMP-01 | System fits polynomial curves to test data | Given a DesignPoint and ≥ 5 TestPoints, system produces fitted H-Q, P-Q curves (polynomial degree configurable, default 4). R² value computed and returned. | Automated test against golden numbers | Must | INP-01, INP-02, LIB-03 |
| CMP-02 | System computes efficiency curve from fitted H and P | η(Q) = ρgQH(Q) / P(Q) computed at each flow point. Values clamped to 0-100%. | Automated test | Must | CMP-01 |
| CMP-03 | System applies affinity law speed correction | When test speed ≠ rated speed, system corrects: Q₂ = Q₁(N₂/N₁), H₂ = H₁(N₂/N₁)², P₂ = P₁(N₂/N₁)³. Correction applied to all test points before re-fitting. | Automated test with known speed ratio | Must | CMP-01, LIB-04 |
| CMP-04 | System checks tolerance per API 610 | For each guarantee point, system computes deviation from rated values and compares against API 610 tolerance bands. Returns per-point verdict (PASS / FAIL) and overall verdict. | Automated test against known pass/fail cases | Must | CMP-01 |
| CMP-05 | System evaluates MRT pass/fail | For each MRT parameter (vibration, bearing temp, noise, seal leakage), system compares measured value against API 610 acceptance threshold. Returns per-parameter verdict. | Automated test | Must | INP-05 |
| CMP-06 | Curve computation completes within 200ms | 50-point degree-4 polynomial fit for H-Q and P-Q combined executes in < 200ms on reference hardware (defined in nfr.md). | Performance benchmark | Must | CMP-01 |
| CMP-07 | Computation accuracy within ±2% of reference | Library output for the golden-numbers fixture deviates no more than 2% from validated reference values. | Automated comparison test | Must | LIB-03, CMP-01 |

### 3.4 Visualization

| ID | Requirement | Acceptance criteria | Verification | Priority | Depends on |
|---|---|---|---|---|---|
| VIZ-01 | System displays H-Q curve chart | Interactive chart showing: fitted H-Q curve (solid line), individual test points (markers), rated point (distinct marker). X-axis: flow (m³/h). Y-axis: head (m). Hover shows (Q, H) values. | Manual test | Must | CMP-01 |
| VIZ-02 | System displays P-Q curve chart | Same layout as VIZ-01 but for power vs flow. | Manual test | Must | CMP-01 |
| VIZ-03 | System displays η-Q curve chart | Same layout as VIZ-01 but for efficiency vs flow. Y-axis: 0-100%. | Manual test | Must | CMP-02 |
| VIZ-04 | Charts display API 610 tolerance bands | Shaded region around the rated point showing the acceptable tolerance zone per API 610. Band boundaries computed from PerformanceChecker. | Manual test | Must | CMP-04 |
| VIZ-05 | Charts display speed-corrected curves when applied | When affinity correction is active, chart shows both original test data (dashed, muted) and corrected curve (solid). Legend distinguishes the two. | Manual test | Must | CMP-03 |
| VIZ-06 | Chart renders within 500ms | First paint of an interactive chart with 50 data points and tolerance bands completes in < 500ms. | Performance benchmark | Must | VIZ-01 |
| VIZ-07 | User can export chart as PNG or SVG | Export button on each chart produces a downloadable image file at sufficient resolution for reports (≥ 300 DPI for PNG). | Manual test | Must | VIZ-01 |
| VIZ-08 | User can zoom and pan charts | Mouse wheel zooms, click-drag pans. Double-click resets to full view. Touch equivalents on mobile/tablet. | Manual test | Should | VIZ-01 |

### 3.5 Verdict display

| ID | Requirement | Acceptance criteria | Verification | Priority | Depends on |
|---|---|---|---|---|---|
| VRD-01 | System displays per-point verdict table | Table showing each guarantee point with: measured value, rated value, deviation %, tolerance limit %, verdict (PASS/FAIL). Color-coded: green for pass, red for fail. | Manual test | Must | CMP-04 |
| VRD-02 | System displays overall verdict | Single prominent indicator: ACCEPTED / REJECTED (or equivalent), derived from all individual point verdicts and MRT results. | Manual test | Must | CMP-04, CMP-05 |
| VRD-03 | System displays MRT verdict table | Table showing each MRT parameter with: measured value, acceptance limit, verdict. Same color coding as VRD-01. | Manual test | Must | CMP-05 |

### 3.6 Report generation

| ID | Requirement | Acceptance criteria | Verification | Priority | Depends on |
|---|---|---|---|---|---|
| RPT-01 | System generates .docx report | Report contains: header (project info, pump tag, date), input data table, curve charts (H-Q, P-Q, η-Q with tolerance bands), verdict table, MRT results table, overall conclusion. Formatted for printing on A4. | Manual review of generated file | Must | CMP-04, VIZ-01-04, VRD-01-03 |
| RPT-02 | System generates .json report | Machine-readable JSON containing all input data, curve fit results, tolerance check results, MRT results, and metadata. Schema documented. | Automated schema validation test | Must | CMP-04 |
| RPT-03 | System generates .html report | Standalone HTML file (no external dependencies) containing same content as .docx report. Viewable in any modern browser. | Manual test in Chrome, Firefox, Safari | Must | CMP-04, VIZ-01-04 |
| RPT-04 | Reports generate in EN or PT | User selects language before generation. All text in report (headers, labels, verdict strings, notes) appears in the selected language. Zero untranslated strings. | Manual review in both languages | Must | LIB-05, RPT-01-03 |
| RPT-05 | User can add custom notes to report | Free-text field (up to 500 characters) whose content appears in a "Notes" section of the generated report. | Manual test | Should | RPT-01-03 |

### 3.7 Project management

| ID | Requirement | Acceptance criteria | Verification | Priority | Depends on |
|---|---|---|---|---|---|
| PRJ-01 | User can save project to file | All application state serialized to a JSON file: design point, test points, curve config, MRT data, report preferences, active screen. File is human-readable. | Automated round-trip test | Must | INP-01-05 |
| PRJ-02 | User can load project from file | Loading a saved project.json restores all state and navigates to the last active screen. All data fields populated correctly. | Automated round-trip test | Must | PRJ-01 |
| PRJ-03 | Project file has a version field | JSON file includes a schema version number. Loading a file with an unsupported version shows a clear error message. | Automated test with old/new versions | Must | PRJ-01 |
| PRJ-04 | Unsaved changes trigger save prompt | When closing the app or loading a different project with unsaved changes, system prompts: "Save before closing?" with Save / Don't Save / Cancel options. | Manual test | Must | PRJ-01 |
| PRJ-05 | Corrupt project file does not crash the app | Loading a malformed JSON file shows a clear error message and returns to the home screen. Application remains functional. | Automated test with malformed input | Must | PRJ-02 |

### 3.8 Localization

| ID | Requirement | Acceptance criteria | Verification | Priority | Depends on |
|---|---|---|---|---|---|
| L10N-01 | User can switch between EN and PT | Toggle switch visible on all screens. Switching language updates all UI text immediately without page reload or data loss. | Manual test | Must | LIB-05 |
| L10N-02 | Number formatting follows locale | EN: period decimal separator, comma thousands. PT: comma decimal separator, period thousands. Applied to all displayed values and report content. | Manual test | Must | L10N-01 |
| L10N-03 | All user-facing strings are translatable | No hard-coded user-facing strings in frontend code. Every string passes through the i18n system. | Code review + automated scan | Must | L10N-01 |

### 3.9 API layer (web target)

| ID | Requirement | Acceptance criteria | Verification | Priority | Depends on |
|---|---|---|---|---|---|
| API-01 | FastAPI app serves all computation endpoints | Endpoints: `/api/analysis/fit-curve`, `/api/analysis/check-tolerance`, `/api/analysis/affinity-correction`, `/api/report/generate`, `/api/project/save`, `/api/project/load`. All return JSON (except report generate which returns file). | Automated integration test | Must | CMP-01-05, RPT-01-03, PRJ-01-02 |
| API-02 | All endpoints use Pydantic request/response models | Every endpoint has typed request and response schemas. Invalid requests return 422 with a descriptive error body. | Automated test with invalid payloads | Must | API-01 |
| API-03 | API auto-generates OpenAPI documentation | `/docs` serves Swagger UI. `/openapi.json` serves the schema. All endpoints, models, and fields documented. | Manual verification | Must | API-01, API-02 |
| API-04 | CORS configured for frontend origin | Web frontend can call all API endpoints without CORS errors. Allowed origins configurable via environment variable. | Integration test | Must | API-01 |

### 3.10 Desktop target

| ID | Requirement | Acceptance criteria | Verification | Priority | Depends on |
|---|---|---|---|---|---|
| DSK-01 | Desktop wrapper runs the React frontend | Same React app renders inside the desktop wrapper. All screens and interactions work identically to the web target. | Manual comparative test | Must | API-01, VIZ-01-07 |
| DSK-02 | Desktop app bundles Python runtime | User does not need to install Python separately. The installer includes the Python interpreter and all library dependencies. | Manual test on clean machine | Must | LIB-01, LIB-02 |
| DSK-03 | Desktop installer for Windows 10+ | Single .exe or .msi installer. < 5 clicks from download to running application. Installed size < 200 MB. | Manual test on Windows 10, 11 | Must | DSK-01, DSK-02 |
| DSK-04 | Desktop installer for macOS 12+ | .dmg or .pkg installer. Same install experience as DSK-03. | Manual test on macOS 12, 13 | Must | DSK-01, DSK-02 |
| DSK-05 | Desktop installer for Ubuntu 22.04+ | .deb package or AppImage. Same install experience as DSK-03. | Manual test on Ubuntu 22.04 | Must | DSK-01, DSK-02 |
| DSK-06 | Desktop app works fully offline | All computation, charting, and report generation works without internet connectivity. | Manual test with network disabled | Must | DSK-01 |
| DSK-07 | Desktop wrapper decision documented | ADR-002 records which wrapper (Electron, Tauri, or pywebview) was chosen and why, based on Sprint 0 prototype results. | Document review | Must | — |

---

## 4. Non-functional requirements

Carried forward from `nfr.md` with clarified acceptance tests.

| ID | Category | Requirement | Acceptance criterion | Verification | Applies to |
|---|---|---|---|---|---|
| NFR-01 | Performance | Curve computation time | < 200 ms for 50-point degree-4 H-Q + P-Q fit | Benchmark script | Both |
| NFR-02 | Performance | Chart first paint | < 500 ms for interactive chart with tolerance bands | Browser profiling | Both |
| NFR-03 | Performance | Slider/toggle response | < 100 ms from user action to visual update | Manual perception test | Both |
| NFR-06 | Reliability | Calculation accuracy | Within ±2% of validated reference dataset | Automated comparison | Both |
| NFR-10 | Data | Save/load fidelity | JSON round-trip preserves all fields byte-for-byte (float precision: 10 decimal places) | Automated round-trip | Both |
| NFR-11 | Data | Export formats | Charts exportable as PNG (≥ 300 DPI) and SVG. Data exportable as CSV. | Manual test | Both |
| NFR-12 | Packaging | Desktop install size | < 200 MB installed | Measure post-install | Desktop |
| NFR-13 | Packaging | Desktop install steps | < 5 clicks from download to running | Manual walkthrough | Desktop |
| NFR-14 | Documentation | API coverage | 100% of public functions in `pump` library have docstrings with Args, Returns, Raises, and one Example | Automated docstring checker | Both |
| NFR-15 | Documentation | Concept coverage | All 8 concept domains have completed documentation per template in `concepts/README.md` | Manual review | Both |
| NFR-16 | Localization | Translation completeness | Zero untranslated strings when switching EN ↔ PT across all screens and reports | Manual sweep | Both |
| NFR-17 | Accessibility | Keyboard navigation | All interactive elements reachable via Tab. Charts have screen-reader alt text. | Manual test + axe audit | Web |
| NFR-18 | Reliability | No crash on bad input | Any combination of empty, null, negative, or out-of-range inputs produces a clear error message, never a crash or unhandled exception | Fuzz test | Both |

---

## 5. Constraints

These are not negotiable within v1.0.

| ID | Constraint | Rationale |
|---|---|---|
| CON-01 | All computation lives in the `pump` Python library | Single source of truth. No duplicating curve fitting in JavaScript. |
| CON-02 | Frontend and backend communicate via REST/JSON only | Clean boundary enables dual-target architecture. |
| CON-03 | Same React codebase for desktop and web | Minimizes maintenance burden per ADR-001. |
| CON-04 | Python ≥ 3.12 | Library uses modern syntax features. |
| CON-05 | Library's internal unit system is SI | Conversions happen at the display layer, never inside computation. |
| CON-06 | API 610 tolerance tables are the authority for pass/fail | No custom or overridden tolerance bands in v1.0 (OQ-12 resolution pending). |

---

## 6. Dependencies between requirements

```
LIB-01 ──▶ LIB-02 ──▶ LIB-03
  │                      │
  ▼                      ▼
LIB-04               CMP-01 ──▶ CMP-02
  │                    │  │         │
  ▼                    │  ▼         ▼
LIB-05               │ CMP-03    VIZ-01 ──▶ VIZ-04 ──▶ VIZ-05
  │                    │                       │
  ▼                    ▼                       ▼
L10N-01             CMP-04 ──────────────▶ VRD-01 ──▶ VRD-02
  │                    │                              │
  ▼                    ▼                              ▼
RPT-04             CMP-05 ──────────────▶ VRD-03    RPT-01
                                                      │
INP-01 ──▶ INP-02 ──▶ INP-03                        ▼
  │          │                                     RPT-02
  ▼          ▼                                       │
PRJ-01 ──▶ PRJ-02 ──▶ PRJ-03 ──▶ PRJ-04            ▼
                                                   RPT-03

API-01 ──▶ API-02 ──▶ API-03 ──▶ API-04

DSK-01 ──▶ DSK-02 ──▶ DSK-03
                   ──▶ DSK-04
                   ──▶ DSK-05
```

**Critical path:** LIB-01 → LIB-03 → CMP-01 → CMP-04 → VRD-01 → RPT-01

If any item on the critical path slips, the release date slips.

---

## 7. Requirement traceability matrix

Every requirement traces back to a source document and forward to a test.

| Req ID | Source | Use case | MoSCoW | Sprint | Test ID |
|---|---|---|---|---|---|
| LIB-01 | library-audit.md §5 | — | Must | 0 | T-LIB-01 |
| LIB-02 | library-audit.md §5 | — | Must | 0 | T-LIB-02 |
| LIB-03 | risks-and-questions.md R-01 | — | Must | 0 | T-LIB-03 |
| LIB-04 | library-audit.md §4 | — | Must | 0 | T-LIB-04 |
| LIB-05 | nfr.md NFR-16 | — | Must | 0 | T-LIB-05 |
| INP-01 | interface-requirements.md §7.1 | UC-02 | Must | 1 | T-INP-01 |
| INP-02 | interface-requirements.md §7.1 | UC-02 | Must | 1 | T-INP-02 |
| INP-03 | interface-requirements.md §7.1 | UC-02 | Must | 1 | T-INP-03 |
| INP-04 | glossary-and-units.md §8.2 | — | Must | 1 | T-INP-04 |
| INP-05 | interface-requirements.md §7.1 | UC-02 | Must | 2 | T-INP-05 |
| INP-06 | use-cases.md UC-02 | UC-02 | Should | 2 | T-INP-06 |
| CMP-01 | concepts/01 | UC-02 | Must | 1 | T-CMP-01 |
| CMP-02 | concepts/01 | UC-02 | Must | 1 | T-CMP-02 |
| CMP-03 | concepts/05 | UC-06 | Must | 1 | T-CMP-03 |
| CMP-04 | concepts/01, use-cases.md UC-02 | UC-02 | Must | 1 | T-CMP-04 |
| CMP-05 | interface-requirements.md §7.2 | UC-02 | Must | 2 | T-CMP-05 |
| CMP-06 | nfr.md NFR-01 | — | Must | 1 | T-CMP-06 |
| CMP-07 | nfr.md NFR-06 | — | Must | 1 | T-CMP-07 |
| VIZ-01 | interface-requirements.md §7.3 | UC-02 | Must | 1 | T-VIZ-01 |
| VIZ-02 | interface-requirements.md §7.3 | UC-02 | Must | 1 | T-VIZ-02 |
| VIZ-03 | interface-requirements.md §7.3 | UC-02 | Must | 1 | T-VIZ-03 |
| VIZ-04 | interface-requirements.md §7.3 | UC-02 | Must | 1 | T-VIZ-04 |
| VIZ-05 | interface-requirements.md §7.3 | UC-06 | Must | 1 | T-VIZ-05 |
| VIZ-06 | nfr.md NFR-02 | — | Must | 1 | T-VIZ-06 |
| VIZ-07 | interface-requirements.md §7.3 | UC-02 | Must | 1 | T-VIZ-07 |
| VIZ-08 | interface-requirements.md §7.3 | — | Should | 2 | T-VIZ-08 |
| VRD-01 | interface-requirements.md §7.2 | UC-02 | Must | 1 | T-VRD-01 |
| VRD-02 | interface-requirements.md §7.2 | UC-02 | Must | 1 | T-VRD-02 |
| VRD-03 | interface-requirements.md §7.2 | UC-02 | Must | 2 | T-VRD-03 |
| RPT-01 | use-cases.md UC-09 | UC-09 | Must | 2 | T-RPT-01 |
| RPT-02 | use-cases.md UC-09 | UC-09 | Must | 2 | T-RPT-02 |
| RPT-03 | use-cases.md UC-09 | UC-09 | Must | 2 | T-RPT-03 |
| RPT-04 | nfr.md NFR-16 | UC-09 | Must | 2 | T-RPT-04 |
| RPT-05 | interface-requirements.md §7.4 | UC-09 | Should | 2 | T-RPT-05 |
| PRJ-01 | mvp-scope.md | — | Must | 2 | T-PRJ-01 |
| PRJ-02 | mvp-scope.md | — | Must | 2 | T-PRJ-02 |
| PRJ-03 | data-requirements.md §4.3 | — | Must | 2 | T-PRJ-03 |
| PRJ-04 | interface-requirements.md §7.4 | — | Must | 2 | T-PRJ-04 |
| PRJ-05 | nfr.md NFR-18 | — | Must | 2 | T-PRJ-05 |
| L10N-01 | nfr.md NFR-16 | — | Must | 1 | T-L10N-01 |
| L10N-02 | glossary-and-units.md §8.2 | — | Must | 1 | T-L10N-02 |
| L10N-03 | nfr.md NFR-16 | — | Must | 1 | T-L10N-03 |
| API-01 | adr/001 | — | Must | 1 | T-API-01 |
| API-02 | adr/001 | — | Must | 1 | T-API-02 |
| API-03 | adr/001 | — | Must | 1 | T-API-03 |
| API-04 | adr/001 | — | Must | 1 | T-API-04 |
| DSK-01 | adr/001 | — | Must | 2 | T-DSK-01 |
| DSK-02 | mvp-scope.md | — | Must | 2 | T-DSK-02 |
| DSK-03 | nfr.md NFR-12, NFR-13 | — | Must | 2 | T-DSK-03 |
| DSK-04 | nfr.md NFR-12, NFR-13 | — | Must | 2 | T-DSK-04 |
| DSK-05 | nfr.md NFR-12, NFR-13 | — | Must | 2 | T-DSK-05 |
| DSK-06 | nfr.md NFR-07 | — | Must | 2 | T-DSK-06 |
| DSK-07 | adr/001 open questions | — | Must | 0 | T-DSK-07 |

---

## 8. Out of scope for v1.0

Explicit exclusions to prevent scope creep during implementation.

| Item | Deferred to | Rationale |
|---|---|---|
| System resistance curve computation | v1.1 (S-01) | Library gap; not part of FAT workflow |
| Operating point determination | v1.1 (S-02) | Depends on system curves |
| NPSH analysis | v1.1 (S-03) | Library gap |
| Pump selection from catalogue | v1.2 (C-01) | Requires pump database infrastructure |
| Multi-pump comparison | v1.2 (C-02) | Secondary use case |
| Impeller trim analysis | v1.2 (C-03) | Library gap |
| PDF export | v1.1 (S-05) | .docx, .json, .html cover the need |
| Unit system toggle (SI ↔ Imperial) | v1.1 | Display-layer only; library stays SI |
| Custom tolerance bands | v1.1 | Pending OQ-12 resolution |
| Multi-user / collaboration | Never (W-03) | Out of product scope |
| Mobile-native app | Never (W-04) | Web on mobile is sufficient |

---

## 9. Acceptance test plan summary

Each requirement ID maps to a test ID (T-{REQ-ID}). Tests are organized by type:

| Test type | Coverage | Tool |
|---|---|---|
| Unit tests | LIB-*, CMP-* | pytest |
| Integration tests | API-*, PRJ-* | pytest + httpx AsyncClient |
| UI tests | INP-*, VIZ-*, VRD-*, L10N-* | Manual test script + optional Playwright |
| Report validation | RPT-* | Manual review + JSON schema validator |
| Performance benchmarks | CMP-06, CMP-07, VIZ-06, NFR-01-03 | Custom benchmark scripts |
| Platform tests | DSK-01-06 | Manual on each target OS |
| Fuzz tests | NFR-18, PRJ-05 | Hypothesis or manual with edge cases |

Test results are recorded in `tests/RESULTS.md` and reviewed at each sprint gate.

---

## 10. Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Project owner | | | |
| Lead developer | | | |
| FAT engineer (reviewer) | | | |

Phase 1 implementation begins only after all three signatures are collected.