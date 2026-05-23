# Risk register and open questions

**Deliverable 9 — Phase 0**
Status: Living document — owners and deadlines pending project owner sign-off
Date: 2026-05-22

A risk's *score* is `Likelihood × Impact` on a 1 – 5 ordinal scale; the score is recorded for ranking only and carries no claim to be a calibrated probability. Likelihood and impact ratings are the author's judgement after reading the codebase; they should be revisited by the project owner.

---

## 9.1 Risks

### 9.1.1 Top risks (score ≥ 12 or with hard external dependencies)

| ID | Risk | Likelihood | Impact | Score | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|
| **R-01** | Library accuracy not validated against any external standard (no tests, no reference data). The `PerformanceChecker` could ship producing wrong verdicts; the consequence in a customer FAT context is severe | 4 / 5 | 5 / 5 | 20 | Stand up `tests/` against one of the example notebooks (`examples/B-432301D.ipynb` is the most thoroughly worked) and at least one published reference. P0 item in [`library-audit.md`](library-audit.md) §5 | TBD | Open |
| **R-02** | Desktop wrapper choice (Electron vs Tauri vs `pywebview`) is deferred (ADR-001 open question). If the choice is forced late the chosen wrapper may not meet NFR-12 (install size) or NFR-13 (install steps) and a rework lands at the worst time | 3 / 5 | 4 / 5 | 12 | Prototype-bench all three candidates with the existing GUI early in Phase 1; decide before the v1.0 freeze date. Captured as the open architectural decision in [`adr/001-dual-target-architecture.md`](adr/001-dual-target-architecture.md) | TBD | Open |
| **R-03** | Real-time chart interactivity is slow when computation lives in Python and charts live in JavaScript. The current prototype dodges this by re-implementing the fit in JS (`PumpLabGUI/charts.jsx:4-35`), but that re-implementation now needs to be kept in sync with the Python version — a second source of truth | 4 / 5 | 3 / 5 | 12 | Decide whether the project keeps the JS polyfit (fast, drifty) or routes every fit through Python (consistent, slower) before the v1.0 freeze. Track drift between the two implementations in a regression test | TBD | Open |
| **R-04** | Dual-target maintenance burden exceeds the team's capacity (the team is one author per git log). Already the prototype has a mini React app + a Python library + bilingual templates; v1.0 adds tests, a build step, a desktop wrapper, and installers | 4 / 5 | 4 / 5 | 16 | Lock MVP scope hard (Deliverable 10); defer everything not blocking the FAT workflow to v1.1; consider time-boxing v1.0 explicitly | TBD | Open |
| **R-05** | Scope creep into full pump-selection software (catalogues, ANSI/HI fluid-property tables, fluid library, network solver). The Phase 0 spec itself lists eight gap domains and the temptation to ship them in v1.0 will be strong | 4 / 5 | 3 / 5 | 12 | The MVP-scope document (Deliverable 10) explicitly lists the "must not ship" items. Any new feature request lands in the v1.1 backlog by default unless the project owner approves the scope change | TBD | Open |
| **R-06** | No pump database means UC-01 (selection) cannot be fully delivered even when the math lands. Without a catalogue the application engineer cannot use PumpLab end-to-end for selection | 5 / 5 | 2 / 5 | 10 | Define UC-01 as a v1.1+ feature; in v1.0 the user works with pumps they already know (their own measurements, their vendor's data sheet). Documented in [`use-cases.md`](use-cases.md) §2.3 | TBD | Open |

### 9.1.2 Additional risks discovered during Phase 0 audit

| ID | Risk | Likelihood | Impact | Score | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|
| **R-07** | Library is not pip-installable today (no `pyproject.toml`, [`library-audit.md`](library-audit.md) §3). Without packaging the desktop bundler cannot lay it down deterministically and the web target cannot install it into a virtualenv reproducibly | 5 / 5 | 4 / 5 | 20 | Add `pyproject.toml` and pin dependencies as the first Phase-1 task (P0 item in audit §5) | TBD | Open |
| **R-08** | Compiled translation catalogues (`.mo`) are missing under `pump/utilities/locales/`. The Portuguese path silently falls back to English ([`library-audit.md`](library-audit.md) §4.6), violating NFR-16 | 5 / 5 | 2 / 5 | 10 | Add a `make i18n` step that runs `msgfmt`; commit the compiled catalogues. P0 item in audit §5 | TBD | Open |
| **R-09** | `PerformanceChecker` raises `AttributeError` when the design point lacks `head_shutoff` or `breaking_power` ([`library-audit.md`](library-audit.md) §4.3). This is on the FAT-engineer happy path and will break real reports the moment a design point is partial | 4 / 5 | 3 / 5 | 12 | Mirror `hasattr` guards in every consumer; compute sentinel `None` values up-front; cover with a regression test. Documented but not yet fixed | TBD | Open |
| **R-10** | Standards tolerance bands defined in `PumpLabGUI/app-shell.jsx:204-208` and MRT acceptance bands in `screen-mrt.jsx:5-10` are labelled "illustrative" of API 610 12th ed. They have not been verified against the published standards in this revision. Shipping with unverified bands invites a correctness complaint from any user who *does* know the standards | 3 / 5 | 4 / 5 | 12 | Per-band audit against the cited standards before v1.0 release. Captured as NFR-18 in [`nfr.md`](nfr.md) | TBD | Open |
| **R-11** | `pump.point.Point` is dead code with a broken property that was auto-fixed during Phase 0, but the class as a whole has no documented purpose and overlaps `TestPoint` ([`library-audit.md`](library-audit.md) §4.7). Leaving it in place adds maintenance surface and confuses new contributors | 2 / 5 | 2 / 5 | 4 | Deprecate in Phase 1; remove in v1.0 unless a non-test use case emerges | TBD | Open |
| **R-12** | Single-author bus factor. The git log shows one contributor; if the author becomes unavailable for any reason the project halts | 2 / 5 | 5 / 5 | 10 | Documentation completeness (Phase 0 already pushing in that direction); recruit a second reader for the audit and concept docs; deposit the repository on a hosted forge | TBD | Open |

### 9.1.3 Risk-response posture

The project's default response to each risk class:

- **Score ≥ 16 (critical)**: must be actively mitigated before v1.0 release. R-01, R-04, R-07 sit here.
- **Score 10 – 15 (significant)**: must be actively *managed* and reviewed monthly; accept may be considered only with project-owner sign-off.
- **Score ≤ 8 (minor)**: accept and monitor; revisit at each Phase gate.

---

## 9.2 Open questions

Each open question carries an owner and a deadline by which it must be resolved. Until then the project may not progress past the gate that depends on the answer.

| ID | Question | Where it bites | Owner | Deadline | Resolution |
|---|---|---|---|---|---|
| **OQ-01** | Does the library need to handle non-water fluids (oil, hydrocarbons, slurries) in v1.0, or only water-based FAT workflows? | Determines whether ANSI/HI 9.6.7 viscosity correction is in scope ([`concepts/05-affinity-laws.md`](concepts/05-affinity-laws.md)) | TBD | TBD | |
| **OQ-02** | What curve fitting method is canonical: polynomial (current, degree 4 default), spline, or both with a switch? API 610 12th ed. allows either | Affects `PerformanceFitter` API; the library defaults to degree 4 today | TBD | TBD | |
| **OQ-03** | Are there existing pump databases (vendor catalogues, customer fleets) that should be integrated? | UC-01 readiness; database choice for v1.1+ | TBD | TBD | |
| **OQ-04** | Who is the *primary* target user for v1.0 — the FAT engineer (repo evidence is strong) or the application / selection engineer? | Decides whether UC-02 / UC-09 are MVP and UC-01 is v1.1, or the other way round | TBD | TBD | Recommended interpretation in [`use-cases.md`](use-cases.md) §2.3: FAT engineer primary |
| **OQ-05** | Is there budget for code-signing certificates for the desktop installer (Windows + macOS)? | Determines whether the desktop target ships with a friction-full SmartScreen / Gatekeeper warning or a polished installer | TBD | TBD | |
| **OQ-06** | Do we need to read vendor-specific data formats (Sulzer, Flowserve, ITT Goulds, KSB, etc.) in v1.0? | Each vendor format is a bespoke parser; adds scope quickly | TBD | TBD | Recommended: out of scope for v1.0 |
| **OQ-07** | Is multi-language support beyond EN / PT needed for v1.0? | Adds translation effort linearly; current `gettext` plumbing makes the *technical* addition cheap | TBD | TBD | Recommended: hold at EN / PT for v1.0 |
| **OQ-08** | Should the JS-side polynomial fit in `PumpLabGUI/charts.jsx:4-35` be retained for snappy in-browser previews, or replaced by a backend call so there is one source of truth? | R-03 mitigation | TBD | TBD | |
| **OQ-09** | What is the canonical *target* delivery date for v1.0? | Required to size the Phase 1 work plan and to scope-cut against R-04 | TBD | TBD | |
| **OQ-10** | Hosting target for the web app: self-hosted on the user's infrastructure, a single PumpLab-operated SaaS, or both? | Drives the Phase-1 deployment and auth design (the Phase 0 ADR keeps both options open) | TBD | TBD | |
| **OQ-11** | What reference data set will validate library accuracy (NFR-06)? One of the existing examples (which one), an ISO 9906 published acceptance test, or a textbook problem? | R-01 mitigation; without an answer the validation work cannot start | TBD | TBD | |
| **OQ-12** | What is the policy for the tolerance bands today labelled "illustrative"? Verify before release (R-10) or relabel as project defaults and surface a "consult your standard" warning? | NFR-18 acceptance | TBD | TBD | |

---

## 9.3 Maintenance

This document is the *living register*. Every Phase 1 and beyond planning session must:

1. Re-score every open risk against the current code state.
2. Close any question whose answer has settled; archive in §9.4 below.
3. Add any new risk or question raised by recent work.

Closed entries are kept for traceability — they answer "why did we do it this way" at retrospective time.

---

## 9.4 Closed entries

*(None yet — register opened in this revision.)*

---

## 9.5 Sign-off (Phase 0 baseline)

| Role | Name | Date | Signature |
|---|---|---|---|
| Project owner | | | |
| Library author | | | |
