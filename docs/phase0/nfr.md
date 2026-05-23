# Non-functional requirements

**Deliverable 6 — Phase 0**
Status: Draft — thresholds pending project owner review
Date: 2026-05-22

Each requirement below carries a single, measurable acceptance criterion. Where the threshold is derived from an external engineering standard, the standard is cited at "family + edition" granularity (the granularity the project itself already establishes in `PumpLabGUI/app-shell.jsx:197-208`); no specific clause number is asserted without prior verification.

| ID | Category | Requirement | Acceptance criterion | Applies to | Source / rationale |
|---|---|---|---|---|---|
| **NFR-01** | Performance | Single-pump curve computation latency | `PerformanceCurve.predict_*` must return in **< 200 ms** for a curve of 50 points fitted at degree 4 on a reference development machine | Both | Phase 0 spec |
| **NFR-02** | Performance | Chart rendering latency | First interactive chart paint **< 500 ms** measured from `setSeries(...)` resolving (`PumpLabGUI/screen-results.jsx:47`) to the SVG appearing on screen | Both | Phase 0 spec |
| **NFR-03** | Performance | Slider / parameter interaction latency | Re-render after a single field edit completes in **< 100 ms** (perceptual smoothness threshold). The current React state-flow in `PumpLabGUI/screen-setup.jsx:42-50` satisfies this for the 6-point sample | Both | Phase 0 spec |
| **NFR-04** | Usability | Unit switching | Toggling `unit` between `kgf` and `bar` reconverts every visible numeric value within one re-render and never loses precision (already implemented at `PumpLabGUI/main.jsx:97-110`); reverting the toggle reproduces the original strings byte-for-byte for any pressure that was entered in the canonical unit | Both | Phase 0 spec; library guarantees this via `quantity_factory` (`pump/utilities/unit_conversion.py:181-200`) |
| **NFR-05** | Usability | First-test completion time | A new user, presented with sample data already loaded (`PumpLabGUI/main.jsx:128-133`), can press *Calculate* and read a verdict in **< 5 minutes** without external help | Both | Phase 0 spec |
| **NFR-06** | Reliability | Calculation accuracy | Predicted values (H, P, η at any Q in the tested range) within **±2 %** of a textbook or vendor reference for at least one of the existing examples (`examples/B-432301D.ipynb`, `examples/Example_1.ipynb`, etc.). Until automated tests are introduced (Risk R-01, [`risks-and-questions.md`](risks-and-questions.md)) this is enforced by manual review of report deltas | Both | Phase 0 spec |
| **NFR-07** | Portability | Offline operation | The desktop application performs every computation in `pump`, every chart rendering in `PumpLabGUI`, and every `.docx` export without any network call. Verifiable by running with the host's network adapter disabled | Desktop | Phase 0 spec |
| **NFR-08** | Portability | Browser support | The web target renders all four screens correctly on the latest two stable versions of Chrome, Firefox, Safari, and Edge. Verified by manual smoke test before each release. The current prototype is browser-Babel only (`PumpLabGUI/index.html:14-16`) and must move to a build step before this NFR can be reliably measured (open task, ADR-001) | Web | Phase 0 spec |
| **NFR-09** | Portability | OS support — desktop | Installer runs on Windows 10+, macOS 12+, Ubuntu 22.04+. Each OS verified per release | Desktop | Phase 0 spec |
| **NFR-10** | Data | Project save / load | Save a project, restart the app, load the same file: every field listed in [`data-requirements.md`](data-requirements.md) §4.3 is restored byte-for-byte (modulo the `saved_at` timestamp). Re-saving immediately after loading produces an identical file (modulo `saved_at`) | Both | Phase 0 spec |
| **NFR-11** | Data | Export formats | Charts exportable as PNG and SVG; tabular data exportable as CSV; reports exportable as `.docx` (today) and additionally `.html` and `.json` (planned per `PumpLabGUI/screen-reports.jsx:30-50`); `.pdf` deferred to v1.1 | Both | Phase 0 spec; partial today |
| **NFR-12** | Packaging | Desktop install size | < **200 MB** installed footprint, including Python runtime and any `pump` library dependencies | Desktop | Phase 0 spec; constrained by bundled Python + `numpy` + `matplotlib` |
| **NFR-13** | Packaging | Install steps | < **5 clicks** from "download" to "running" on a clean target OS | Desktop | Phase 0 spec |
| **NFR-14** | Documentation | API coverage | **100 %** of public functions (names listed in [`library-audit.md`](library-audit.md) §1) carry a docstring and at least one usable example. The audit shows the library is at ~85 % today; closing the gap is a P0 item in `docs/library-audit.md` §5 | Both | Phase 0 spec |
| **NFR-15** | Documentation | Concept coverage | All eight computation domains have a concept page in [`concepts/`](concepts/) — already satisfied as of this revision | Both | Phase 0 spec |
| **NFR-16** | Localisation | Bilingual coverage | Every user-facing string visible in the GUI and every label in the `.docx` report is available in both EN and PT and switches with zero loss when `tweaks.lang` changes (`PumpLabGUI/main.jsx:76-78`). Today the `.po` files are present but the compiled `.mo` files are missing (`docs/library-audit.md` §4.6) — closing this is a P0 item | Both | Project-derived NFR, not in original spec |
| **NFR-17** | Reliability | Numerical stability of polynomial fit | For any test with ≥ 5 points evenly spread across the operating range, `PerformanceFitter` returns coefficients whose evaluation at the original sample capacities matches the input heads within **0.05 m**. Below 5 points the library MUST raise an explicit error rather than silently overfitting (audit §4 — currently the library does not enforce this) | Both | Project-derived NFR |
| **NFR-18** | Auditability | Standard band traceability | Every tolerance band shown to the user (Q, H, η, P, vibration, bearing temp, noise, seal leak) carries an inline reference to the standard family and edition it derives from (currently project-defined, marked "illustrative" — see `PumpLabGUI/screen-mrt.jsx:3-4`). Closing this NFR requires verifying each numeric band against the published standards before release (Risk R-01) | Both | Project-derived NFR |

---

## Cross-cutting performance budget

The five performance NFRs (NFR-01, NFR-02, NFR-03) compose into a budget for the *Calculate* action:

| Action | Budget | Allocated to |
|---|---|---|
| User clicks *Calculate* | 0 ms | input |
| State propagation through React | < 50 ms | NFR-03 |
| `pump.PerformanceCurve` construction + fitting | < 200 ms | NFR-01 |
| Chart paint | < 500 ms | NFR-02 |
| Tolerance verdict computation | < 50 ms | within NFR-03 |
| Toast notification visible | < 800 ms total wall-clock | composite |

The end-to-end wall-clock target is **< 1 second** from click to verdict visible. Anything slower than that is a hard regression and blocks release.

---

## Out of scope for v1.0

The following are explicitly *not* committed to as Phase 0 NFRs and will be revisited at MVP scope review:

- Real-time data ingestion from a SCADA / OPC-UA system (UC-04 in a "live test bench" mode).
- Mobile / tablet form factor (the GUI is currently desktop-laptop only).
- Multi-user collaboration (no concurrency model is defined; project files are single-author).
- WCAG-AA accessibility audit (target for v1.1; v1.0 must at least be keyboard-navigable).

---

## Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Project owner | | | |
| Library author | | | |
