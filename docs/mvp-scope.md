# MVP scope definition

**Deliverable 10 — Phase 0**
Status: Draft — recommendation pending project owner sign-off
Date: 2026-05-22

The recommendations below derive directly from the use-case priority discussion in [`use-cases.md`](use-cases.md) §2.3 and the risk-and-question register in [`risks-and-questions.md`](risks-and-questions.md). They are recorded here so the project owner can approve, amend, or reject in a single document.

The MVP scope is the contract that the Phase 0 gate is gating *against*. Any feature listed under "in scope" must work end-to-end on both targets at v1.0; any feature listed under "deferred" or "out of scope" may *not* be smuggled into v1.0 without an explicit scope change.

---

## In scope — must ship in v1.0

The MVP delivers the Factory Acceptance Test workflow end-to-end for the primary user (FAT engineer) on both desktop and web targets. Concretely:

- [ ] **UC-02 — Verify pump performance.** Enter rated point + measured test points → fit H-Q, P-Q, η-Q polynomials → display predicted values at rated Q with deviation vs nameplate and per-metric verdict. Already supported by `pump.PerformanceCurve` / `PerformanceChecker` and by `PumpLabGUI/screen-results.jsx`; productionising means closing the bugs in [`library-audit.md`](library-audit.md) §4 and adding tests against a reference example (Risk R-01).
- [ ] **UC-06 — Speed correction via affinity laws (library API).** `PerformanceCurve.to_speed` already implemented. Library-level only at v1.0; a dedicated GUI surface is v1.1.
- [ ] **UC-09 — Report generation.** Bilingual `.docx` already supported by `pump.utilities.report.ReportGenerator`. Plus the additional formats stubbed in `PumpLabGUI/screen-reports.jsx:30-50`:
  - `.json` (raw bundle conformant to [`data-requirements.md`](data-requirements.md) §4.3),
  - `.html` (printable, browser-friendly).
  `.pdf` is deferred.
- [ ] **MRT screen.** The Mechanical Running Test workflow (vibration, bearing, noise, seal leakage with verdicts) already runs in `PumpLabGUI/screen-mrt.jsx`. Productionising means closing R-10 (tolerance band verification) and connecting real instrument data when sample data is not loaded.
- [ ] **Project save / load.** The JSON schema in [`data-requirements.md`](data-requirements.md) §4.3 must round-trip without loss (NFR-10).
- [ ] **Bilingual (EN + PT) coverage** of every user-facing string and every report label. Requires compiling the `.mo` catalogues (Risk R-08; NFR-16).
- [ ] **Library packaging.** `pyproject.toml`, pinned dependencies, Python ≥ 3.12 floor declared (Risk R-07; [`library-audit.md`](library-audit.md) §3).
- [ ] **Validation against reference data.** At least one of the existing example notebooks promoted into a `tests/` golden-numbers fixture (Risk R-01; OQ-11).
- [ ] **Desktop installer** on Windows and macOS (Ubuntu deb is best-effort). NFR-12 (< 200 MB), NFR-13 (< 5 clicks).
- [ ] **Web deployment** to a hosting target to be decided (OQ-10), with no required authentication for v1.0.
- [ ] **Documentation site** rendering `docs/concepts/` and the audit. Either as a generated static site or as direct GitHub-Markdown viewing.
- [ ] **Beta validation.** Ten beta users (Phase 0 spec target) have run a real FAT through the application and provided feedback. Stretch goal — owner discretion.

---

## Deferred to v1.1 or later

The features below are *not* part of v1.0. Each is recorded so contributors and stakeholders share the same expectation.

- [ ] **UC-01 — Pump selection.** Requires a pump catalogue. Blocked by OQ-03.
- [ ] **UC-03 — System curve analysis.** Requires a new `pump.system` module + `pump.hydraulics` module ([`concepts/02-system-resistance-curves.md`](concepts/02-system-resistance-curves.md), [`concepts/08-pipe-hydraulics.md`](concepts/08-pipe-hydraulics.md)).
- [ ] **UC-04 — Operating point.** Blocked by UC-03 ([`concepts/03-operating-point.md`](concepts/03-operating-point.md)).
- [ ] **UC-05 — NPSH margin and cavitation analysis.** Requires the new `pump.npsh` module + a vapour-pressure helper ([`concepts/04-npsh-analysis.md`](concepts/04-npsh-analysis.md)).
- [ ] **UC-07 — Impeller trim affinity branch.** Diameter branch of `to_speed` ([`concepts/05-affinity-laws.md`](concepts/05-affinity-laws.md)).
- [ ] **UC-08 — Multi-pump comparison.** Requires a multi-curve plotter + comparison table ([`concepts/07-series-parallel-operation.md`](concepts/07-series-parallel-operation.md) provides the composition math).
- [ ] **UC-06 GUI surface.** Speed change is library-only at v1.0; the GUI panel is v1.1.
- [ ] **PDF export** of reports.
- [ ] **Specific speed / pump-type classifier** UI surface ([`concepts/06-specific-speed.md`](concepts/06-specific-speed.md)).
- [ ] **Real-time data ingestion** from instrumentation (SCADA / OPC-UA).
- [ ] **Multi-user collaboration / cloud sync.**
- [ ] **Auto-update mechanism** for the desktop installer.

---

## Explicitly out of scope (will not ship)

These are listed *explicitly* so a future contributor or stakeholder does not assume otherwise without a scope change discussion.

- [ ] **Mobile / tablet form factor.** The product is desktop-laptop. Touch-optimised layouts are not planned for v1.0 or v1.1.
- [ ] **Live SCADA / OPC-UA integration** even as a v1.1 feature unless OQ asks for it.
- [ ] **Vendor-specific binary format readers** (Sulzer, Flowserve, ITT Goulds, KSB, etc.). User imports via CSV or the project-file JSON instead (OQ-06).
- [ ] **Languages beyond EN and PT** in v1.0 (OQ-07).
- [ ] **WCAG-AA full accessibility audit.** A minimum bar applies ([`interface-requirements.md`](interface-requirements.md) §7.5); a full audit is v1.1 work.
- [ ] **UC-10 — Interactive educational diagrams.** The static concept docs in `docs/concepts/` cover the educational surface for v1.0. The interactive layer is out of scope unless owner explicitly elevates it.
- [ ] **Multi-tenant SaaS account management.** The web target ships without authentication; tenant-aware deployment is out of scope.
- [ ] **Re-implementation of `pump` math in any language other than Python.** ADR-001 closes the door on multi-implementation drift.

---

## Definition of Done — v1.0

The release ships when *all* of the following are simultaneously true:

1. Every line item in **"In scope — must ship"** above is implemented, verified, and demonstrated.
2. All bugs in [`library-audit.md`](library-audit.md) §4 are either fixed or downgraded to "known-issue, deferred to v1.0.1" with explicit owner sign-off per bug.
3. Test suite passes on the three target OSes (Windows 10+, macOS 12+, Ubuntu 22.04+) and on the four target browsers (latest two of Chrome / Firefox / Safari / Edge — NFR-08, NFR-09).
4. Performance NFRs (NFR-01 through NFR-03 and the composite < 1 s end-to-end target in [`nfr.md`](nfr.md)) are met on the reference machine.
5. The bilingual coverage NFR-16 is met: zero untranslated strings in the EN-to-PT switch.
6. At least one published reference (textbook problem or ISO-9906-format acceptance test) has been compared to a PumpLab run and the verdict matches (NFR-06; Risk R-01; OQ-11).
7. The desktop installer runs from download to first calculation in fewer than 5 clicks on a clean target machine (NFR-13).
8. The Phase 0 risk register has been re-scored: no risk with score ≥ 16 is left open without an explicit project-owner-signed acceptance.
9. All Phase 0 open questions (OQ-01 through OQ-12) are either resolved or explicitly carried forward with owner approval.
10. The `README.md` is rewritten beyond its one-line placeholder ([`library-audit.md`](library-audit.md) §3) to cover install, quickstart, and a link to the deployed docs site.

---

## Release-cut governance

Once the project owner signs off on this scope:

- Any new feature request lands in the v1.1 backlog by default.
- A scope change *into* v1.0 requires a written addendum to this document signed by the project owner; the addendum gets dated, numbered, and appended below.
- A scope change *out of* v1.0 follows the same rule.

### Addenda

*(None yet — baseline opened in this revision.)*

---

## Sign-off — Phase 0 gate

By signing below, the parties accept this MVP scope as the v1.0 contract for PumpLab and unlock the start of Phase 1 (design and implementation).

| Role | Name | Date | Signature |
|---|---|---|---|
| Project owner | | | |
| Library author | | | |
| Phase 0 lead | | | |

When this document is signed, Deliverable 10 of Phase 0 is complete and Phase 0 itself is closed.
