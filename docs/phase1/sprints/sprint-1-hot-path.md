# Sprint 1 — Hot path
## Duration: 2-3 weeks
## Goal: A FAT engineer can enter data, see curves, and get a pass/fail verdict

---

## Sprint objective

By the end of Sprint 1, the core value proposition works: a user enters pump rated conditions and test measurements, sees fitted curves with tolerance bands, applies speed correction if needed, and gets an API 610 pass/fail verdict. This is the product. Everything after this is polish.

**Prerequisite:** Sprint 0 gate passed. The stack works end-to-end.

---

## Tasks

### Task 1.1 — Design point input form
**Requirement:** INP-01, INP-03, INP-04
**Effort:** Medium (4-6 hours)

**What to do:**
Build (or refactor from existing) the input form for pump rated conditions. This is the first screen the user sees after opening a project.

**Fields:**
| Field | Label (EN) | Label (PT) | Unit | Valid range | Default |
|---|---|---|---|---|---|
| flow_rate | Rated flow | Vazão nominal | m³/h | > 0 | — |
| head | Rated head | Altura nominal | m | > 0 | — |
| efficiency | Rated efficiency | Eficiência nominal | % | 0-100 | — |
| power | Rated power | Potência nominal | kW | > 0 | — |
| speed | Rated speed | Rotação nominal | RPM | > 0, ≤ 5000 | — |
| npsh_r | NPSH required | NPSH requerido | m | ≥ 0 | — |
| impeller_diameter | Impeller diameter | Diâmetro do rotor | mm | > 0 | — |

**Acceptance criteria:**
- [ ] All 7 fields render with labels and unit indicators
- [ ] Inline validation: red border + message on invalid input (negative, zero where not allowed, out of range)
- [ ] Form state maps to a `DesignPoint` object for API submission
- [ ] Tab order follows the field list top to bottom
- [ ] Labels switch when language toggle changes (L10N-01)

**Claude Code prompt:**
```
Read the existing InputScreen in PumpLabGUI/src/. Refactor or build the design point
form with these 7 fields: flow_rate, head, efficiency, power, speed, npsh_r,
impeller_diameter.

Each field needs:
- A labeled input with the unit shown (e.g. "m³/h")
- Inline validation (red border + error message for invalid values)
- Controlled state that maps to a DesignPoint object

Use the existing i18n system for labels. Add translation keys if missing.
Don't make it pretty yet — make it correct.
```

---

### Task 1.2 — Test point table
**Requirement:** INP-02, INP-03
**Effort:** Medium (4-6 hours)

**What to do:**
Build an editable table for entering test measurements. Each row is one test point. The user needs to add, edit, and delete rows.

**Columns per row:**
| Column | Unit | Valid range |
|---|---|---|
| Point # | — | Auto-increment |
| Flow rate | m³/h | > 0 |
| Head | m | > 0 |
| Power | kW | > 0 |
| Speed | RPM | > 0 |
| Actions | — | Edit / Delete buttons |

**Acceptance criteria:**
- [ ] User can add a new empty row
- [ ] User can edit any cell in any row
- [ ] User can delete a row (with confirmation if > 0 rows)
- [ ] Minimum 5 rows enforced before allowing curve fit (warning shown, button disabled)
- [ ] Row data maps to `TestPoint[]` for API submission
- [ ] Invalid cells highlighted inline

**Claude Code prompt:**
```
Build a TestPointTable component in PumpLabGUI/src/components/.
It needs:
- An "Add point" button that appends a row
- Editable cells for flow, head, power, speed
- A delete button per row
- A counter showing "5 points minimum for curve fit"
- Validation: all values must be positive numbers
- State: array of TestPoint objects

Use a simple HTML table with input fields in cells.
Don't use a heavy table library — keep it lightweight.
```

---

### Task 1.3 — Curve fitting API endpoint (complete)
**Requirement:** CMP-01, CMP-02, CMP-06, CMP-07, API-02
**Effort:** Medium (3-4 hours)

**What to do:**
Complete the `/api/analysis/fit-curve` endpoint from Sprint 0. Add efficiency computation, R² value, and full Pydantic validation.

**Acceptance criteria:**
- [ ] Response includes efficiency curve (η = ρgQH/P), clamped 0-100%
- [ ] Response includes R² for H-Q and P-Q fits
- [ ] Response includes polynomial coefficients
- [ ] Invalid input returns 422 with descriptive error
- [ ] Computation completes in < 200ms for 50 points, degree 4 (NFR-01)
- [ ] Golden numbers test passes with ±2% accuracy (CMP-07)

---

### Task 1.4 — Affinity law correction endpoint
**Requirement:** CMP-03
**Effort:** Small (2-3 hours)

**What to do:**
Create `/api/analysis/affinity-correction` endpoint.

**Logic:**
```
Q_corrected = Q_test × (N_rated / N_test)
H_corrected = H_test × (N_rated / N_test)²
P_corrected = P_test × (N_rated / N_test)³
```

**Acceptance criteria:**
- [ ] Endpoint accepts test points + rated speed + test speed
- [ ] Returns corrected test points
- [ ] Correction is mathematically verified with a known speed ratio (e.g. 2950/2900)
- [ ] If test speed equals rated speed, returns unchanged points

---

### Task 1.5 — Tolerance check endpoint
**Requirement:** CMP-04
**Effort:** Medium (4-6 hours)

**What to do:**
Create `/api/analysis/check-tolerance` endpoint that wraps `PerformanceChecker.check()`.

**Acceptance criteria:**
- [ ] Endpoint accepts fitted curve data + design point
- [ ] Returns per-point verdict: measured value, rated value, deviation %, tolerance limit %, PASS/FAIL
- [ ] Returns overall verdict (ACCEPTED/REJECTED)
- [ ] Tolerance bands follow API 610 tables
- [ ] At least one PASS case and one FAIL case tested

---

### Task 1.6 — Pump curve charts
**Requirement:** VIZ-01, VIZ-02, VIZ-03, VIZ-06
**Effort:** Large (6-8 hours)

**What to do:**
Build three interactive Recharts charts: H-Q, P-Q, η-Q. All share the same X-axis (flow). Each shows the fitted curve as a line and individual test points as markers.

**Chart specifications:**
| Chart | X-axis | Y-axis | Curve color | Point marker |
|---|---|---|---|---|
| H-Q | Flow (m³/h) | Head (m) | Blue solid line | Blue circles |
| P-Q | Flow (m³/h) | Power (kW) | Red solid line | Red circles |
| η-Q | Flow (m³/h) | Efficiency (%) | Green solid line | Green circles |

**All charts must have:**
- Axis labels with units
- Hover tooltip showing (Q, value) at cursor position
- Rated point marked distinctly (larger marker, different shape)
- Responsive sizing
- First paint < 500ms (VIZ-06)

**Acceptance criteria:**
- [ ] Three separate chart components render with real data from the API
- [ ] Test points appear as individual markers overlaid on the fitted line
- [ ] Rated point is visually distinct
- [ ] Hover tooltip works
- [ ] Charts resize with window

**Claude Code prompt:**
```
Create PumpCurveChart.jsx in PumpLabGUI/src/components/ using Recharts.
It should accept props:
- curveData: { flow_rates: [], values: [] } (the fitted curve)
- testPoints: [{ flow, value }] (individual markers)
- ratedPoint: { flow, value }
- xLabel, yLabel, color

Build three instances in CurveScreen.jsx: one for H-Q, one for P-Q, one for η-Q.
Wire them to the API response from usePumpAPI hook.
```

---

### Task 1.7 — Tolerance band overlay
**Requirement:** VIZ-04
**Effort:** Medium (3-4 hours)

**What to do:**
Add API 610 tolerance bands as shaded regions on the H-Q and P-Q charts.

**Acceptance criteria:**
- [ ] Shaded region shows acceptable zone around rated point
- [ ] Band boundaries come from the tolerance check endpoint response
- [ ] Band is semi-transparent so the curve is visible underneath
- [ ] Legend distinguishes "fitted curve" from "tolerance zone"

---

### Task 1.8 — Speed correction UI
**Requirement:** VIZ-05
**Effort:** Medium (3-4 hours)

**What to do:**
When test speed ≠ rated speed, show a toggle or prompt. When activated, display both original (dashed) and corrected (solid) curves.

**Acceptance criteria:**
- [ ] System detects speed mismatch automatically (compare TestPoint.speed vs DesignPoint.speed)
- [ ] User sees a clear prompt: "Test speed differs from rated speed. Apply correction?"
- [ ] Toggle shows/hides corrected curves
- [ ] Original curves shown dashed and muted when correction is active
- [ ] Tolerance check runs on corrected curves when correction is active

---

### Task 1.9 — Verdict display
**Requirement:** VRD-01, VRD-02
**Effort:** Medium (4-6 hours)

**What to do:**
Build the verdict screen showing per-point results and overall verdict.

**Acceptance criteria:**
- [ ] Table with columns: guarantee point, measured H, rated H, deviation %, tolerance %, verdict
- [ ] Same structure for power
- [ ] Each row color-coded: green row for PASS, red for FAIL
- [ ] Overall verdict displayed prominently at top: ACCEPTED (green) or REJECTED (red)
- [ ] All text translatable (EN/PT)

---

### Task 1.10 — Language toggle wiring
**Requirement:** L10N-01, L10N-02, L10N-03
**Effort:** Medium (3-4 hours)

**What to do:**
Wire the language toggle through all Sprint 1 screens. Every user-facing string must switch between EN and PT without page reload or data loss.

**Acceptance criteria:**
- [ ] Toggle visible on all screens
- [ ] Switching language updates all labels, button text, error messages, chart labels
- [ ] Number formatting switches (EN: 1,234.56 / PT: 1.234,56)
- [ ] No data loss on language switch
- [ ] No untranslated strings (scan all components)

---

## Sprint 1 gate review

| Check | Status |
|---|---|
| Design point form validates and submits correctly | [ ] |
| Test point table allows add/edit/delete with validation | [ ] |
| H-Q, P-Q, η-Q charts render with real data | [ ] |
| Tolerance bands visible on charts | [ ] |
| Speed correction toggle works with both curve overlays | [ ] |
| Verdict table shows per-point pass/fail with colors | [ ] |
| Overall verdict (ACCEPTED/REJECTED) displays correctly | [ ] |
| Language toggle works across all screens without data loss | [ ] |
| All API endpoints return proper errors on invalid input | [ ] |
| Golden numbers test still passes (no regressions) | [ ] |
| `pytest tests/ -v` — all green | [ ] |

**Sprint 1 gate = the product demo.** If you can walk someone through: "enter these numbers, click fit, see the curves, see the verdict" — you've built the product. Everything else is supporting infrastructure.

---

## What you learn in Sprint 1

- How to build forms with validation in React
- How to render interactive charts from API data
- How to structure a multi-screen workflow
- How to handle bilingual UI with gettext
- The difference between "it works" and "it works correctly" (tolerance checking)
