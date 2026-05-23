# Library Audit Report

**Deliverable 1 — Phase 0**
Status: Draft — pending project owner review
Audited revision: `923a99c` (Add Point system for pump calculations)
Audit date: 2026-05-22

---

## 0. Executive summary

The `pump` library is a small, well-structured Python package (~700 LOC) that targets API 610 centrifugal pump factory acceptance tests. Its current strengths:

- **Strict unit discipline** via Pint and an internal `quantity_factory` that funnels every input through a `STANDARD_UNITS` table — this is the right foundation for an engineering library.
- **A clean point/curve/checker pipeline** (`DesignPoint` → `TestPoint`[] → `PerformanceCurve` → `PerformanceChecker`) that mirrors how a pump engineer actually thinks about an FAT.
- **A working `.docx` report generator** with bilingual templates (EN/PT) and `gettext`-driven localisation.

Its current weaknesses (each detailed below):

- **No packaging.** No `pyproject.toml`, no `setup.py`, no pinned dependencies. The library is currently consumable only as a path-on-disk import.
- **No automated tests.** No `tests/` directory, no `pytest` configuration, no validation against ISO 9906 or published curves. Risk **R-01** in the Phase 0 spec is uncovered.
- **Coverage gaps for ~8 of 12 use-case domains.** The library does pump curves, basic point hydraulics and bilingual reporting well. It does *not* implement system curves, operating-point intersection, NPSH analysis, specific speed, series/parallel composition, or pipe hydraulics — all of which Phase 0 lists as in-scope domains (Deliverable 3).
- **Five real bugs** (one breaking, four latent — see §4). One is auto-fixed by this audit pass; the others are documented for the Phase 1 cleanup.
- **The `gettext` Portuguese translation never runs.** Only `.po` source files are present; the compiled `.mo` files are missing.

**Recommendation:** the library is fit-for-purpose as the computation engine for the *factory performance test* workflow that the existing `PumpLabGUI` prototype already supports (UC-02, partial UC-09). Before it can serve the *application/selection* use cases (UC-01, UC-03 → UC-08) it needs the gap features in §2. Before it can ship as the MVP backend it needs packaging, tests, and the bug fixes in §4.

---

## 1. Public API inventory (Deliverable 1.1)

The library exposes the following names via `from pump import *` (see `pump/__init__.py:23-27`, `pump/utilities/__init__.py:47-51`).

### 1.1.1 `pump.utilities.unit_conversion`

| Symbol | Kind | Signature / type | What it does | Inputs | Output | Depends on | Edge cases / limitations | Tested |
|---|---|---|---|---|---|---|---|---|
| `Q_` | alias | `pint.Quantity` | Pint quantity constructor — every value in the library is a `Q_`. | magnitude, unit string | `Quantity` | `pint` | None | No |
| `quantity_factory(quantity, context="default") -> Q_` | function | `(Q_, str) -> Q_` | Converts a quantity to the library's canonical standard unit for that dimension. | `quantity`: any `Q_`; `context`: one of `CONTEXT` | `Q_` in standard unit | `STANDARD_UNITS`, `ImprovedQuantity.convert` | Raises `ValueError` if `context` unknown; falls back to original unit (with `UserWarning`) if no dimension match. **Bug**: catches `pint.UndefinedUnitError` but never imports `pint` as a module (`pump/utilities/unit_conversion.py:165-167`). | No |
| `CONTEXT` | constant | `set[str]` | Allowed context tokens derived from `STANDARD_UNITS`. Today: `{"default", "atm", "delta"}`. | — | set | `STANDARD_UNITS` | New contexts require updating both `STANDARD_UNITS` and any callers. | No |
| `STANDARD_UNITS` | constant | `Dict[str, Dict[str, str]]` | Source-of-truth: canonical unit per physical quantity, per context. Covers capacity, density, viscosity, efficiency, energy, length, mass, power, pressure, specific energy, speed of rotation, velocity, temperature, time. | — | dict | — | No `force` dimension; no `mass_flow`; no `dynamic_viscosity` outside `cP`. | No |
| `ImprovedQuantity.convert` | classmethod | `(Q_, str) -> Q_` | Implementation behind `quantity_factory`; the only place where unit selection happens. | as above | as above | `STANDARD_UNITS` | Special-cases `temperature` + `delta` to add a `delta_` prefix when needed. | No |
| `UnitConverterInterface` | ABC | — | Abstract base, single method `convert`. Unused outside `ImprovedQuantity`. | — | — | `abc` | Over-engineered for a single implementation — flag for cleanup. | No |

### 1.1.2 `pump.utilities.fluid`

| Symbol | Kind | Signature | What it does | Inputs | Output | Depends on | Edge cases / limitations | Tested |
|---|---|---|---|---|---|---|---|---|
| `Fluid(name, density, **kwargs)` | class | `(str, Q_, **Q_) -> Fluid` | Represents a fluid; `name` and `density` are mandatory, all other properties (viscosity, vapour pressure, etc.) are dynamic attributes routed through `quantity_factory` using the `extract_context` heuristic on the attribute name. | `name`: non-empty `str`; `density`: `Q_`; kwargs: arbitrary `Q_` | `Fluid` instance | `unit_conversion` | Attribute name → context mapping is by prefix (`"pressure_..."`, `"temperature_..."`) — silently uses `"default"` if no prefix match. No vapour-pressure helper, no temperature dependence, no fluid library. | No |

### 1.1.3 `pump.point`

| Symbol | Kind | Signature | What it does | Inputs | Output | Depends on | Edge cases / limitations | Tested |
|---|---|---|---|---|---|---|---|---|
| `BasePoint(fluid, capacity, **kwargs)` | class | `(Fluid, Q_, **Q_) -> BasePoint` | Base for all points: a fluid + a capacity + arbitrary additional `Q_` attributes. | as in signature | `BasePoint` | `Fluid`, `quantity_factory` | Attributes set dynamically — typos in `kwargs` become silent attributes. | No |
| `DesignPoint(fluid, capacity, differential_head, **kwargs)` | class | as signature + `differential_head: Q_` | **The intended pump-engineering "rated point"**: known flow and TDH. Computes hydraulic power, outlet pressure, elevation head, velocity head from optional `inlet_pressure`, `inlet_elevation`, `outlet_elevation`, `inlet_diameter`, `outlet_diameter`. | as signature | `DesignPoint` | `BasePoint` | `outlet_pressure` raises `AttributeError` if no `inlet_pressure`. No NPSH, no margin, no rated efficiency input. | No |
| `Point(fluid, capacity, **kwargs)` | class | `(Fluid, Q_, **Q_) -> Point` | "Generic performance point" — duplicates much of `TestPoint`. **Has a breaking bug** (see §4.1): `outlet_pressure` returns `quantity_factory()` with no arguments. | as signature | `Point` | `BasePoint` | Class is half-defined; not used by `PerformanceCurve`. Recommend deprecation. | No |
| `TestPoint(fluid, capacity, **kwargs)` | class | `(Fluid, Q_, **Q_) -> TestPoint` | **The intended pump-engineering "measured point"**: a single test row. Lazily computes `pressure_head`, `velocity_head`, `elevation_head`, `head`, `hydraulic_power`, `efficiency` from whatever attributes are present (`inlet_pressure`/`outlet_pressure` or `delta_pressure`, `inlet_diameter`/`outlet_diameter`, `inlet_elevation`/`outlet_elevation`, `breaking_power`). | as signature | `TestPoint` | `BasePoint`, `Fluid` | `efficiency` requires `breaking_power`; `head` requires either `delta_pressure` or both pressures. `__lt__` enables `sorted(points)` by capacity. | No |

### 1.1.4 `pump.performance_curve`

| Symbol | Kind | Signature | What it does | Inputs | Output | Depends on | Edge cases / limitations | Tested |
|---|---|---|---|---|---|---|---|---|
| `PerformanceFitter(points, polynomial_degree=4)` | class | `(List[TestPoint], int) -> PerformanceFitter` | Lazy polynomial regression over a list of `TestPoint`. Properties `head_coeffs`, `efficiency_coeffs`, `power_coeffs` are cached. | points, degree | fitter instance | `numpy` | Degree default of 4 is high for small point counts — overfits a 5-point test. No fit quality metrics (R², residuals) exposed. | No |
| `PerformanceCurve(fluid, points, polynomial_degree=4)` | class | `(Fluid, List[TestPoint], int) -> PerformanceCurve` | Container that owns a fitter and offers `predict_head/efficiency/breaking_power`, plotting (`plot_performance_curve`), and the affinity-law transformations `to_speed` / `to_fluid`. | as signature | `PerformanceCurve` | `PerformanceFitter`, `matplotlib`, `tabulate` | All points must share the same `Fluid` (validated). `plot_performance_curve` is monolithic and not parameterised for headless / batch use beyond `return_io`. **Bug**: `PerformanceFitter` is constructed from the unsorted `points` argument while `self.points` is the sorted copy (`pump/performance_curve.py:206-207`). | No |
| `PerformanceCurve.predict_head(capacity) -> Q_` | method | `(Q_) -> Q_` | Evaluates the head polynomial at a given capacity. | `capacity` in any flow unit | `Q_` (m) | `head_coeffs` | Hard-coded `to("m**3/h").magnitude` — unsafe if `STANDARD_UNITS["capacity"]` ever changes. | No |
| `PerformanceCurve.predict_efficiency(capacity) -> Q_` | method | as above | Efficiency polynomial. | `capacity` | `Q_` (%) | `efficiency_coeffs` | Same coupling to `m**3/h`. | No |
| `PerformanceCurve.predict_breaking_power(capacity) -> Q_` | method | as above | Power polynomial. | `capacity` | `Q_` (kW) | `power_coeffs` | Same coupling to `m**3/h`. | No |
| `PerformanceCurve.to_speed(new_speed) -> PerformanceCurve` | method | `(Q_) -> PerformanceCurve` | Applies affinity laws: Q ∝ N, H ∝ N², P ∝ N³. Preserves efficiency. | speed of rotation | new curve | `TestPoint` | Requires each point to have `speed_of_rotation`. Ignores impeller-diameter affinity branch. | No |
| `PerformanceCurve.to_fluid(new_fluid) -> PerformanceCurve` | method | `(Fluid) -> PerformanceCurve` | Re-bases the curve to a new fluid; preserves head, recomputes `breaking_power` from new density × Q × g × H / η. | `Fluid` | new curve | `TestPoint` | No viscosity correction (Hydraulic Institute ANSI/HI 9.6.7). Suitable for density-only changes. | No |
| `PerformanceCurve.plot_performance_curve(...)` | method | many kwargs | Three-stack matplotlib plot (H/P/η vs Q) with optional crosshair at a target capacity; can return a `BytesIO` PNG. | optional title, capacity, y-limits | `None` or `BytesIO` | `matplotlib` | Hard-codes axis labels in English; not styled to match the GUI. | No |
| `PerformanceCurve.test_summary` / `test_data` | properties | — | Tabulated summary (string) and dict-of-lists for downstream use. | — | `str` / `dict` | `tabulate` | `test_data` skips columns silently when first point lacks a property. | No |
| `PerformanceChecker(design_point, performance_curve, acceptable_limits=None)` | class | as signature | Applies API 610 12th-ed §8.3.3 tolerances to the curve relative to a `DesignPoint`. Head tolerance ±3 %; shutoff tolerance 5/8/10 % depending on rated head; power +4 %. | design, curve | checker instance | `DesignPoint`, `PerformanceCurve` | **Bug**: `acceptable_limits`, `check_summary`, `test_summary_with_limits` reference `self.minimum_head_shutoff` / `self.maximum_breaking_power` unconditionally, but those attributes only exist when `design_point` has `head_shutoff` / `breaking_power` (see §4.3). `acceptable_limits` parameter is accepted but ignored. | No |

### 1.1.5 `pump.utilities.report`

| Symbol | Kind | Signature | What it does | Inputs | Output | Depends on | Edge cases / limitations | Tested |
|---|---|---|---|---|---|---|---|---|
| `ReportGenerator(language='en', locale_dir=None, template_path=None)` | class | as signature | Generates a `.docx` FAT report from a template, in EN or PT. | language code | `ReportGenerator` | `LocalizationHelper`, `python-docx` | Templates live in `pump/templates/template_{lang}.docx`. No PDF output. | No |
| `ReportGenerator.generate_report(report_data, output_file=None) -> str` | method | as signature | Writes the populated `.docx` to disk. | a structured `dict` (see Deliverable 4) | path string | `python-docx` | `report_data` schema is implicit (defined only by the dict keys this method reads). No validation. | No |
| `LocalizationHelper(language='en', locale_dir=None)` | class (internal) | as signature | Wraps `gettext`. Falls back to identity translation if `.mo` not found. | language code | translator | `gettext`, `locale` | **The compiled `.mo` files are missing** from `pump/utilities/locales/`. PT runtime falls back to identity. | No |

---

## 2. Computation coverage map (Deliverable 1.2)

Legend: **✅ implemented** · **🟡 partial** · **❌ gap**

| Domain | What the library does today | What is missing | Touches use cases |
|---|---|---|---|
| **Pump performance curves** | ✅ `PerformanceCurve` fits H-Q, P-Q, η-Q polynomials, predicts at any Q, plots a 3-stack chart. | NPSH-R vs Q curve. Curve quality metrics (R², residuals). Min-flow / runout markers. | UC-02, UC-04, UC-08, UC-09 |
| **System resistance curves** | ❌ Nothing. | Static head input, friction head computation, minor losses, plotting. | UC-03, UC-04 |
| **Operating point** | ❌ Nothing — the curve has no `intersect(system_curve)` method. | Numerical intersection, multi-curve overlays, snap to BEP. | UC-01, UC-04 |
| **NPSH analysis** | ❌ Nothing. `DesignPoint`/`TestPoint` accept arbitrary `Q_` attributes so an `npsh_available`/`npsh_required` could be stored, but no computation. | NPSH-A from suction conditions + vapour pressure. NPSH margin. Cavitation flag. | UC-05 |
| **Affinity laws — speed** | ✅ `PerformanceCurve.to_speed` applies N¹/N²/N³ scaling. | Impeller-trim branch (D ratio). Viscosity / density correction during scaling. | UC-06 |
| **Affinity laws — diameter / impeller trim** | ❌ Not implemented. | Diameter ratio scaling with the Hydraulic Institute / Karassik correction factor. | UC-07 |
| **Series / parallel operation** | ❌ Nothing. | Combine multiple `PerformanceCurve` objects: parallel sums Q at equal H, series sums H at equal Q. | UC-08 |
| **Specific speed** | ❌ Nothing. | Ns from N, Q, H; pump-type classifier (radial / Francis / mixed / axial); suction specific speed Nss. | (educational; supports UC-01) |
| **Cavitation analysis** | ❌ Nothing. | Tied to NPSH analysis above. | UC-05 |
| **Motor sizing** | ❌ Nothing. | Service-factor margin, NEMA frame lookup. | UC-01 |
| **Pipe friction (Darcy-Weisbach, Hazen-Williams)** | ❌ Nothing. | Reynolds number, friction factor (Colebrook / Swamee-Jain), Moody diagram lookup. | UC-03 |
| **Fluid properties** | 🟡 `Fluid` is a dynamic-attribute bag — anything fits but nothing comes built-in. | Water property tables (rho, mu, p_v vs T), generic fluid library, viscosity correction (ANSI/HI 9.6.7). | UC-05, UC-06, UC-07 |
| **Report generation** | ✅ Bilingual `.docx` FAT report with embedded charts. | PDF export. HTML export. Customisable per-use-case templates (current template is fixed FAT). | UC-09 |
| **Localisation** | 🟡 `gettext` plumbing exists; `.po` files exist; **`.mo` files do not** so PT runtime falls back to identity. | Compile `.mo`. Cover all user-facing strings in `.po`. Switch UI strings to translation calls. | (cross-cutting) |

**Headline:** the library implements 3 of 12 domains and has half-coverage on 2 more. To meet Phase 0's Deliverable 3 (concept documentation for 8 domains), the docs will exist for all 8 — but the library mapping table inside each domain doc will mark unimplemented work as a Phase 1 gap.

---

## 3. Code health assessment (Deliverable 1.3)

| Item | Status | Notes |
|---|---|---|
| pip-installable | ❌ | No `pyproject.toml`, no `setup.py`. Only consumable via path import. |
| Type hints | 🟡 ~60 % | Public signatures mostly annotated; some `**kwargs: dict[str, Q_]` claims (incorrect — should be `Unpack[TypedDict]` or `Q_`). Internal helpers untyped. |
| Docstrings | ✅ ~85 % | NumPy style throughout, with examples. A few methods (`predict_metric`, `_get_properties`) docstring-free. |
| Test coverage | ❌ 0 % | No `tests/`, no `pytest.ini`, no CI. Risk **R-01** uncovered. |
| Dependencies (declared) | ❌ none declared | Actual runtime deps inferred from imports: `pint`, `numpy`, `matplotlib`, `tabulate`, `python-docx`. No pinning. |
| Python version | ❓ unspecified | Uses `Self` (PEP 673) → requires **Python ≥ 3.11**. f-string nested quoting in `performance_curve.py:553` (`f"{getattr(point, "breaking_power", 0):0.02f~P}"`) requires **Python ≥ 3.12** (PEP 701). Must be documented. |
| Packaging shape | 🟡 namespaced | Proper package layout (`pump/` with `__init__.py`, sub-package `pump.utilities`), wildcard re-exports via `__all__`. Imports work via `from pump import *`. |
| Lint / format | ❌ no config | No `ruff`, `black`, `isort` config. Minor inconsistencies (trailing whitespace in `report.py`, single vs double quotes). |
| Logging | 🟡 partial | `logger = getLogger(__name__)` exists in `unit_conversion.py`; never used elsewhere. |
| Examples | ✅ | `examples/` holds 5+ Jupyter notebooks plus the generated `.docx` reports for real pumps (B-432301D, B-21014AB, B-4300.22101AB). High value as regression fixtures. |
| README | ❌ | Single line: `# PumpLab`. No install, no quickstart, no badges, no link to docs. |
| Licence | ✅ | `LICENSE` present (root). |
| Version | 🟡 | `__version__ = "0.0.1"` hard-coded in `pump/__init__.py`; no source-of-truth strategy (e.g. `importlib.metadata`). |

---

## 4. Bugs and latent issues (audit findings)

### 4.1 `Point.outlet_pressure` is broken (FIXED in this pass)

`pump/point.py:235-239`:

```python
@property
def outlet_pressure(self):
    return quantity_factory()
```

`quantity_factory()` requires a `Quantity` argument. Any access raises `ValueError: A valid pint.Quantity is required.`

The intent — readable from the surrounding `pressure_head` property — was to derive outlet pressure from `delta_pressure + inlet_pressure` or to require it as an input. **This audit pass applies the fix**: the property is rewritten to mirror `pressure_head`'s logic (use `delta_pressure` if present, else compute from inlet + outlet pressures already stored, else raise a clear `AttributeError`).

See: `pump/point.py:228-307`. Commit accompanying this audit.

### 4.2 `pint` exception classes referenced without import

`pump/utilities/unit_conversion.py:165-168`:

```python
except pint.UndefinedUnitError:
    raise ValueError(f"Invalid unit: {quantity.units}")
except pint.DimensionalityError as e:
    raise ValueError(f"Incompatible unit conversion: {e}")
```

The module imports `from pint import UnitRegistry, Quantity` but never imports `pint` itself, so the `except` clauses raise `NameError` if ever triggered. This means malformed units silently fall through to the "no dimensionality match" branch instead of producing the intended `ValueError`.

**Recommendation:** add `import pint` (or `from pint import errors as pint_errors` and reference `pint_errors.UndefinedUnitError`). Deferred to Phase 1.

### 4.3 `PerformanceChecker` references unset attributes

`pump/performance_curve.py:659-684`. `_compute_limits` only assigns `self.minimum_head_shutoff`, `self.maximum_head_shutoff`, `self.maximum_breaking_power` *inside* `hasattr` guards. But `acceptable_limits`, `check_summary`, and `test_summary_with_limits` read those names unconditionally — when the `DesignPoint` lacks `head_shutoff` or `breaking_power` (the common case for non-API tests), the checker explodes with `AttributeError`.

**Recommendation:** mirror the `hasattr` guards in every consumer, or compute sentinel `None` values up-front. Deferred to Phase 1.

### 4.4 `PerformanceFitter` is fitted on unsorted points

`pump/performance_curve.py:206-207`:

```python
self.points = sorted(points)
self.fitter = PerformanceFitter(points, polynomial_degree=polynomial_degree)
```

The fitter receives the *original* (unsorted) list; `self.points` is the sorted copy. Polynomial coefficients are order-independent so the math is unaffected, but `fitter.points` and `self.points` drift apart — confusing if a future feature aligns them (e.g. residual plots).

**Recommendation:** pass `self.points` (the sorted list) to the fitter. Trivial fix, deferred to Phase 1.

### 4.5 Hard-coded `m**3/h` in prediction methods

`pump/performance_curve.py:210`, `:312`, `:381`: `capacity.to("m**3/h").magnitude`. The intent is "use the standard unit for capacity," but the unit is hard-coded rather than looked up in `STANDARD_UNITS["capacity"]["default"]`. If the standard unit ever changes the polynomials become wrong silently.

**Recommendation:** use `quantity_factory(capacity).magnitude` (which is guaranteed to be in the standard unit) instead of `.to("m**3/h").magnitude`. Deferred to Phase 1.

### 4.6 Compiled message catalogues missing

`pump/utilities/locales/{en,pt}/LC_MESSAGES/messages.po` exist but the corresponding `messages.mo` files do not. `gettext.translation(..., fallback=True)` silently returns identity, so the `lang='pt'` path produces an English report.

**Recommendation:** add a build step (`msgfmt`) and commit the compiled catalogues. Deferred to Phase 1.

### 4.7 `Point` class is dead code (almost)

`pump.point.Point` overlaps `TestPoint` significantly, contains the broken `outlet_pressure`, and is not referenced by `PerformanceCurve` or any example. Recommend deprecation in Phase 1 and removal in v1.0 unless a non-test "generic point" use case emerges.

---

## 5. Recommended remediation roadmap (informational — outside Phase 0 scope)

| Pri | Item | Effort | Blocks |
|---|---|---|---|
| P0 | Add `pyproject.toml` (poetry/hatch/PDM), pin deps, choose Python floor (≥ 3.12 today) | S | every NFR |
| P0 | Stand up `tests/` with reference data (one of the existing examples → golden numbers) | M | Risk R-01 |
| P0 | Compile and ship `.mo` catalogues + a `make i18n` target | S | NFR-04 (units/language) |
| P1 | Fix bugs §4.2 – §4.5; deprecate §4.7 | S | report robustness |
| P1 | Implement system curve + operating point (UC-03, UC-04) | M | half the MVP |
| P1 | Implement NPSH and cavitation (UC-05) | M | half the MVP |
| P2 | Implement impeller trim (UC-07), series/parallel (UC-08), specific speed | M | full coverage |
| P2 | Refactor `plot_performance_curve` into composable plotters; expose chart data for the GUI to render natively (so we are not shipping matplotlib PNGs to a React app) | M | NFR-02 / NFR-03 |
| P3 | Replace `UnitConverterInterface` ABC with a plain function (single implementation, no benefit) | S | code health |

---

## 6. Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Project owner | | | |
| Library author | | | |
| Phase 0 lead | | | |

When this document is signed, Deliverable 1 of Phase 0 is complete. The next deliverable to attack is **D-3 (concept documentation)**, which depends on the gap map in §2.
