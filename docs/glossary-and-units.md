# Glossary and unit standard

**Deliverable 8 — Phase 0**
Status: Draft — pending project owner review
Date: 2026-05-22

Definitions below are framed at the *operational* level the project needs — what an engineer using PumpLab will mean when they read a label. Where a standards-bound definition exists, this document cites the standard at the family + edition level that the project itself already establishes (`PumpLabGUI/app-shell.jsx:197-201`). Specific clause numbers are *not* asserted unless they have been independently verified in this revision; the conservative referencing style here is a direct consequence of the academic-research discipline applied to the document and is recorded in this conversation's memory (`feedback_phase0_approach.md`).

---

## 8.1 Glossary

The glossary is grouped by topic for ease of reading. Each entry carries the **term**, an operational **definition**, and the **also known as** tokens that the engineer or codebase uses interchangeably. Cross-references to concept documents anchor the deeper math.

### 8.1.1 Performance terms

**Head (H)** — Energy per unit weight of fluid, expressed as the height of fluid column the pump produces (m or ft). The single most-quoted pump performance metric. Computed in the library by `TestPoint.compute_head` (`pump/point.py:366-369`). Also known as **total dynamic head**, **TDH**.

**Flow rate (Q)** — Volume of fluid the pump moves per unit time (m³/h, L/s, GPM). Internally canonicalised to m³/h (`pump/utilities/unit_conversion.py:STANDARD_UNITS["capacity"]`). Also known as **capacity**, **discharge**, **delivery**.

**Specific energy (E)** — Energy per unit *mass* of fluid; `E = gH`. Used inside the library to compute hydraulic power (`pump/point.py:96-102`). Also known as **specific work**.

**Brake power (P_brake)** — Mechanical shaft power delivered to the pump by the driver (kW or HP). Stored on `TestPoint.breaking_power`. Also known as **shaft power**, **input power**, **P_in**, **BHP** in imperial usage.

**Hydraulic power (P_hyd)** — Useful power the pump delivers to the fluid; `P_hyd = ρ · Q · g · H`. Computed by `TestPoint.compute_hydraulic_power` (`pump/point.py:376-380`). Also known as **water power**, **fluid power**, **output power**.

**Efficiency (η)** — Ratio of hydraulic to brake power; `η = P_hyd / P_brake`. Reported as a percentage. Computed by `TestPoint.compute_efficiency` (`pump/point.py:391-399`). Also known as **overall efficiency** (when no further breakdown into hydraulic / mechanical / volumetric components is made).

**Best Efficiency Point (BEP)** — The flow at which η is at its maximum. The most important reference point on any pump curve; long-term operation outside a ±20 % BEP window is associated with degraded reliability. Computed by sampling the fitted efficiency polynomial (`PumpLabGUI/screen-results.jsx:38-45`). Concept doc: `concepts/01-pump-performance-curves.md`.

**Shutoff head (H_shut)** — The head produced at zero flow (closed discharge valve). Sets the upper limit of the pump's pressure envelope. Stored on `DesignPoint.head_shutoff` (kwarg) and used by `PerformanceChecker` for shutoff tolerance verdicts. Also known as **dead head**.

**Runout** — The maximum flow the pump can deliver, conventionally the upper end of the published H-Q curve. Beyond runout the curve becomes unreliable. Also known as **end of curve**, **EOC**.

**Minimum continuous stable flow (MCSF)** — The lowest flow at which the pump can run continuously without hydraulic instability or thermal damage. Not yet computed by the library; planned for the curve-quality work in `concepts/01-pump-performance-curves.md`.

### 8.1.2 Suction-side terms

**NPSH-A** — *Net Positive Suction Head Available*. The suction-side energy available to the pump, above the fluid's vapour pressure. Determined by the *installation* (tank pressure, elevation, suction line losses, temperature). Concept doc: `concepts/04-npsh-analysis.md`. Also known as **NPSHA**.

**NPSH-R** — *Net Positive Suction Head Required*. The suction-side energy the *pump* needs at a given flow to operate without cavitation. Defined by the pump's geometry and identified during the suppression test (the so-called *NPSH-3* convention: NPSH at which head has dropped by 3 %). Also known as **NPSHR**, **NPSH-3**, **NPSH₃ %**.

**NPSH margin** — `NPSH-A − NPSH-R`. A positive margin is mandatory for safe operation; the required magnitude depends on service severity. Concept doc: `concepts/04-npsh-analysis.md`.

**Cavitation** — Formation and collapse of vapour bubbles inside the pump caused by local pressure falling below vapour pressure. Causes impeller erosion, head and efficiency degradation, and characteristic acoustic signatures. Triggered by insufficient NPSH margin.

**Vapour pressure (p_v)** — The pressure at which a fluid begins to flash to vapour at a given temperature. Lookup-table or correlation-based; the library will need a vapour-pressure helper to compute NPSH-A (concept 04).

### 8.1.3 Affinity and similarity terms

**Affinity laws** — A set of similarity relationships predicting how a pump's performance scales with rotational speed or impeller diameter. Concept doc: `concepts/05-affinity-laws.md`. Implemented in part by `PerformanceCurve.to_speed`. Also known as **pump laws**, **fan laws** (the same equations applied to fans).

**Impeller trim** — Reducing the impeller diameter to bring a pump down to a lower duty without changing the casing. Subject to the diameter-branch affinity laws plus an empirical efficiency correction.

**Specific speed (N_s)** — A dimensionless (or quasi-dimensionless) number classifying pump-impeller geometry by `N√Q / H^{3/4}`. Concept doc: `concepts/06-specific-speed.md`.

**Suction specific speed (N_ss)** — Same form as `N_s` but using NPSH-R in place of H. Sets the speed ceiling for cavitation-safe operation. Also known as **S** in some literatures. Concept doc: `concepts/06-specific-speed.md`.

### 8.1.4 System and hydraulics terms

**System curve** — Plot of head required by the installation as a function of flow. Concept doc: `concepts/02-system-resistance-curves.md`. Also known as **system head curve**, **system resistance curve**.

**Operating point** — The `(Q*, H*)` where the pump curve and system curve intersect. Concept doc: `concepts/03-operating-point.md`. Also known as **duty point** (specifically when it coincides with design intent).

**Static head** — The flow-independent part of `H_system`; sum of elevation difference and any pressure difference between source and destination. Concept doc: `concepts/02`.

**Friction head** — Head lost to wall friction in straight pipe. Computed via Darcy–Weisbach or Hazen–Williams. Concept doc: `concepts/08-pipe-hydraulics.md`.

**Minor loss** — Head lost in fittings (elbows, valves, expansions) expressed as `K · v²/(2g)`. Concept doc: `concepts/08`.

**Reynolds number (Re)** — Dimensionless ratio `ρvD/μ` distinguishing laminar from turbulent flow. Concept doc: `concepts/08`.

**Friction factor (f)** — Dimensionless coefficient in the Darcy–Weisbach equation. Computed from Re and relative roughness via Colebrook (implicit) or Swamee–Jain (explicit). Concept doc: `concepts/08`.

### 8.1.5 Test and acceptance terms

**Factory Acceptance Test (FAT)** — The performance test conducted at the manufacturer's facility before shipment, used to demonstrate compliance with the procurement contract. The primary workflow PumpLab supports. Referenced in `pump/utilities/report.py:189-200`.

**Mechanical Running Test (MRT)** — Continuous-running test (typically 4 h at rated speed) to verify mechanical performance: vibration, bearing temperature, sound pressure, seal leakage. Concept-level surface in `PumpLabGUI/screen-mrt.jsx`.

**NDE (Non-Drive End)** — The end of the pump or motor opposite the coupling; used to label a specific instrumentation point. `PumpLabGUI/app-shell.jsx:92, 187` (EN: "Non-drive end" / PT: "Lado oposto ao acoplamento").

**DE (Drive End)** — The end at the coupling; the other instrumentation point. `PumpLabGUI/app-shell.jsx:93, 188`.

**Tolerance band** — The allowable deviation of a measured or predicted value from nameplate, prescribed by the chosen standard. The project defines bands per standard at `PumpLabGUI/app-shell.jsx:204-208`; the values are project-defined and labelled "illustrative" of the cited standards (see [`nfr.md`](nfr.md) NFR-18).

**Verdict** — The pass / warn / fail label assigned to a single metric or to the overall test. Computed by `verdictForDev` in `PumpLabGUI/screen-results.jsx:3-11`.

### 8.1.6 Implementation / library terms

**`Q_`** — Shorthand for `pint.Quantity`. Every numeric value in the library passes through this type. `pump/utilities/unit_conversion.py:67`.

**`quantity_factory`** — The single function that enforces canonical-unit conversion for every quantity the library handles. `pump/utilities/unit_conversion.py:181-200`.

**`PerformanceCurve`** — Container of `TestPoint`s plus a `PerformanceFitter`; offers `predict_*` and `to_speed` / `to_fluid` transforms. `pump/performance_curve.py:157-613`.

**`PerformanceChecker`** — Wraps a `DesignPoint` + `PerformanceCurve`, applies tolerance bands, produces verdicts. `pump/performance_curve.py:616-776`.

**`ReportGenerator`** — Bilingual `.docx` report generator. `pump/utilities/report.py:63-167`.

---

## 8.2 Unit standard

The library defines its canonical internal unit per dimension in `pump/utilities/unit_conversion.py:STANDARD_UNITS`. The table below reproduces that definition, augments it with the common SI and Imperial alternatives the user will encounter in the wild, and tags each row with where the canonical choice was made.

| Quantity | Library canonical (SI) | SI alternatives accepted | Imperial alternatives accepted | Source |
|---|---|---|---|---|
| Flow rate | **m³/h** | L/s, m³/s | GPM (US), GPM (UK), CFM | `STANDARD_UNITS["capacity"]` |
| Head | **m** | — (head is a length) | ft | length dimension via `STANDARD_UNITS["length"]` |
| Pressure | **kgf/cm²** | kPa, bar, Pa, atm | psi, inHg, ftH₂O | `STANDARD_UNITS["pressure"]["default"]`; `"atm"` context resolves to `pascal`, `"delta"` context resolves to `bar` |
| Power | **kW** | W, HP (metric) | HP, BHP | `STANDARD_UNITS["power"]` |
| Speed (rotational) | **rpm** | rad/s, Hz (electrical) | rpm | `STANDARD_UNITS["speed_of_rotation"]` |
| Density | **kg/m³** | g/cm³, g/m³ | lb/ft³, specific gravity | `STANDARD_UNITS["density"]` |
| Dynamic viscosity | **cP** | mPa·s, Pa·s | — | `STANDARD_UNITS["dynamic_viscosity"]` |
| Velocity | **m/s** | — | ft/s | `STANDARD_UNITS["velocity"]` |
| Length / diameter | **m** | mm, cm, km | inches, ft | `STANDARD_UNITS["length"]` |
| Specific energy | **J/kg** | kJ/kg | ft·lbf/lbm | `STANDARD_UNITS["specific_energy"]` |
| Energy | **J** | kJ, kWh | BTU | `STANDARD_UNITS["energy"]` |
| Mass | **kg** | g, tonne | lb, ton | `STANDARD_UNITS["mass"]` |
| Efficiency | **%** | dimensionless 0–1 | % | `STANDARD_UNITS["efficiency"]` |
| Temperature (absolute) | **K** | °C, °F | °R | `STANDARD_UNITS["temperature"]["default"]` |
| Temperature (delta) | **K** | delta_°C, delta_°F | delta_°R | `STANDARD_UNITS["temperature"]["delta"]` |
| Time | **s** | min, h | s | `STANDARD_UNITS["time"]` |

**Conversion rule.** All storage, computation, fitting, and serialisation use the canonical unit. User input may be in any compatible unit; `quantity_factory` converts on the way in. Display formatting converts on the way out, governed by user preference (`PumpLabGUI/main.jsx:55, 97-110`). No layer in the library or GUI may perform an "approximate" conversion — Pint conversions are exact.

**Pressure context note.** Pressure is the only dimension with three canonical targets: default (`kgf/cm²`), `atm` (resolves to `Pa`), and `delta` (resolves to `bar`). The `delta` context is used when a quantity represents a *pressure difference* rather than an absolute pressure; the context is selected by `extract_context` from the property name (`pump/utilities/unit_conversion.py:92-107`).

---

## 8.3 References

Standards are cited at the family + edition level the project itself establishes. Where a publication date or specific clause has not been independently verified in this revision, it is omitted rather than approximated. APA 7th-edition formatting is used for the standards-publisher entries.

- American Petroleum Institute. (n.d.). *API 610: Centrifugal pumps for petroleum, petrochemical and natural gas industries* (12th ed.). Cited at this edition because the project's standards selector labels it "API 610 (12ª)" (`PumpLabGUI/app-shell.jsx:198`) and the existing `.docx` report templates explicitly reference clause 8.3.3.4.3 of the 12th issue (`pump/utilities/report.py:304-309`).
- American Society of Mechanical Engineers. (n.d.). *ASME B73.1: Specification for horizontal end suction centrifugal pumps for chemical process* and *ASME B73.2: Specification for vertical in-line centrifugal pumps for chemical process*. Cited because the project's standards selector includes them (`PumpLabGUI/app-shell.jsx:199`).
- International Organization for Standardization. (n.d.). *ISO 13709: Centrifugal pumps for petroleum, petrochemical and natural gas industries*. The ISO-track equivalent of API 610; paired with it in the project's selector (`PumpLabGUI/app-shell.jsx:198`).
- International Organization for Standardization. (n.d.). *ISO 5199: Technical specifications for centrifugal pumps — Class II*. Cited because the project's standards selector includes it (`PumpLabGUI/app-shell.jsx:200`).
- International Organization for Standardization. (n.d.). *ISO 9906: Rotodynamic pumps — Hydraulic performance acceptance tests*. The hydraulic-acceptance-test standard that the FAT workflow approximates; cited in the project's risk register entry R-01 (`docs/risks-and-questions.md`).
- Petrobras. (n.d.). *N-553: Pumps for refinery service* and *N-906: Centrifugal pumps for chemical process*. Brazilian national standards that the project's standards selector cites alongside the international ones (`PumpLabGUI/app-shell.jsx:198-200`).
- Hydraulic Institute. (n.d.). *ANSI/HI 9.6 standards for rotodynamic pumps*. Family of guidelines for application, viscosity correction, NPSH margin, and vibration. Specific guideline numbers cited in concept documents (`docs/concepts/04-npsh-analysis.md`, `docs/concepts/05-affinity-laws.md`) require verification before being treated as authoritative in any user-facing release artefact.

---

## 8.4 Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Project owner | | | |
| Library author | | | |
| Technical editor (if separate) | | | |
