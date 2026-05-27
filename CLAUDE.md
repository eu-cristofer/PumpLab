# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

PumpLab is an **API 610 pump engineering tool** with three components:

- `pump/` — Python library for pump calculations (the computation engine)
- `pump/api/` — FastAPI backend that wraps the library (REST surface; CON-01: all computation lives in Python, not the frontend)
- `frontend/` — React + Vite renderer used by both the web target and the Electron desktop shell
- `PumpLabGUI/` — Legacy zero-build prototype kept until the `frontend/` migration reaches parity, then deleted

Phase 0 (requirements and analysis) is complete; design docs live in `docs/phase0/`. **Phase 1** (v1.0 implementation) is in progress — requirements in `docs/phase1/guides/phase1_requirements.md`, sprint plan in `docs/phase1/sprints/`. Sprint 0 has landed (`pyproject.toml`, test suite, FastAPI scaffold, Vite frontend scaffold).

---

## Common commands

### Python environment

Editable install is now wired up via `pyproject.toml`:

```bash
mamba env create -f environment.yml   # creates `pump` env; the pip section installs `-e .[dev]`
mamba activate pump
```

`environment.yml` deliberately omits a `channels:` block — configure channels in your local `~/.condarc` (company vs. public registry). If pip cannot reach PyPI from the conda env, install the API/dev extras directly: `pip install -e ".[dev]"`.

### Tests

```bash
pytest                                 # full suite (configured via [tool.pytest.ini_options])
pytest tests/test_golden_numbers.py    # single file
pytest tests/test_api.py::test_name    # single test
pytest -k "fit_curve"                  # by keyword
```

Tests share fixtures in `tests/conftest.py` — the canonical pump for golden-numbers tests is **B-432301D** (values copied verbatim from `examples/B-432301D.ipynb`). When you change library numerics, update the golden fixture deliberately, not the assertions.

### Running the API

```bash
uvicorn pump.api.main:app --reload     # http://localhost:8000, docs at /docs
```

CORS is wide-open (`allow_origins=["*"]`) for Sprint 0; Phase 2 locks this down to the desktop shell + deployed frontend origin.

### Running the frontend

```bash
cd frontend
npm install
npm run dev                            # Vite dev server at http://localhost:5173
npm run build                          # outputs to frontend/dist/
```

Vite proxies `/api/*` → `http://localhost:8000`, so frontend code uses relative URLs and works unchanged in dev, production web, and Electron.

### Running the legacy prototype (`PumpLabGUI/`)

Open `PumpLabGUI/index.html` directly in a browser — no server, no build step. React 18 and Babel standalone load from CDN with SRI hashes. This is preserved for parity comparison; new work goes in `frontend/`.

---

## Python library (`pump/`) architecture

Strict data-flow:

1. **`Fluid`** (`utilities/fluid.py`) — holds physical properties; requires at minimum `density` as a `Q_`.
2. **Point classes** (`point.py`) — hold a `Fluid` + `capacity` + optional kwargs as `Q_` values:
   - `BasePoint` — base, stores raw quantities
   - `DesignPoint` — adds `differential_head`, computes `power_output`, `outlet_pressure`, velocity/elevation heads
   - `Point` — computes `head` from pressure differential (generic point)
   - `TestPoint` — adds `hydraulic_power`, `efficiency` from `breaking_power`; implements `__lt__` for sorting by capacity
3. **`PerformanceFitter`** (`performance_curve.py`) — fits polynomials (head, efficiency, power vs. capacity); lazy-computed.
4. **`PerformanceCurve`** — container of sorted `TestPoint` objects; exposes `predict_head/efficiency/breaking_power`, `to_speed()` (affinity laws), `to_fluid()`, and `plot_performance_curve()`.
5. **`PerformanceChecker`** — validates a `PerformanceCurve` against a `DesignPoint` using API 610 12th edition tolerances (±3% head, ±4% power; shutoff tolerance scales by head).

### Units — critical convention

Every physical quantity **must** pass through `quantity_factory(Q_(value, "unit"))`. This is the single enforcement point for dimensional consistency.

```python
from pump import Q_, quantity_factory, Fluid, DesignPoint

water = Fluid(name="Water", density=Q_(1000, "kg/m**3"))
dp = DesignPoint(fluid=water, capacity=Q_(120, "m**3/h"), differential_head=Q_(85, "m"))
```

`quantity_factory` converts to the standard unit defined in `STANDARD_UNITS` (capacity → `m³/h`, pressure → `kgf/cm²`, power → `kW`). The `context` kwarg on `BasePoint.__init__` is derived from the kwarg name prefix via `extract_context()`: a key starting with `delta_` uses `"delta"` context (pressures become bar), `inlet_`/`outlet_` use `"default"` (kgf/cm²).

### Report generation

`ReportGenerator` (`utilities/report.py`) generates `.docx` reports from templates in `pump/templates/`. Uses `python-docx` and `gettext` for EN/PT localization (`.po` files in `pump/utilities/locales/{en,pt}/LC_MESSAGES/`).

```python
from pump.utilities.report import ReportGenerator
gen = ReportGenerator(language="en")   # or "pt"
gen.generate_report(report_data)       # structured dict
```

`report_data` keys: `equipment_description`, `design_point` (a `DesignPoint`), `test_data` (dict of tag → test dicts with `test_summary`, `test_data`, and optional `Curve*` keys for chart images as `BytesIO`).

---

## API (`pump/api/`)

FastAPI app at `pump/api/main.py`, Pydantic models at `pump/api/schemas.py`. Helpers `_q(Quantity)` and `_build_test_point()` convert API DTOs into library `Q_`/`TestPoint` objects.

Current endpoints (Sprint 1 expands these per `API-01` through `API-04`):

- `GET /api/health`
- `POST /api/analysis/fit-curve` — takes `FitCurveRequest` (fluid, design point, test points, degree, smooth_points), returns measured + smoothed flow/head/power/efficiency arrays, rated predictions, and R² fit quality.

Validation errors from library code (`ValueError`, `AttributeError`) are re-raised as `HTTPException(422)`.

---

## Frontend (`frontend/`) conventions

React 18 + Vite. ES modules — no more `Object.assign(window, ...)` global wiring (that pattern lives only in the legacy `PumpLabGUI/`). Layout:

```
frontend/src/
├── components/   # tweaks-panel, app-shell, charts, api-client
├── screens/      # screen-setup, screen-results, screen-mrt, screen-reports
├── App.jsx       # root: state + screen wiring
├── main.jsx      # Vite entry; mounts App
└── styles.css
```

- **All compute goes through `api-client.jsx`** (CON-01). The legacy in-browser `polyFit`/`polyEval` in `PumpLabGUI/charts.jsx` must not be reintroduced.
- **i18n**: `I18N.en` / `I18N.pt` dicts in `app-shell.jsx`. Add new strings to both.
- **Pressure unit toggle**: `"kgf"` (kgf/cm²) or `"bar"`. Switching converts all existing `pSuc`/`pDis` values in `state.points` using `KGF_TO_BAR` from `charts.jsx`. Store values as strings in state.
- **Theming**: `body.dataset.aesthetic` (`instrument` | `industrial` | `saas` | `dark`); `body.dataset.density` (`normal` | `compact`); `--accent` and `--accent-soft` CSS custom properties set inline by `App()`.
- **Tweaks panel**: persistent UI settings (brand name, aesthetic, accent, density, language) via `useTweaks`. `TWEAK_DEFAULTS` in `App.jsx` is canonical.
- **Standards/tolerances**: `STANDARDS` and `TOLERANCES` in `app-shell.jsx`; `TOLERANCES[std]` gives `{q, h, eta, p}` band arrays.

---

## Phase 1 target architecture (where this is going)

The desktop target (DSK-01 through DSK-07) wraps the same React app in a desktop shell — Electron is the working choice (`frontend/electron/`), with Tauri and pywebview also tracked (ADR-002 pending). Desktop bundles the Python runtime as a sidecar so no separate install is needed.

Planned endpoints beyond `fit-curve`: `/api/analysis/check-tolerance`, `/api/analysis/affinity-correction`, `/api/report/generate`, `/api/project/save`, `/api/project/load`.

**Critical path to v1.0:** LIB-01 → LIB-03 → CMP-01 → CMP-04 → VRD-01 → RPT-01. The sprint plan in `docs/phase1/sprints/` sequences this as Sprint 0 (foundation/proof — landed) → Sprint 1 (hot path: input → curves → tolerance → verdict) → Sprint 2 (MRT, reports, project save, desktop, deploy). Each sprint file has a gate review checklist; do not advance until every box passes.

---

## Documentation layout (`docs/`)

All written design and planning lives under `docs/`.

Phase 0 — requirements & analysis (`docs/phase0/`):

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
| `phase0_requirements.md` | Phase 0 deliverable checklist & templates |

Cross-phase:

- `docs/adr/` — Architecture Decision Records (`001-dual-target-architecture.md`)
- `docs/concepts/` — Per-domain concept pages (performance curves, system resistance, operating point, NPSH, affinity laws, specific speed, series/parallel, pipe hydraulics)

Phase 1 — implementation (`docs/phase1/`):

- `guides/phase1_requirements.md` — authoritative v1.0 requirements (functional, NFR, constraints, traceability matrix, acceptance test plan)
- `guides/development-workflow.md` — the Plan → Build → Verify → Review → Gate cycle for each sprint
- `sprints/sprint-0-foundation.md` — kill risks, packaging, first test, stack proof
- `sprints/sprint-1-hot-path.md` — input → curves → tolerance → verdict
- `sprints/sprint-2-ship-it.md` — MRT, reports, project save, desktop, deploy
