# Interface requirements

**Deliverable 7 — Phase 0**
Status: Draft — pending project owner review
Date: 2026-05-22

This document is not a visual design. It is a *contract*: a list of what the interface must contain, by function. Every requirement below is anchored either to the existing `PumpLabGUI/` prototype (which establishes the project's current ground truth) or to a planned screen that has not been built yet.

The bilingual labels referenced throughout this document live in `PumpLabGUI/app-shell.jsx:3-194` (`I18N.en` and `I18N.pt`). Any new label introduced by a downstream design must be added to both maps simultaneously (cross-references NFR-16).

---

## 7.1 Input requirements

Every numeric or selection input must specify the seven attributes below. Inputs already in the prototype are anchored to the file:line that defines them; planned inputs reference the concept doc that motivates them.

### 7.1.1 Rated point (nameplate) inputs

| Field | Label (EN / PT) | Unit options | Valid range | Default | Input method | Group | Tooltip text |
|---|---|---|---|---|---|---|---|
| `tag` | Pump TAG / TAG da bomba | text | non-empty | `""` (sample: `"P-101A"`) | text field | Identity | "Equipment identifier as stamped on the pump nameplate" |
| `qNom` | Rated flow / Q nominal | m³/h, L/s, GPM (US) | > 0 | `""` (sample: `"120"`) | text field, numeric | Hydraulic | "Flow at the rated duty point" |
| `hNom` | Rated head / Head nominal | m, ft | > 0 | `""` (sample: `"85"`) | text field, numeric | Hydraulic | "Total dynamic head at the rated flow" |
| `nNom` | Rated speed / Rotação nominal | rpm | 100 – 6000 | `""` (sample: `"3550"`) | text field, numeric | Mechanical | "Synchronous or rated motor speed" |
| `pNom` | Rated power / Potência nominal | kW, HP | > 0 | `""` (sample: `"42"`) | text field, numeric | Mechanical | "Brake (shaft) power at the rated duty point" |
| `sgNom` | Relative density / Densidade relativa | — (dimensionless) | 0.5 – 2.0 typical | `"1.000"` | text field, numeric | Fluid | "Specific gravity relative to water at 4 °C" |
| `muNom` | Kinematic viscosity / Viscosidade | cSt | > 0 | `""` (sample: `"1.0"`) | text field, numeric | Fluid | "Kinematic viscosity at the operating temperature" |
| `hShut` | Shutoff head / Head no shutoff | m, ft | > rated head typically | `""` (sample: `"102"`) | text field, numeric | Hydraulic | "Head at zero flow (dead-head)" |

Source: `PumpLabGUI/screen-setup.jsx:110-119`. Validation today is by HTML `type="number"`; richer validation (range checks, required marks) is deferred to Phase 1.

### 7.1.2 Test point inputs (per row)

| Field | Label | Unit | Valid range | Input method |
|---|---|---|---|---|
| `q` | Flow / Vazão | m³/h | ≥ 0 | numeric cell |
| `pSuc` | Suction pressure / P. sucção | kgf/cm² or bar (display toggle) | ≥ 0 (positive abs.) | numeric cell |
| `pDis` | Discharge pressure / P. descarga | kgf/cm² or bar | > pSuc | numeric cell |
| `tW` | Water temp. / Temp. água | °C | 0 – 100 typical | numeric cell |
| `power` | Power / Potência | kW | > 0 | numeric cell |
| `n` | Speed / Rotação | rpm | within ±5 % of `nNom` | numeric cell |

Source: `PumpLabGUI/screen-setup.jsx:135-167`. The "computed head" cell (`hCalc`) is a read-only derived value (formula in `PumpLabGUI/screen-setup.jsx:10-15`).

### 7.1.3 Project metadata inputs

| Field | Label | Input method | Source |
|---|---|---|---|
| `project.name` | Project / Projeto | text field | `screen-setup.jsx:87` |
| `project.operator` | Operator / Operador | text field | `screen-setup.jsx:88` |
| `project.site` | Site / Tag ref. / Local / Tag ref. | text field | `screen-setup.jsx:89` |
| `project.notes` | Notes / Observações | multi-line text | `screen-setup.jsx:91-93` |

### 7.1.4 Global controls

| Control | Type | Options | Default | Source |
|---|---|---|---|---|
| Standard | dropdown | `api610`, `asme73`, `iso5199` | `api610` | `app-shell.jsx:197-201` |
| Pressure unit | segmented toggle | `kgf/cm²`, `bar` | `kgf/cm²` | `app-shell.jsx:262-265`, `main.jsx:55` |
| Language | segmented toggle | `EN`, `PT` | `EN` | `app-shell.jsx:275-278` |
| Visual aesthetic | dropdown (tweaks panel) | `instrument`, `industrial`, `saas`, `dark` | `instrument` | `main.jsx:208-216` |
| Accent colour | swatch picker | four hex values | `#1f3a8a` | `main.jsx:36-40, 217-222` |
| Density | radio | `normal`, `compact` | `normal` | `main.jsx:223-228` |
| Parallel operation | checkbox | on / off | off | `app-shell.jsx:321-324` |

### 7.1.5 MRT inputs

| Group | Field | Unit | Source |
|---|---|---|---|
| NDE (non-drive end) | vibration, bearing, noise, seal | mm/s rms, °C, dB(A), ml/h | `screen-mrt.jsx:80-84` |
| DE (drive end) | vibration, bearing, noise, seal | same | same |

### 7.1.6 Planned inputs (UC-03 / UC-05 dependencies — not yet in GUI)

| Group | Field | Concept doc |
|---|---|---|
| Suction installation | source elevation, suction line segments (L, D, ε), fittings (K-factors) | concept 04 |
| Vapour pressure | per fluid, per temperature | concept 04 |
| System geometry | source / dest elevations and pressures, full piping graph | concept 02 |
| Impeller geometry | rated impeller diameter (for UC-07 trim) | concept 05 |

---

## 7.2 Output requirements

### 7.2.1 KPI cards (Results screen)

| KPI | What is displayed | Update trigger | Precision | Colour rule | Export | Source |
|---|---|---|---|---|---|---|
| Predicted head at rated Q | numeric + unit + Δ% vs nameplate + verdict badge | on calc | 2 dp | green pass / amber warn / red fail | included in `.docx` | `screen-results.jsx:128-133` |
| Predicted power at rated Q | numeric + unit + Δ% + verdict | on calc | 2 dp | same | yes | same |
| Predicted efficiency at rated Q | numeric + unit + verdict | on calc | 1 dp | same | yes | same |
| BEP | flow at BEP + hint (η at BEP) | on calc | 1 dp | none | yes | same |

### 7.2.2 Tolerance table (Results screen)

| Column | Content | Source |
|---|---|---|
| Metric | label (Q, H, P, η) | `screen-results.jsx:92-97` |
| Nameplate | numeric or `—` if not applicable | same |
| Predicted | polynomial-evaluated value at rated Q | same |
| Δ% | signed % deviation; colour by magnitude | `screen-results.jsx:202-210` |
| Tolerance | low / high band per standard | `app-shell.jsx:204-208` |
| Verdict | badge `pass` / `warn` / `fail` | `screen-results.jsx:99-100` |

The overall verdict (sidebar + table header) is `fail` if any row is `fail`, else `warn` if any row is `warn`, else `pass` (`screen-results.jsx:100`).

### 7.2.3 Test-points review table

A flat per-point table showing measured Q, H, P, η, plus the fitted H from the polynomial and the per-point deviation. Source: `screen-results.jsx:229-265`.

### 7.2.4 MRT outputs

Each of the four MRT metrics (vibration, bearing temp, noise, seal leak) presents:

- The numeric reading
- A gauge bar with three coloured zones (OK / warn / fail)
- A verdict badge
- A 4-hour time-series chart (currently generated; planned to accept real samples — `screen-mrt.jsx:170-186`)

Source: `screen-mrt.jsx:41-71`.

### 7.2.5 Status indicators

| Indicator | Where | Trigger | Source |
|---|---|---|---|
| Dirty marker `●` / clean marker `○` | top bar | any input change | `app-shell.jsx:270` |
| Toast | bottom-centre overlay, 2.2 s | calc complete, sample loaded, unit converted, export ready | `main.jsx:111-115, 189-194` |
| Status bar | bottom of screen | always visible; shows TAG, standard, unit, point count, last calc timestamp | `app-shell.jsx:338-356` |
| Verdict badge | sidebar Results entry | after each calc | `app-shell.jsx:301-305` |

### 7.2.6 Output precision rules

Defined once in [`data-requirements.md`](data-requirements.md) §4.2.1. Interface implementations MUST consult that table rather than picking precision per call.

---

## 7.3 Chart requirements

### 7.3.1 Performance curves (Results screen — H, P, η vs Q)

| Attribute | Requirement | Source |
|---|---|---|
| Axes | X: flow [m³/h] with auto-fit range × 1.10 padding; Y: per metric (m / kW / %) with `[max(0, min×0.85), max×1.15]` padding | `charts.jsx:71-74` |
| Curves | One polynomial fit (solid line) + measured points (filled circles); colour from `--accent` CSS variable | `charts.jsx:148-153` |
| Interactivity | Hover: not implemented today, planned for v1.1; tabbed view between H / P / η; click on a tab swaps the visible chart instantly | `screen-results.jsx:138-169` |
| Annotations | Nameplate guide (vertical + horizontal dashed lines + label) on the H and P charts; tolerance band shaded around the fit polynomial | `charts.jsx:91-106, 140-146` |
| Legend | Below chart; entries: polynomial fit, test points, nameplate, tolerance band | `screen-results.jsx:170-176` |
| Out-of-tolerance markers | Points outside the tolerance band rendered red | `charts.jsx:151-153` |
| Export | SVG (native — the chart *is* SVG, can be copied straight to clipboard); PNG via screenshot or planned rasterisation | TBD |

### 7.3.2 MRT continuous-monitoring chart

| Attribute | Requirement | Source |
|---|---|---|
| Axes | X: 0 – 4 h; Y: three independent scales (vibration mm/s, bearing °C, noise dB(A)) | `screen-mrt.jsx:188-230` |
| Curves | One line per metric (vibration accent, bearing amber, noise teal) | `screen-mrt.jsx:194-198` |
| Sampling | Currently synthetic 80-sample series (`generateMrtSeries`); real-data input is a v1.1 task | `screen-mrt.jsx:170-186` |
| Annotations | Grid lines at quarter-hour intervals | `screen-mrt.jsx:210-216` |
| Legend | In chart header; "Continuous monitoring · 4 h" title + per-metric mini-legends | `screen-mrt.jsx:125-136` |

### 7.3.3 Planned charts (UC-03 / UC-04)

System curves and operating-point overlays: a single chart showing pump H-Q curve, system H-Q curve, intersection cross-hair, BEP marker, NPSH-A line. Spec to be drafted in Phase 1.

---

## 7.4 Navigation and workflow

### 7.4.1 Top-level navigation

Four tabs in the left sidebar, persistent across the session:

| Tab | Screen | Order | Visible always? |
|---|---|---|---|
| Setup | `screen-setup.jsx` | 1 | yes |
| Results | `screen-results.jsx` | 2 | yes; verdict badge appears after a calc |
| Mechanical Running | `screen-mrt.jsx` | 3 | yes |
| Reports | `screen-reports.jsx` | 4 | yes |

Source: `PumpLabGUI/app-shell.jsx:295-313`.

### 7.4.2 Workflow

The intended user path is **Setup → Calculate → Results → MRT → Reports**, but the user is free to skip between any tabs at any time. Calculate is a top-bar action (`main.jsx:282`) and a primary button on the Setup screen page header (`screen-setup.jsx:65`).

### 7.4.3 Project concept

The session carries one "project" at a time. Project metadata, rated point, test points, and MRT entries all live in the same React state (`main.jsx:59-73`). There is currently no New / Open / Save-As workflow — those are planned per [`data-requirements.md`](data-requirements.md) §4.3 and tracked as Phase-1 work.

### 7.4.4 Undo / redo

Not implemented; not a v1.0 requirement. Documented as out of scope.

### 7.4.5 Print / export workflow

| Step | Where | Mechanism |
|---|---|---|
| Choose format | Export modal | `screen-reports.jsx:71-126` |
| Choose included sections | same | checkboxes for inputs / charts / tolerance / MRT |
| Download | same | client-side file download (today the `.docx` round-trips through the Python backend) |

### 7.4.6 Keyboard behaviour

The Setup screen footer documents one keyboard convention: `↵` advances to the next row in the test-points table (`screen-setup.jsx:176-177`). Implementation of this behaviour is a v1.0 task; documented here so the spec captures the intent.

---

## 7.5 Accessibility floor

For v1.0, the GUI must satisfy the following minimum bar (full WCAG-AA audit is a v1.1 deliverable per [`nfr.md`](nfr.md) NFR-out-of-scope list):

- Every interactive element reachable by `Tab` in a sensible order.
- Every form input has a visible label (already enforced by `NumField` in `screen-setup.jsx:18-37`).
- Colour is never the only signal for a verdict — every badge also carries a text label (`pass`, `warn`, `fail`).
- Default contrast ratios in the "instrument" aesthetic must meet WCAG AA for normal text. To be verified during Phase 2.

---

## 7.6 Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Project owner | | | |
| Designer (if separate) | | | |
| Library author | | | |
