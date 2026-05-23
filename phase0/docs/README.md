# PumpLab — Documentation

Phase 0 documentation for the PumpLab project: a dual-target (desktop + web) API 610 centrifugal pump engineering tool.

---

## Table of Contents

1. [Project overview](#1-project-overview)
2. [Document index](#2-document-index)
   - [Phase 0 deliverables](#21-phase-0-deliverables)
   - [Technical concept docs](#22-technical-concept-docs)
   - [Architecture decision records](#23-architecture-decision-records)
3. [Architecture summary](#3-architecture-summary)
4. [MVP scope at a glance](#4-mvp-scope-at-a-glance)
5. [Key non-functional requirements](#5-key-non-functional-requirements)
6. [How to read these docs](#6-how-to-read-these-docs)
7. [Phase 0 gate checklist — punch list](#7-phase-0-gate-checklist--punch-list)

---

## 1. Project overview

PumpLab is an engineering application that automates the Factory Acceptance Test (FAT) workflow for centrifugal pumps to the API 610 standard. It replaces the current notebook + Word workflow with a guided, bilingual (EN/PT) user interface that ships on two targets from a single codebase.

**Primary user** — FAT / performance test engineer who reads pump curves, applies API 610 tolerance bands, and produces acceptance-test reports.

**Computation engine** — the `pump` Python library (~700 LOC), which implements the point/curve/checker pipeline (`DesignPoint → TestPoint[] → PerformanceCurve → PerformanceChecker`) and a bilingual `.docx` report generator.

**Frontend** — a React 18 application (`PumpLabGUI/`) shared verbatim between both targets.

**Targets:**
- **Desktop** — standalone installer on Windows 10+, macOS 12+, Ubuntu 22.04+.
- **Web** — React app served from a thin Python HTTP backend over a REST/JSON boundary.

---

## 2. Document index

### 2.1 Phase 0 deliverables

| # | Deliverable | File | Status |
|---|---|---|---|
| 1 | Library audit | [`library-audit.md`](library-audit.md) | Complete |
| 2 | User profile & use-case registry | [`use-cases.md`](use-cases.md) | Complete |
| 3 | Technical concept docs | [`concepts/README.md`](concepts/README.md) | Complete |
| 4 | Data requirements | [`data-requirements.md`](data-requirements.md) | Complete |
| 5 | Architecture decision record | [`adr/001-dual-target-architecture.md`](adr/001-dual-target-architecture.md) | Accepted |
| 6 | Non-functional requirements | [`nfr.md`](nfr.md) | Complete |
| 7 | Interface requirements | [`interface-requirements.md`](interface-requirements.md) | Complete |
| 8 | Glossary & unit standard | [`glossary-and-units.md`](glossary-and-units.md) | Complete |
| 9 | Risks & open questions | [`risks-and-questions.md`](risks-and-questions.md) | Complete |
| 10 | MVP scope definition | [`mvp-scope.md`](mvp-scope.md) | Complete |

### 2.2 Technical concept docs

Each concept page covers: *what it is · engineering context · governing equations · computation flowchart · library mapping · assumptions · references.*

| # | Domain | Library status | Doc |
|---|---|---|---|
| 1 | Pump performance curves | ✅ implemented | [`concepts/01-pump-performance-curves.md`](concepts/01-pump-performance-curves.md) |
| 2 | System resistance curves | ❌ gap | [`concepts/02-system-resistance-curves.md`](concepts/02-system-resistance-curves.md) |
| 3 | Operating point | ❌ gap | [`concepts/03-operating-point.md`](concepts/03-operating-point.md) |
| 4 | NPSH analysis | ❌ gap | [`concepts/04-npsh-analysis.md`](concepts/04-npsh-analysis.md) |
| 5 | Affinity laws | 🟡 speed-only | [`concepts/05-affinity-laws.md`](concepts/05-affinity-laws.md) |
| 6 | Specific speed | ❌ gap | [`concepts/06-specific-speed.md`](concepts/06-specific-speed.md) |
| 7 | Series & parallel operation | ❌ gap | [`concepts/07-series-parallel-operation.md`](concepts/07-series-parallel-operation.md) |
| 8 | Pipe hydraulics | ❌ gap | [`concepts/08-pipe-hydraulics.md`](concepts/08-pipe-hydraulics.md) |

### 2.3 Architecture decision records

| ADR | Decision | Status |
|---|---|---|
| [001](adr/001-dual-target-architecture.md) | Single React UI + `pump` Python backend for both desktop and web | Accepted |

---

## 3. Architecture summary

```
┌──────────────────────────────────────────────┐
│                 PumpLabGUI                    │
│          React 18 (shared UI code)            │
└──────────┬───────────────────────────────────┘
           │
    ┌──────┴───────┐
    │              │
┌───▼───┐    ┌────▼──────────────────┐
│Desktop│    │         Web           │
│wrapper│    │  Python HTTP backend  │
│(TBD)  │    │  REST/JSON boundary   │
└───┬───┘    └────┬──────────────────┘
    │              │
    └──────┬───────┘
           │
    ┌──────▼──────┐
    │ pump library │
    │  (Python)    │
    └─────────────┘
```

All computation (`PerformanceCurve`, `PerformanceChecker`, report generation) lives exclusively in the `pump` Python library. The React frontend never imports server-side logic; the boundary is a clean JSON contract. See [ADR-001](adr/001-dual-target-architecture.md) for the full rationale.

---

## 4. MVP scope at a glance

The v1.0 release delivers the FAT workflow end-to-end on both targets. Full contract: [`mvp-scope.md`](mvp-scope.md).

**In scope — v1.0**
- UC-02 — Verify pump performance (H-Q, P-Q, η-Q fit + API 610 verdict)
- UC-06 — Speed correction via affinity laws (library API only)
- UC-09 — Report generation (`.docx`, `.json`, `.html`)
- MRT screen (vibration, bearing, noise, seal leakage verdicts)
- Project save / load (JSON round-trip)
- Bilingual EN + PT coverage
- Library packaging (`pyproject.toml`, Python ≥ 3.12)
- Validation against at least one published reference
- Desktop installer + web deployment

**Deferred — v1.1**
- System curve analysis (UC-03), operating point (UC-04), NPSH (UC-05)
- Pump selection from catalogue (UC-01)
- Multi-pump comparison (UC-08), specific speed UI, PDF export

---

## 5. Key non-functional requirements

Full list with acceptance criteria: [`nfr.md`](nfr.md).

| ID | Category | Threshold |
|---|---|---|
| NFR-01 | Performance | Curve computation < 200 ms (50 pts, degree 4) |
| NFR-02 | Performance | First chart paint < 500 ms |
| NFR-06 | Reliability | Predictions within ±2 % of reference |
| NFR-10 | Data | Project save/load round-trips byte-for-byte |
| NFR-12 | Packaging | Desktop install < 200 MB |
| NFR-13 | Packaging | < 5 clicks from download to running |
| NFR-16 | Localisation | Zero untranslated strings in EN ↔ PT switch |

---

## 6. How to read these docs

**Engineers new to pump fundamentals** — start with the *What it is* and *Engineering context* sections of any [concept doc](concepts/README.md).

**Developers implementing a domain** — the *Governing equations + Computation flowchart + Library mapping* triad in each concept doc is the API contract for Phase 1.

**Stakeholders reviewing scope** — [`mvp-scope.md`](mvp-scope.md) is the single source of truth for what ships in v1.0. The sign-off table at the bottom of that document gates the start of Phase 1.

**Unit conventions** — every equation uses SI; the library's canonical units are defined in `pump/utilities/unit_conversion.py:STANDARD_UNITS`. Symbol reference: `Q` flow, `H` head, `P` power, `η` efficiency, `N` speed, `D` diameter. Full glossary: [`glossary-and-units.md`](glossary-and-units.md).

---

## 7. Phase 0 gate checklist — punch list

All 10 deliverables have their content written. The items below are the remaining blockers before Phase 0 can be formally closed and Phase 1 (design + implementation) can begin.

### 7.1 Gate blockers — must close Phase 0

| # | Item | Owner | Blocks |
|---|---|---|---|
| G-01 | Project owner sign-off on all 10 deliverables (sign-off tables in each document) | Project owner | Phase 0 close |
| G-02 | Assign owners to all open risks R-01 → R-12 (currently "TBD" in [`risks-and-questions.md`](risks-and-questions.md) §9.1) | Project owner | Risk governance |
| G-03 | Answer or explicitly carry forward OQ-04 — who is the primary v1.0 user? (FAT engineer recommendation in [`use-cases.md`](use-cases.md) §2.3 needs owner confirmation) | Project owner | MVP scope gate |
| G-04 | Answer or carry forward OQ-09 — what is the v1.0 target delivery date? (required to size Phase 1 and manage R-04) | Project owner | Phase 1 planning |
| G-05 | Answer or carry forward OQ-11 — which reference dataset validates library accuracy? (`examples/B-432301D.ipynb` is the recommendation; needs owner confirmation for Risk R-01) | Project owner | R-01 mitigation |
| G-06 | Decide or carry forward OQ-10 — web hosting target (self-hosted vs SaaS) | Project owner | Phase 1 deployment design |
| G-07 | Decide or carry forward OQ-12 — tolerance band policy (verify vs label "illustrative" + warning; NFR-18) | Project owner | R-10 mitigation |
| G-08 | Re-score all risks ≥ 16 with explicit owner acceptance, or confirm R-01 and R-07 mitigations start at Phase 1 day 1 | Project owner | [`mvp-scope.md`](mvp-scope.md) DoD §8 |

### 7.2 Phase 1 prerequisites — must be done before meaningful Phase 1 work starts

These are not Phase 0 sign-off blockers but must land as Phase 1's first tasks.

| # | Item | Effort | Ref |
|---|---|---|---|
| P-01 | Add `pyproject.toml`, pin deps (`pint`, `numpy`, `matplotlib`, `tabulate`, `python-docx`), declare Python ≥ 3.12 floor | S | R-07; [`library-audit.md`](library-audit.md) §5 |
| P-02 | Compile `.mo` translation catalogues (`msgfmt pump/utilities/locales/{en,pt}/LC_MESSAGES/messages.po`) and add a `make i18n` target | S | R-08; NFR-16 |
| P-03 | Stand up `tests/` with at least one golden-numbers fixture from `examples/B-432301D.ipynb` | M | R-01; NFR-06 |
| P-04 | Fix bugs §4.2–§4.5 in [`library-audit.md`](library-audit.md) (pint import, `PerformanceChecker` `hasattr` guards, fitter sort order, hard-coded `m**3/h`) | S | R-09; report robustness |
| P-05 | Decide desktop wrapper: Electron vs Tauri vs `pywebview` (prototype bench all three against existing GUI; deadline before Phase 2) | M | R-02; ADR-001 open question |
| P-06 | Decide JS polyfit vs Python-only source-of-truth (OQ-08) and document the decision in ADR-002 | S | R-03 |
| P-07 | Answer remaining open questions OQ-01, OQ-02, OQ-03, OQ-05, OQ-06, OQ-07 (lower priority; can be answered progressively during Phase 1) | — | [`risks-and-questions.md`](risks-and-questions.md) §9.2 |
| P-08 | Rewrite root `README.md` beyond its one-line placeholder (install, quickstart, link to docs) | S | [`mvp-scope.md`](mvp-scope.md) DoD §10 |

### 7.3 Deferred to Phase 1 implementation (not Phase 0 scope)

- Library gap domains: system curve (UC-03), NPSH (UC-05), impeller trim (UC-07), series/parallel (UC-08), specific speed.
- GUI screens for the above.
- Project save/load JSON round-trip.
- Build toolchain (Vite/esbuild) replacing browser-side Babel.
- Desktop installer + web deployment pipelines.
