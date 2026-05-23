# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

PumpLab is an **API 610 pump engineering tool** with two independent components:

- `pump/` — Python library for pump calculations (the computation engine)
- `PumpLabGUI/` — Static React web app prototype (no build step, no backend)

These do not share runtime code. The GUI reimplements curve fitting in JavaScript; the Python library is used via Jupyter notebooks and `ReportGenerator`.

The project is currently in **Phase 0** (requirements and analysis). All design documents live in `phase0/docs/`.

---

## Python library (`pump/`)

### Running the library

There is no `pyproject.toml` yet. Install dependencies manually:

```bash
pip install pint numpy matplotlib tabulate python-docx
```

The library is used interactively via Jupyter notebooks in `examples/`. Run them with:

```bash
jupyter notebook examples/
```

There is no test suite and no pytest configuration.

### Architecture

The library has a strict data-flow:

1. **`Fluid`** (`utilities/fluid.py`) — holds physical properties; requires at minimum `density` as a `Q_`
2. **Point classes** (`point.py`) — hold a `Fluid` + `capacity` + optional kwargs as `Q_` values:
   - `BasePoint` — base, stores raw quantities
   - `DesignPoint` — adds `differential_head`, computes `power_output`, `outlet_pressure`, velocity/elevation heads
   - `Point` — computes `head` from pressure differential (test/generic point)
   - `TestPoint` — adds `hydraulic_power`, `efficiency` from `breaking_power`; implements `__lt__` for sorting by capacity
3. **`PerformanceFitter`** (`performance_curve.py`) — fits degree-4 polynomials (head, efficiency, power vs. capacity); lazy-computed
4. **`PerformanceCurve`** — container of sorted `TestPoint` objects; exposes `predict_head/efficiency/breaking_power`, `to_speed()` (affinity laws), `to_fluid()`, and `plot_performance_curve()`
5. **`PerformanceChecker`** — validates a `PerformanceCurve` against a `DesignPoint` using API 610 12th edition tolerances (±3% head, ±4% power; shutoff tolerance scales by head)

### Units — critical convention

Every physical quantity **must** pass through `quantity_factory(Q_(value, "unit"))`. This is the single enforcement point for dimensional consistency.

```python
from pump import Q_, quantity_factory, Fluid, DesignPoint

water = Fluid(name="Water", density=Q_(1000, "kg/m**3"))
dp = DesignPoint(fluid=water, capacity=Q_(120, "m**3/h"), differential_head=Q_(85, "m"))
```

`quantity_factory` converts to the standard unit defined in `STANDARD_UNITS` (e.g., capacity → `m³/h`, pressure → `kgf/cm²`, power → `kW`). The `context` kwarg on `BasePoint.__init__` is derived from the kwarg name prefix via `extract_context()`: a key starting with `delta_` uses `"delta"` context (pressures become bar), `inlet_`/`outlet_` use `"default"` (kgf/cm²).

### Report generation

`ReportGenerator` (`utilities/report.py`) generates `.docx` reports from templates in `pump/templates/`. It uses `python-docx` and `gettext` for EN/PT localization. Locale `.po` files live in `pump/utilities/locales/{en,pt}/`.

```python
from pump.utilities.report import ReportGenerator
gen = ReportGenerator(language="en")  # or "pt"
gen.generate_report(report_data)      # report_data is a structured dict
```

The `report_data` dict must have keys: `equipment_description`, `design_point` (a `DesignPoint`), and `test_data` (dict of tag → test dicts with `test_summary`, `test_data`, and optional `Curve*` keys for chart images as `BytesIO`).

---

## Web GUI prototype (`PumpLabGUI/`)

### How to run

Open `PumpLabGUI/index.html` directly in a browser — no server, no build step. React 18 and Babel standalone are loaded from CDN via `unpkg.com` with SRI hashes. Babel transpiles the JSX files in-browser.

### Load order (matters — globals are set via `Object.assign(window, ...)`)

1. `tweaks-panel.jsx` — `useTweaks` hook, `TweaksPanel/TweakSection/TweakText/…` components
2. `app-shell.jsx` — `I18N`, `STANDARDS`, `TOLERANCES`, `Icon`, `TopBar`, `Sidebar`, `StatusBar`
3. `charts.jsx` — `buildCurves`, `polyFit`, `polyEval`, `KGF_TO_BAR`, chart components
4. `screen-setup.jsx`, `screen-results.jsx`, `screen-mrt.jsx`, `screen-reports.jsx`
5. `main.jsx` — `App` root, mounts to `#root`

All state lives in `App()` in `main.jsx`. Screens receive props: `state` (rated, points, std, lastCalcAt, dirty), `setState`, `t` (translation dict), `unit` (`"kgf"` or `"bar"`).

### Key conventions

- **Internationalization**: `I18N.en` / `I18N.pt` dicts in `app-shell.jsx`. Add new strings to both. The `t` prop is whichever dict is active.
- **Pressure unit toggle**: `"kgf"` (kgf/cm²) or `"bar"`. Switching converts all existing `pSuc`/`pDis` values in `state.points` using `KGF_TO_BAR` from `charts.jsx`. Always store as strings in state.
- **Curve fitting**: Done client-side via `polyFit` / `polyEval` in `charts.jsx`. Degree-2 polynomial by default in the results screen.
- **Theming**: `body.dataset.aesthetic` controls CSS class (`instrument`, `industrial`, `saas`, `dark`). `body.dataset.density` is `"normal"` or `"compact"`. CSS custom properties `--accent` and `--accent-soft` are set inline in `App()`.
- **Tweaks panel**: Persistent UI settings (brand name, aesthetic, accent, density, language) stored via `useTweaks`. The `TWEAK_DEFAULTS` block in `main.jsx` is the canonical defaults.
- **Standards/tolerances**: Defined in `STANDARDS` and `TOLERANCES` in `app-shell.jsx`. `TOLERANCES[std]` gives `{q, h, eta, p}` band arrays.

---

## Phase 0 documentation (`phase0/docs/`)

Documents produced during the requirements phase:

| File | Purpose |
|------|---------|
| `library-audit.md` | Public API inventory, computation coverage map, code health |
| `use-cases.md` | Use case registry (UC-01 through UC-10) |
| `data-requirements.md` | Input/output data catalog, project file spec |
| `interface-requirements.md` | What the UI must contain (not wireframes) |
| `nfr.md` | Measurable non-functional requirements (NFR-01 to NFR-15) |
| `mvp-scope.md` | MVP scope sign-off |
| `risks-and-questions.md` | Risk register and open questions |
| `glossary-and-units.md` | Domain glossary and unit standard |
| `adr/` | Architecture decision records |
| `concepts/` | Per-domain concept pages (flowcharts, governing equations) |
