# Data requirements specification

**Deliverable 4 — Phase 0**
Status: Draft — pending project owner review
Date: 2026-05-22

This document catalogues every distinct data item the system reads, computes, persists, and exports. Each item is anchored to its current location in the codebase. Where an item is planned but not yet implemented, the row is marked **(planned)** and cross-referenced to the relevant concept doc.

The library's canonical internal units are the source of truth for every quantity below. They are defined in `pump/utilities/unit_conversion.py` at the `STANDARD_UNITS` dictionary. The interface converts on display; conversions are never approximate (`pump/utilities/unit_conversion.py:181-200`).

---

## 4.1 Input data catalogue

### 4.1.1 Fluid definition

| Data item | Source | Format / type | Canonical unit | Persistence | Shared across projects? |
|---|---|---|---|---|---|
| `Fluid.name` | User input | non-empty `str` | — | Per project | No |
| `Fluid.density` | User input | `pint.Quantity` | `kg/m³` (`STANDARD_UNITS["density"]`) | Per project | No |
| `Fluid.dynamic_viscosity` (optional) | User input | `pint.Quantity` | `cP` | Per project | No |
| `Fluid.vapour_pressure(T)` (planned, UC-05) | Built-in lookup or user input | `pint.Quantity` | `kgf/cm²` | Static (table) | Yes |

Reference: `pump/utilities/fluid.py:64-95`.

### 4.1.2 Design (rated / nameplate) point

| Data item | GUI field | Library attribute | Canonical unit | Required? |
|---|---|---|---|---|
| Pump tag | `rated.tag` | (stored on `DesignPoint` via kwargs) | text | Yes |
| Rated flow | `rated.qNom` | `DesignPoint.capacity` | `m³/h` | Yes |
| Rated head | `rated.hNom` | `DesignPoint.differential_head` | `m` | Yes |
| Rated speed | `rated.nNom` | `DesignPoint.speed_of_rotation` (kwarg) | `rpm` | Yes |
| Rated power | `rated.pNom` | `DesignPoint.breaking_power` (kwarg) | `kW` | Yes |
| Specific gravity | `rated.sgNom` | derived from `Fluid.density` | dimensionless | Yes |
| Kinematic viscosity | `rated.muNom` | derived from `Fluid` (planned) | `cSt` | Optional |
| Shutoff head | `rated.hShut` | `DesignPoint.head_shutoff` (kwarg, optional) | `m` | Optional |

Schema reference: `PumpLabGUI/main.jsx:3-12` and `pump/point.py:82-225`. The library accepts arbitrary `**kwargs` on `DesignPoint`, so the GUI's field set is a *subset* of what the library will store, not a constraint.

### 4.1.3 Test points (measured run)

| Data item | GUI field | Library attribute on `TestPoint` | Canonical unit | Required? |
|---|---|---|---|---|
| Flow | `points[i].q` | `capacity` | `m³/h` | Yes |
| Suction pressure | `points[i].pSuc` | `inlet_pressure` (kwarg) | `kgf/cm²` | Yes |
| Discharge pressure | `points[i].pDis` | `outlet_pressure` (kwarg) | `kgf/cm²` | Yes |
| Water temperature | `points[i].tW` | (stored as kwarg; informational) | `°C` | Optional |
| Brake power | `points[i].power` | `breaking_power` (kwarg) | `kW` | Required for η |
| Speed of rotation | `points[i].n` | `speed_of_rotation` (kwarg) | `rpm` | Required for `to_speed` |
| Inlet diameter | (not in GUI today) | `inlet_diameter` (kwarg) | `m` | Required for velocity head |
| Outlet diameter | (not in GUI today) | `outlet_diameter` (kwarg) | `m` | Required for velocity head |

Schema reference: `PumpLabGUI/main.jsx:14-21` and `pump/point.py:309-411`.

### 4.1.4 System / installation (planned, UC-03 / UC-05)

The library has no system module today (`docs/library-audit.md` §2). The planned inputs are sketched in `docs/concepts/02-system-resistance-curves.md` and `docs/concepts/04-npsh-analysis.md`:

| Data item | Format | Canonical unit | Persistence |
|---|---|---|---|
| Pipe segment: length, inner diameter, roughness | `(Q_, Q_, Q_)` | `m`, `m`, `m` | Per project |
| Fitting: name, K-factor, source catalogue | `(str, float, str)` | — | Per project |
| Static head: source / destination elevations | `(Q_, Q_)` | `m` | Per project |
| Vessel pressure(s) | `Q_` | `kPa` | Per project |
| Suction-side temperature (for NPSH-A) | `Q_` | `°C` | Per project |

### 4.1.5 Project metadata

| Data item | GUI field | Format | Purpose |
|---|---|---|---|
| Project name | `project.name` | text | Identifies the project on screen and in reports |
| Operator | `project.operator` | text | Records the person running the test (`PumpLabGUI/main.jsx:60-64`) |
| Site / TAG reference | `project.site` | text | Plant location |
| Notes | `project.notes` | text (multi-line) | Free-form context |
| Standard | `state.std` | enum `api610` \| `asme73` \| `iso5199` | Tolerance band selector (`PumpLabGUI/app-shell.jsx:197-208`) |
| Pressure unit | `unit` | enum `kgf` \| `bar` | Display preference; storage stays canonical |
| Language | `tweaks.lang` | enum `en` \| `pt` | i18n preference |

### 4.1.6 Mechanical Running Test (MRT) inputs

| Data item | GUI field | Canonical unit | Source |
|---|---|---|---|
| Vibration (NDE / DE) | `mrt.{nde,de}.vib` | `mm/s rms` | `PumpLabGUI/main.jsx:30-33` |
| Bearing temperature (NDE / DE) | `mrt.{nde,de}.bear` | `°C` | same |
| Sound pressure (NDE / DE) | `mrt.{nde,de}.noise` | `dB(A)` | same |
| Seal leakage (NDE / DE) | `mrt.{nde,de}.seal` | `ml/h` | same |

Reference for MRT acceptance bands: `PumpLabGUI/screen-mrt.jsx:5-10` (project-defined; the source file comments those values as "illustrative" of API 610 12th ed.).

### 4.1.7 Static reference data (built-in)

| Data item | Format | Persistence | Shared? | Implemented? |
|---|---|---|---|---|
| `STANDARD_UNITS` table | `Dict[str, Dict[str, str]]` | Source code constant | Yes | ✅ (`pump/utilities/unit_conversion.py:70-85`) |
| Standards list (API 610 / ASME B73 / ISO 5199) | List of `(id, label, short)` | Source code constant | Yes | ✅ (`PumpLabGUI/app-shell.jsx:197-201`) |
| Tolerance bands per standard | `Dict[std_id, {q,h,eta,p: [low, high]}]` | Source code constant | Yes | ✅ (`PumpLabGUI/app-shell.jsx:204-208`); **note**: bands have not been independently verified against the published standards in this revision |
| MRT acceptance bands | `Dict[metric, {ok, warn, max, unit}]` | Source code constant | Yes | ✅ (`PumpLabGUI/screen-mrt.jsx:5-10`); also marked "illustrative" |
| Pipe-schedule lookup (planned, UC-03) | Static table | Yes | Yes | ❌ |
| Fitting K-factor catalogue (planned, UC-03) | Static table | Yes | Yes | ❌ |
| Water property table (planned, UC-05) | Static table | Yes | Yes | ❌ |
| Pump catalogue (planned, UC-01) | Persistent DB | Yes | Yes | ❌ |

---

## 4.2 Output data catalogue

| Output | Producer | Format | Destination | Implemented? |
|---|---|---|---|---|
| Fitted curve coefficients | `PerformanceFitter.{head, efficiency, power}_coeffs` | `np.ndarray` (polynomial coefficients, NumPy convention: highest-degree first) | In-memory, chart component | ✅ |
| Predicted (H, P, η) at a given Q | `PerformanceCurve.predict_*` | `pint.Quantity` in canonical units | KPI panel, tolerance table | ✅ |
| BEP (Q, H, P, η) | currently inline in `screen-results.jsx:38-45` (JS) | `(float, float, float, float)` | KPI panel | 🟡 (no Python API) |
| Tolerance verdict per metric | `PerformanceChecker.check_summary` + JS verdict in `screen-results.jsx:3-11` | enum `pass` / `warn` / `fail` | Tolerance table, sidebar badge | ✅ |
| Test summary table | `PerformanceCurve.test_summary` (text), `test_data` (dict) | `str` or `Dict[str, List[Q_]]` | Report / API | ✅ |
| Operating point (UC-04) | `pump.operating.operating_point` (planned) | `OperatingPoint(Q*, H*, η*, P*)` | Display panel | ❌ |
| NPSH margin (UC-05) | planned | `(Q_, Q_, verdict)` | Display panel | ❌ |
| Comparison table (UC-08) | planned | `Dict[curve_label, Dict[metric, Q_]]` | Table component | ❌ |
| `.docx` report | `ReportGenerator.generate_report` | binary `.docx` | File download | ✅ |
| `.pdf` / `.html` / `.json` report | planned per `PumpLabGUI/screen-reports.jsx:30-50` | binary or text | File download | 🟡 (UI stubs only) |
| Chart export — PNG | `PerformanceCurve.plot_performance_curve(return_io=True)` | PNG via `io.BytesIO` | File download / embedded in report | ✅ |
| Chart export — SVG | planned | SVG | File download | ❌ |
| Project file (save/load) | planned | JSON, schema in §4.3 | Save / load | ❌ |

### 4.2.1 Output precision

| Output | Display precision | Reason |
|---|---|---|
| Head | 2 decimal places (m) | Practice in `PerformanceCurve.test_summary` (`pump/performance_curve.py:553`) and GUI (`PumpLabGUI/screen-results.jsx:206-207`) |
| Power | 2 decimal places (kW) | same |
| Efficiency | 1 decimal place (%) | `PumpLabGUI/screen-results.jsx:207` |
| Flow | 2 decimal places (m³/h) | `pump/performance_curve.py:551` |
| Deviation Δ% | 2 decimal places, signed | `PumpLabGUI/screen-results.jsx:208-209` |
| NPSH (planned) | 2 decimal places (m) | matches head |

### 4.2.2 Colour-coding rules (status indicators)

| Verdict | Colour token | When |
|---|---|---|
| `pass` | `var(--pass)` (green) | Deviation within tolerance band |
| `warn` | `var(--warn)` (amber) | Deviation within 1.25× band edges (`PumpLabGUI/screen-results.jsx:6-9`) |
| `fail` | `var(--fail)` (red) | Deviation outside `warn` window |

---

## 4.3 Project file specification

A "saved project" is the smallest self-contained artefact a user can email a colleague to reproduce a calculation. The recommended format is **JSON** for the following observable reasons:

- The library's quantities are Pint-backed and serialise cleanly as `(magnitude, unit_string)` pairs.
- The GUI's state is already a plain JS object tree (`main.jsx:50-73`); JSON is the natural transport.
- JSON is human-readable and version-controllable, satisfying the "shared with colleague" workflow inferred from the example notebooks.

### 4.3.1 Recommended schema (v1)

```json
{
  "schema_version": "1.0",
  "saved_at": "ISO-8601 UTC timestamp",
  "app_version": "0.0.1",
  "project": {
    "name": "string",
    "operator": "string",
    "site": "string",
    "notes": "string"
  },
  "standard": "api610 | asme73 | iso5199",
  "display": {
    "language": "en | pt",
    "pressure_unit": "kgf | bar"
  },
  "fluid": {
    "name": "string",
    "density":   {"magnitude": 1000.0, "unit": "kg/m^3"},
    "viscosity": {"magnitude": 1.0,    "unit": "cP"}
  },
  "design_point": {
    "tag": "P-101A",
    "capacity":          {"magnitude": 120, "unit": "m^3/h"},
    "differential_head": {"magnitude": 85,  "unit": "m"},
    "speed_of_rotation": {"magnitude": 3550,"unit": "rpm"},
    "breaking_power":    {"magnitude": 42,  "unit": "kW"},
    "head_shutoff":      {"magnitude": 102, "unit": "m"}
  },
  "test_points": [
    {
      "capacity":          {"magnitude": 30, "unit": "m^3/h"},
      "inlet_pressure":    {"magnitude": 0.30,"unit": "kgf/cm^2"},
      "outlet_pressure":   {"magnitude": 10.40,"unit": "kgf/cm^2"},
      "breaking_power":    {"magnitude": 19.8,"unit": "kW"},
      "speed_of_rotation": {"magnitude": 3548,"unit": "rpm"}
    }
  ],
  "mrt": {
    "nde": {"vibration_mm_s_rms": 2.4, "bearing_C": 76, "noise_dBA": 78, "seal_leak_ml_h": 3.5},
    "de":  {"vibration_mm_s_rms": 2.8, "bearing_C": 84, "noise_dBA": 79, "seal_leak_ml_h": 4.0}
  },
  "computed": {
    "available": "boolean (false until Calculate has been run)",
    "last_calc_at": "ISO-8601 UTC timestamp or null",
    "head_coeffs":    [0.0, 0.0, 0.0, 0.0, 0.0],
    "power_coeffs":   [0.0, 0.0, 0.0, 0.0, 0.0],
    "efficiency_coeffs":[0.0, 0.0, 0.0, 0.0, 0.0],
    "predicted_at_rated": {
      "head":       {"magnitude": 0.0, "unit": "m"},
      "efficiency": {"magnitude": 0.0, "unit": "percent"},
      "power":      {"magnitude": 0.0, "unit": "kW"}
    },
    "bep": {"capacity": {"magnitude": 0.0, "unit": "m^3/h"}, "efficiency": {"magnitude": 0.0, "unit": "percent"}}
  }
}
```

### 4.3.2 Round-trip rule

Loading a project file MUST reconstruct the in-memory state such that re-saving the file produces a byte-identical document (modulo `saved_at`). This is the acceptance criterion for the save / load implementation and exercises every data path in §4.1 and §4.2.

### 4.3.3 Versioning

- `schema_version` is a string `"MAJOR.MINOR"`.
- A loader for `MAJOR=1` MUST accept any `MINOR` value and ignore unknown fields.
- A loader MUST refuse a higher `MAJOR` than it knows and surface a clear migration message.
- Migration from `MAJOR` to `MAJOR+1` is a one-way upgrade run by an explicit tool.

### 4.3.4 What is NOT in the project file

- Cached chart bitmaps (always regenerated).
- Computed verdicts in mutable form (the verdicts are a function of inputs + standard; re-deriving them on load avoids drift).
- The pump catalogue, fluid library, or any built-in reference data (those live with the application, not the project).
- User credentials, telemetry, or anything outside the testing record.

---

## 4.4 Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Project owner | | | |
| Library author | | | |
