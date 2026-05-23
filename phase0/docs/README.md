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
| 1 | Library audit | [`library-audit.md`](library-audit.md) | Draft |
| 2 | User profile & use-case registry | [`use-cases.md`](use-cases.md) | Draft |
| 3 | Technical concept docs | [`concepts/README.md`](concepts/README.md) | Complete |
| 4 | Interface requirements | [`interface-requirements.md`](interface-requirements.md) | Draft |
| 5 | Architecture decision record | [`adr/001-dual-target-architecture.md`](adr/001-dual-target-architecture.md) | Accepted |
| 6 | Non-functional requirements | [`nfr.md`](nfr.md) | Draft |
| 7 | Data requirements | [`data-requirements.md`](data-requirements.md) | Draft |
| 8 | Glossary & unit standard | [`glossary-and-units.md`](glossary-and-units.md) | Draft |
| 9 | Risks & open questions | [`risks-and-questions.md`](risks-and-questions.md) | Draft |
| 10 | MVP scope definition | [`mvp-scope.md`](mvp-scope.md) | Draft |

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
