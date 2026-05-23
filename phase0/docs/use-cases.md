# User profile and use case registry

**Deliverable 2 — Phase 0**
Status: Draft — priorities pending project owner sign-off
Author: Cristofer Antoni Souza Costa (`pump/__init__.py:13`)
Date: 2026-05-22

---

## 2.1 Who uses this

The user profile is reconstructed from observable evidence in the repository: the example notebooks, the report templates, the GUI's language toggle, and the git history. Where a profile attribute cannot be substantiated from the repository it is marked **(pending owner input)** rather than invented.

### Primary user — Performance test / FAT engineer

- **Job title.** Pump performance / Factory Acceptance Test (FAT) engineer. Evidence: the report templates are titled "Factory Acceptance Test" and explicitly reference API 610 §8.3.3.4.3 (`pump/utilities/report.py:300-309`); example notebooks (`examples/B-432301D.ipynb`, `examples/52-P-11AB.ipynb`, etc.) walk through a complete FAT workflow.
- **What they know.** Read a pump curve, understand head / flow / power / efficiency / NPSH, know API 610 tolerance bands. Evidence: the existing library exposes a `PerformanceChecker` whose tolerance defaults (±3 % head, +4 % power, 5–10 % shutoff per rated head — `pump/performance_curve.py:637-657`) are only intelligible to someone fluent in API 610 §8.3.
- **Tools used today.** Jupyter notebooks (`examples/*.ipynb`) and Microsoft Word (the `.docx` reports in `examples/`). The GUI prototype (`PumpLabGUI/`) is intended to replace the notebook workflow with a guided UI.
- **Working environment.** Desktop / laptop. Evidence: `python-docx` `.docx` output is a desktop-office artefact; no mobile-first concerns appear anywhere in the codebase.
- **Language.** Bilingual EN / PT. Evidence: dual templates `pump/templates/template_en.docx` and `template_pt.docx`; `gettext` `.po` files for both languages; `I18N` dictionary in `PumpLabGUI/app-shell.jsx:3-194` covers both.

### Secondary user — Pump application / selection engineer

(Pending owner confirmation as a v1.0 audience.) Evidence currently in the repo is **thin**: the library has no system-curve, operating-point, or selection helpers (`docs/library-audit.md` §2). The use cases UC-01, UC-03, UC-04 are inferred from the Phase 0 spec template, not from observed library usage.

### Tertiary user — Pump engineering student / learner

(Pending owner confirmation.) The Phase 0 spec lists UC-10 (educational diagrams) but no evidence in the current repository indicates pedagogy is an active concern. Flagging as low priority unless the owner asserts otherwise.

### Roles not represented in the repository

- Plant maintenance engineers, rotating-equipment consultants, pump sales engineers — listed in the Phase 0 template (`phase1/00_phase_spec.md:69`) but have **no evidence in the codebase** of being targeted users. Treat as out of scope unless owner asserts otherwise.

---

## 2.2 Use case registry

Each use case below carries five fields beyond the spec template:

- **Status against current library:** ✅ supported, 🟡 partial, ❌ gap. Cross-referenced to `docs/library-audit.md` §2.
- **Concept domain:** which `docs/concepts/0X-*.md` doc covers the engineering math.
- **Primary screen in the GUI:** which `PumpLabGUI/screen-*.jsx` already addresses (or would address) the use case.
- **Acceptance criterion:** the observable outcome that proves the use case is delivered.
- **Priority:** **pending project owner sign-off**. Defaults below are recommendations, not decisions.

### UC-01 — Select a pump for given conditions

| Field | Value |
|---|---|
| Actor | Application engineer (secondary user — pending) |
| Trigger | New project / RFQ |
| Input | Required flow, required head, fluid (ρ, μ), constraints (NPSH-A, motor service factor, footprint) |
| Expected output | One or more candidate pumps with curves, ranked by efficiency at duty |
| Status | ❌ gap — no pump catalogue exists in the library |
| Concept domain | 01, 03, 04, 06 (curves + operating point + NPSH + specific speed) |
| Primary screen | not present in `PumpLabGUI/` |
| Acceptance criterion | Given (Q, H, fluid), system returns ≥ 1 ranked candidate from a pump database |
| Priority | Pending — recommended **defer to v1.1** (requires pump catalogue, large dependency) |

### UC-02 — Verify pump performance (FAT)

| Field | Value |
|---|---|
| Actor | FAT engineer (primary user) |
| Trigger | Performance test in progress, or report drafting after a test |
| Input | Rated nameplate (`rated.{tag, qNom, hNom, nNom, pNom, sgNom, muNom, hShut}`) + measured test points (`points[*].{q, pSuc, pDis, tW, power, n}`) — schema visible in `PumpLabGUI/main.jsx:3-21` |
| Expected output | Fitted H-Q / P-Q / η-Q curves, deviation table vs nameplate, pass / warn / fail verdict per metric and overall |
| Status | ✅ supported by `pump.PerformanceCurve`, `PerformanceChecker`, and the GUI Results screen (`PumpLabGUI/screen-results.jsx`) |
| Concept domain | 01, 05 (curves + affinity for speed correction) |
| Primary screen | `screen-setup.jsx` → `screen-results.jsx` |
| Acceptance criterion | For a known reference test, the GUI's predicted H, P, η at rated Q match `pump.PerformanceChecker.report_summary` outputs within floating-point tolerance |
| Priority | Pending — recommended **must-ship (MVP)** |

### UC-03 — Analyse system curve

| Field | Value |
|---|---|
| Actor | Application / design engineer |
| Trigger | New piping design or modification |
| Input | Pipe segments (L, D, roughness), fittings (K-factors), static head, fluid properties |
| Expected output | `H_system(Q)` curve over the relevant flow range |
| Status | ❌ gap (`docs/library-audit.md` §2 — no system module) |
| Concept domain | 02, 08 (system curve + pipe hydraulics) |
| Primary screen | not present in `PumpLabGUI/` |
| Acceptance criterion | Given a defined system, the library returns a tabulated `H_system(Q)` agreeing with a Crane-TP-410 hand calculation on a reference geometry |
| Priority | Pending — recommended **defer to v1.1** |

### UC-04 — Find operating point

| Field | Value |
|---|---|
| Actor | Any engineer |
| Trigger | Design verification or performance check |
| Input | A `PerformanceCurve` plus a `SystemCurve` |
| Expected output | `OperatingPoint(Q*, H*, η*, P*, BEP ratio)` |
| Status | ❌ gap |
| Concept domain | 03 |
| Primary screen | not present |
| Acceptance criterion | Given paired curves with a known intersection, the library returns `Q*` within 0.5 % of the analytical or graphical reference |
| Priority | Pending — recommended **defer to v1.1** (blocked by UC-03) |

### UC-05 — Check NPSH margin

| Field | Value |
|---|---|
| Actor | Application engineer |
| Trigger | Cavitation concern or new installation |
| Input | Suction-side installation parameters, fluid (with `vapour_pressure`), operating flow |
| Expected output | NPSH-A, NPSH-R at Q, margin (NPSH-A − NPSH-R) and ratio, cavitation-safe verdict |
| Status | ❌ gap |
| Concept domain | 04 |
| Primary screen | not present |
| Acceptance criterion | Given a reference installation from a textbook problem, NPSH-A within 2 % and the verdict matches |
| Priority | Pending — recommended **defer to v1.1** |

### UC-06 — Evaluate speed change (VFD)

| Field | Value |
|---|---|
| Actor | Application engineer |
| Trigger | VFD application or speed-trim study |
| Input | A measured `PerformanceCurve` and the target speed `N₂` |
| Expected output | New `PerformanceCurve` at `N₂` with H, P, η transformed by the affinity laws |
| Status | ✅ supported by `pump.PerformanceCurve.to_speed` (`pump/performance_curve.py:435-504`) |
| Concept domain | 05 |
| Primary screen | not present in the GUI (library-only today) |
| Acceptance criterion | Round-trip: `curve.to_speed(N).to_speed(curve.points[0].speed_of_rotation)` produces a curve with H / P / η differing from the original by < 1e-6 at corresponding Q values |
| Priority | Pending — recommended **must-ship (MVP)** for library; **defer GUI surface to v1.1** |

### UC-07 — Evaluate impeller trim

| Field | Value |
|---|---|
| Actor | Application engineer |
| Trigger | Oversized pump found during selection or operation |
| Input | A `PerformanceCurve` and the target impeller diameter `D₂` |
| Expected output | New `PerformanceCurve` at `D₂` with H, P, η transformed by the diameter affinity branch |
| Status | ❌ gap — diameter branch not implemented (`docs/concepts/05-affinity-laws.md` library mapping) |
| Concept domain | 05 |
| Primary screen | not present |
| Acceptance criterion | Same round-trip test as UC-06, with diameter scaling |
| Priority | Pending — recommended **defer to v1.1** |

### UC-08 — Compare pumps

| Field | Value |
|---|---|
| Actor | Sales engineer (pending owner — secondary user) |
| Trigger | Customer selection / bid evaluation |
| Input | Multiple `PerformanceCurve` objects (same fluid) |
| Expected output | Overlay chart of H-Q and η-Q with a side-by-side comparison table at user-chosen Q |
| Status | ❌ gap — `PerformanceCurve.plot_performance_curve` plots a single curve only |
| Concept domain | 01 (and 07 if comparing combined configurations) |
| Primary screen | not present |
| Acceptance criterion | Given three curves and a target Q, all three appear on a single chart with markers at Q, plus a numeric table |
| Priority | Pending — recommended **defer to v1.1** |

### UC-09 — Generate report

| Field | Value |
|---|---|
| Actor | FAT engineer (primary user) |
| Trigger | Test complete, client deliverable due |
| Input | Complete `PerformanceChecker.report_summary`-style structure |
| Expected output | `.docx` (today), `.pdf`, `.html`, `.json` (planned) report containing inputs, charts, verdicts |
| Status | 🟡 partial — `.docx` works (`pump.utilities.report.ReportGenerator`); other formats are stubbed in `PumpLabGUI/screen-reports.jsx:30-50` but not wired to a backend |
| Concept domain | 01, 02, 03, 04, 05 (all the math the report consumes) |
| Primary screen | `screen-reports.jsx` |
| Acceptance criterion | A round-trip of one of the existing examples (`examples/Report_B-432301D_*.docx`) reproduces the same data structure and tables |
| Priority | Pending — recommended **must-ship (MVP)** |

### UC-10 — Learn pump fundamentals

| Field | Value |
|---|---|
| Actor | Student or engineer new to pumps (pending owner — tertiary user) |
| Trigger | Self-study or onboarding |
| Input | Conceptual parameters (no real pump data) |
| Expected output | Interactive educational diagrams keyed to `docs/concepts/`; pluggable sample data |
| Status | 🟡 partial — `docs/concepts/` exists; no interactive surface in the GUI |
| Concept domain | All eight |
| Primary screen | not present |
| Acceptance criterion | "Load sample data" already exists in the GUI tweaks panel (`PumpLabGUI/main.jsx:232-237`); educational mode would link sample data to a concept doc |
| Priority | Pending — recommended **out of scope for MVP** (low evidence of demand in repo) |

---

## 2.3 Priority summary (recommendations, pending sign-off)

| Priority | Use cases | Rationale |
|---|---|---|
| **Must ship (MVP)** | UC-02, UC-06 (library), UC-09 | These are what the existing codebase already does or nearly does. Shipping them is shipping the project's primary value to its primary user (FAT engineer). |
| **Defer to v1.1** | UC-01, UC-03, UC-04, UC-05, UC-07, UC-08 | All depend on Phase-1 library work (system curve, NPSH, impeller trim, comparison plotting). |
| **Out of scope** | UC-10 (educational mode) | Low repo evidence of demand; can be added as a thin layer over the concept docs in v1.2+. |

---

## 2.4 Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Project owner | | | |
| Library author | | | |

When this document is signed, Deliverable 2 of Phase 0 is complete. The priorities recorded here flow into Deliverable 10 (MVP scope).
