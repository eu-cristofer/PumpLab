# ADR 001 — Dual-target architecture: shared React UI over the `pump` Python library

**Deliverable 5 — Phase 0**
Status: **Accepted** (documenting an already-made choice; not a re-evaluation)
Date: 2026-05-22
Decider: Project owner (Cristofer Antoni Souza Costa)

---

## Context

The PumpLab product ships simultaneously as a **standalone desktop application** and a **web application**. The Phase 0 specification (`phase1/00_phase_spec.md` §5) lists the architectural choices that must be locked before design work begins: how the Python computation library is packaged, how the desktop and web targets share UI code, and what wrapper technology hosts the desktop build.

The Phase 0 template asks for a fresh weighted decision matrix scoring options such as Electron + React, Tauri + React, and PyQt + React. This ADR does **not** run that exercise from scratch. The project owner has confirmed that the substantive choice has already been made by the existing prototype work in `PumpLabGUI/`, which is a working React 18 application loaded via browser-side Babel against the `pump` Python library. The purpose of this ADR is therefore to record the chosen architecture, its rationale, the trade-offs it accepts, and the few residual decisions that are *not* yet locked.

## Decision

PumpLab adopts a **single React frontend + single Python backend** architecture in which both desktop and web targets render the same UI code against the same computation engine.

The decision in its smallest form:

1. **Computation engine.** All performance, hydraulic, NPSH, and report-generation logic lives in the `pump` Python package. The package is the single source of computational truth for both targets.
2. **Frontend.** The user interface is the React 18 application currently in `PumpLabGUI/`. Every screen, chart, and form control is shared verbatim between desktop and web.
3. **Web target.** The React app is served from a thin Python HTTP backend that exposes `pump` over a REST/JSON boundary. The frontend never imports a server-side library; the boundary is a clean JSON contract.
4. **Desktop target.** The same React app is loaded inside a native window via a desktop wrapper (currently un-chosen between Electron, Tauri, or a Python-native webview); the wrapper either spawns the Python backend as a sub-process or links against the library directly via a chosen IPC mechanism. The wrapper choice is the **one open question** this ADR carries forward.
5. **Build toolchain.** The current `PumpLabGUI/` prototype uses browser-side `@babel/standalone` and unpkg-hosted React (`PumpLabGUI/index.html:14-16`). This is acceptable for the prototype but not for shipping. A build step (Vite or esbuild) lands during Phase 1 before any release. The choice of build tool is **not** part of this ADR.

## Rationale

The project owner identifies four rationales for this stack. Each is recorded so that future contributors understand the choice and can challenge it if the underlying assumption changes.

### 1. The Python library is the product

`pump` is the asset the project is staking on. It encodes API 610 testing knowledge, unit discipline, and the existing `.docx` report generator. Any architecture that *replaces* the library (e.g., reimplementing the math in TypeScript) destroys the asset. Any architecture that *isolates* the library (e.g., calling it only from a Python desktop UI, with the web target running a separate JavaScript implementation) doubles the maintenance surface and introduces the very dual-implementation drift problem the dual-target choice is meant to avoid. A shared Python backend behind both targets keeps the library central.

### 2. The UI is computationally cheap; the engine is not

Every chart in the GUI is a static SVG over a few hundred polynomial-evaluated points (`PumpLabGUI/charts.jsx`). Every form is a few dozen text inputs. Nothing on the screen depends on a particular runtime. Conversely, the polynomial fitting (`pump.PerformanceFitter`), the affinity transforms, the unit conversions, the report templating — those depend on `numpy`, `pint`, `matplotlib`, and `python-docx`. The right place to put weight is where it already is: in Python. The right place to keep things light is where they already are: in the frontend.

### 3. One UI codebase per platform is the only sustainable maintenance posture for a single-author project

Risk **R-04** in the Phase 0 risk register ("Dual-target maintenance burden exceeds team capacity") is acute for a project whose entire authoring team is one person. The cheapest defence is to make the UI a single artefact that runs unchanged on both targets. React + browser host satisfies that constraint; React Native, Qt Widgets, or platform-specific UIs do not.

### 4. The existing `PumpLabGUI` prototype already demonstrates the chosen stack works

The prototype renders all four target screens (Setup, Results, MRT, Reports), implements bilingual i18n, computes BEP and tolerance verdicts in-browser, and exports `.docx` via the backend. There is no remaining "but will it work" risk for the locked portion of the stack. The remaining risks are entirely in the desktop-wrapper layer (decision §6 below) and in productionising the prototype (build, packaging, distribution).

## Consequences

### Accepted positive consequences

- **Single source of computation.** Bug-fixes, validation work, and new domains land in `pump` once and benefit both targets immediately.
- **Single UI codebase.** Layout changes, accessibility improvements, and design polish are done once. Visual regression testing has a single target.
- **Easy review.** The boundary between UI and computation is a small JSON contract, easy to audit and version.
- **Re-usable backend.** The same `pump` library that serves the GUI can serve scripted notebooks (`examples/*.ipynb`), CLI tooling, and automated batch runs without modification.

### Accepted negative consequences and mitigations

- **Desktop installer ships a Python runtime.** Either bundled (PyOxidizer, PyInstaller, Tauri sidecar) or assumed pre-installed (last resort). Bundled runtimes inflate the desktop installer; the Phase 0 NFR target of < 200 MB installed (`docs/nfr.md` NFR-12) will be tight. Mitigation: select Python ≥ 3.12 (per `docs/library-audit.md` §3) and a slim build of the chosen wrapper.
- **Two distribution pipelines.** The web target requires hosting + HTTPS; the desktop target requires per-OS installers, code-signing for macOS and Windows, and auto-update plumbing. Each pipeline is its own piece of work. Mitigation: treat web as the priority surface in v1.0 and desktop as v1.0.1 if needed.
- **IPC complexity for desktop.** The web target's REST contract is natural. The desktop target needs the same contract addressed locally — either over a localhost socket or via a native message channel. Mitigation: the desktop wrapper *also* speaks HTTP to a localhost-bound Python process, so the same client code talks to both targets. The cost is one extra running process on the desktop user's machine; the benefit is identical client code.
- **No native OS integration.** File-system drag-and-drop, system tray, hardware sensors, and native menus go through the wrapper's bridge. Mitigation: the chosen wrapper must expose these; the existing GUI does not yet rely on any of them.
- **Phase 0 weighted-matrix analysis is skipped.** Recorded explicitly here so a future contributor knows the decision was *not* unbiased — it was driven by the existing prototype.

### Rejected alternatives (recorded, not weighted)

The alternatives below were *considered and rejected* during the prototype phase before this ADR. Each is recorded with the reason it was set aside, so future contributors do not waste cycles re-evaluating them in the same shape.

- **PyQt or PySide native desktop with a separate web frontend.** Doubles the UI surface. Maintenance burden disqualifies this option for a single-author project.
- **Streamlit, Panel, or other "Python all the way down" framework.** Coupling chart fidelity, unit-of-measure switching, and custom tolerance-band overlays to a generic widget framework was judged a poorer engineering fit than direct React control over the SVG layer.
- **Pure web — no desktop target.** Phase 0 explicitly requires offline capability (NFR-07). A pure-web product cannot ship.
- **Electron-only — no web target.** Wastes the existing GUI's portability and excludes browser-based usage on a phone or shared lab terminal.

## Open question carried forward

The single architectural choice still open inside this ADR is the **desktop wrapper**: Electron, Tauri, or `pywebview`-class Python-native wrapper. The wrapper sits below the UI and is invisible to it, so the choice can be deferred until Phase 2 without blocking design work. The criteria that will decide it are:

- Installer size (NFR-12 target < 200 MB).
- Cold-start time on the desktop targets (Windows 10+, macOS 12+, Ubuntu 22+).
- Python sidecar ergonomics: how easily the wrapper can spawn, monitor, and shut down the Python HTTP backend.
- Code-signing certificate ecosystem and cost.

Recording the open question explicitly here is the substitute for re-running the Phase 0 weighted matrix.

## Validation

The ADR's correctness is validated by the existence of the running `PumpLabGUI/` prototype. The web target compiles in any modern browser via the script tags in `PumpLabGUI/index.html`; the JSON contract between UI and backend will be ratified during Phase 1 implementation; the desktop target depends on the open question above.

## Status governance

This ADR is **accepted**. Any change to its substance requires a new ADR (`docs/adr/002-…`) that supersedes it; superseding ADRs must explicitly cite this one. Editorial updates that do not change the decision (typos, link rot, restructuring) may be made in place.

---

## References

The standards-bar selectors (API 610, ISO 13709, ASME B73, ISO 5199) that drive the tolerance-verdict UI live in `PumpLabGUI/app-shell.jsx:197-208`. No external academic citation supports this ADR — it is an engineering decision record, not a literature synthesis. The rationale is grounded in the repository state at revision `923a99c` and the project owner's recorded preferences (saved in this conversation's memory; see `feedback_phase0_approach.md`).
