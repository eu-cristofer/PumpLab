# 3. Wrapping a Python library with a REST API

## The principle

A computation library has a Python API. A frontend has an HTTP API.
Bridging them is one job: translate JSON in / JSON out, and let the
library do the actual work. The bridge layer should be **thin and
boring** — every line of computation in the bridge is a line of
computation duplicated outside the library, and that duplication is
where bugs hide.

Three rules:

1. **The API is the library's shape, not a new design.** Field names
   mirror the library's keyword arguments. The frontend can read the
   library's docstring and know what to send.
2. **Validate at the boundary; trust within.** Pydantic at the HTTP
   edge; raw Python everywhere else.
3. **Units travel with values.** Never assume a unit. Every magnitude
   carries its unit string in the request, and the library re-converts
   it through the same `quantity_factory` that powers the notebook.

## The Sprint 0 reference

Three files form the bridge:

- [pump/api/schemas.py](../../../pump/api/schemas.py) — Pydantic models.
  Shape-checked at parse time; no business logic.
- [pump/api/main.py](../../../pump/api/main.py) — FastAPI app, one route,
  CORS middleware, error mapping.
- [pump/api/__init__.py](../../../pump/api/__init__.py) — re-exports
  `app` so `uvicorn pump.api.main:app` works.

And one test file:

- [tests/test_api.py](../../../tests/test_api.py) — drives the endpoint
  through `httpx.ASGITransport` (no need to actually start uvicorn).

## The recipe

### Step 1 — Define the wire format

Start with the smallest reusable shape — a quantity:

```python
class Quantity(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: float
    unit: str
```

`extra="forbid"` makes typos in the JSON body return 422 instead of being
silently dropped. Build the rest of the schema by composing `Quantity`:

```python
class DesignPointIn(BaseModel):
    capacity: Quantity
    differential_head: Quantity
    speed_of_rotation: Optional[Quantity] = None
    NPSH_available: Optional[Quantity] = None
```

The field names match `DesignPoint.__init__`'s keyword arguments. A
frontend developer reading the OpenAPI schema can guess this in seconds.

### Step 2 — Convert wire → library

A one-liner helper keeps the route handler clean:

```python
def _q(quantity: Quantity) -> Q_:
    return Q_(quantity.value, quantity.unit)
```

Then the handler is mostly mechanical:

```python
fluid = Fluid(name=req.fluid.name, density=_q(req.fluid.density))
design = DesignPoint(
    fluid=fluid,
    capacity=_q(req.design_point.capacity),
    differential_head=_q(req.design_point.differential_head),
    speed_of_rotation=_q(req.design_point.speed_of_rotation) if req.design_point.speed_of_rotation else ...
)
test_points = [_build_test_point(fluid, p) for p in req.test_points]
curve = PerformanceCurve(fluid=fluid, points=test_points, polynomial_degree=req.degree)
```

This is the entire computation step. Twelve lines including blanks. The
heavy lifting happens inside `PerformanceCurve`, where it belongs.

### Step 3 — Convert library → wire

The response is the inverse: pull magnitudes out, attach a `units` dict
describing what those magnitudes mean.

```python
return FitCurveResponse(
    measured_flows=[p.capacity.magnitude for p in curve.points],
    measured_heads=[p.head.magnitude for p in curve.points],
    ...
    units={
        "flow": STANDARD_UNITS["capacity"]["default"],   # "m**3/h"
        "head": "m",
        "power": STANDARD_UNITS["power"]["default"],      # "kW"
        "efficiency": "%",
    },
)
```

Resist the urge to convert units on the way out. Send the library's
standard unit and let the frontend label the axis.

### Step 4 — Map library errors to HTTP

The library raises `ValueError` for unit problems and `AttributeError`
for missing inputs. The HTTP standard says client errors are 4xx:

```python
try:
    curve = PerformanceCurve(...)
except (ValueError, AttributeError) as exc:
    raise HTTPException(status_code=422, detail=str(exc)) from exc
```

Don't catch broadly. `Exception` would also swallow `KeyboardInterrupt`
and `MemoryError` — bad. Pick the exception classes the library is
documented to raise, and re-raise everything else as 500 by letting
FastAPI handle it.

### Step 5 — Test through ASGI, not over the network

```python
from httpx import ASGITransport, AsyncClient
from pump.api.main import app

async def test_fit_curve_returns_arrays_and_predictions():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post("/api/analysis/fit-curve", json=PAYLOAD)
    assert r.status_code == 200
    body = r.json()
    assert body["head_r_squared"] > 0.99
```

This is faster than `subprocess.Popen("uvicorn ...")` and gives you real
HTTP semantics (status codes, JSON parsing, error bodies). Use it for
every API test; reserve actual uvicorn for the end-to-end smoke test.

### Step 6 — CORS for the browser

The browser refuses cross-origin requests by default. The static GUI
on `http://localhost:5173` calling the API on `http://localhost:8000`
**is** cross-origin, so the API must return `Access-Control-Allow-Origin`
headers and respond to OPTIONS preflight requests:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Sprint 0: wide open. Lock down in Phase 2.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Wildcards are fine for development. Production should list specific
origins — the deployed frontend domain and, in our case, the desktop
shell's local origin (e.g. `tauri://localhost`).

## Pitfalls

- **Schema drift.** If you rename a kwarg in the library and forget to
  rename the Pydantic field, the test passes (Python is duck-typed) but
  the frontend payload no longer fits. Build the schemas by reading the
  library's `__init__` signatures and add a comment linking them.
- **Long parameter lists in the handler.** When a handler grows past ~30
  lines, push helpers into a small `_service.py` module. Don't let the
  route handler grow into a second copy of the library.
- **Pydantic v1 vs v2.** v2 is incompatible with v1 in important ways
  (`Field(..., min_items=)` → `Field(..., min_length=)`, `Config` class →
  `model_config = ConfigDict(...)`, `.dict()` → `.model_dump()`). The
  project is on v2 (≥ 2.6); don't paste v1 examples from old tutorials.
- **`extra="ignore"` is the silent killer.** A field-name typo in the
  JSON body becomes a missing field on the server, which Pydantic fills
  with the default, and the user sees a wrong answer. Always `forbid`.
- **Forgetting the `__init__.py`.** Sub-packages need one. Without
  `pump/api/__init__.py`, the build wheel skips the directory and
  `uvicorn pump.api.main:app` fails at import time — but `pytest` from
  the source tree still works. CI catches this; local dev hides it.
