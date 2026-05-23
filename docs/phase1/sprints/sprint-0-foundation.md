# Sprint 0 — Foundation
## Duration: 1 week
## Goal: Kill technical risks and prove the stack works end-to-end

---

## Sprint objective

By the end of Sprint 0, you can run one complete cycle: enter a design point and test points in the React frontend, hit a button, and see a fitted pump curve rendered in the browser — with the computation happening in the Python library through a FastAPI endpoint. If this works, the architecture is proven. If it doesn't, you find out now instead of in Sprint 2.

---

## Tasks

### Task 0.1 — Library packaging
**Requirement:** LIB-01, LIB-02
**Effort:** Small (1-2 hours)

**What to do:**
Create `pyproject.toml` in the repo root. Pin all dependencies. Verify the library installs cleanly.

**Acceptance criteria:**
- [ ] `pyproject.toml` exists with `[project]` metadata and `[project.dependencies]`
- [ ] Dependencies pinned: `pint`, `numpy`, `matplotlib`, `tabulate`, `python-docx`
- [ ] Python ≥ 3.12 declared as minimum
- [ ] `pip install -e .` succeeds in a fresh venv
- [ ] `python -c "import pump"` succeeds after install

**Claude Code prompt:**
```
Read the pump/ directory. Create a pyproject.toml that:
- Declares the package name as "pumplab"
- Sets Python >= 3.12
- Pins all dependencies you find in the imports
- Uses setuptools as the build backend
- Includes a [project.scripts] entry if there's a CLI entrypoint

Then test it: create a fresh venv, pip install -e ., and verify import pump works.
```

**How to verify yourself:**
```bash
python -m venv .venv-test
source .venv-test/bin/activate
pip install -e .
python -c "from pump.models import DesignPoint; print('OK')"
```

---

### Task 0.2 — Fix known bugs
**Requirement:** LIB-04
**Effort:** Small (2-3 hours)

**What to do:**
Fix the four bugs identified in the library audit (§4.2-4.5).

**Bug list:**
1. `pint` import error — module path or version mismatch
2. `PerformanceChecker` crashes on missing attributes — add `hasattr` guards or default values
3. Fitter sort order is non-deterministic — sort test points by flow before fitting
4. Hard-coded `m**3/h` unit string — replace with configurable reference to `STANDARD_UNITS`

**Acceptance criteria:**
- [ ] Each bug has a test that fails before the fix and passes after
- [ ] No new test failures introduced
- [ ] All four issues resolved

**Claude Code prompt:**
```
Read library-audit.md sections 4.2 through 4.5. For each bug:
1. Write a test that reproduces the failure
2. Fix the code
3. Run the test to confirm it passes
4. Run the full test suite to confirm no regressions

Start with the pint import issue since other bugs may depend on it.
```

---

### Task 0.3 — Golden numbers test fixture
**Requirement:** LIB-03
**Effort:** Medium (3-4 hours)

**What to do:**
Extract known-good input/output values from `examples/B-432301D.ipynb` and create a pytest fixture that validates the library's accuracy.

**Acceptance criteria:**
- [ ] `tests/` directory exists with `conftest.py` and at least one test file
- [ ] Test fixture contains real design point + test point data from the example notebook
- [ ] Test asserts library output is within ±2% of expected values (NFR-06)
- [ ] `pytest tests/ -v` passes

**Claude Code prompt:**
```
Read examples/B-432301D.ipynb. Extract:
- The DesignPoint values (rated flow, head, efficiency, power, speed)
- The TestPoint values (each test measurement)
- The expected fitted curve results

Create tests/test_golden_numbers.py with:
- A fixture that builds the DesignPoint and TestPoint list
- A test that calls PerformanceCurve.fit() and asserts:
  - Head at rated flow is within 2% of expected
  - Power at rated flow is within 2% of expected
  - Efficiency at rated flow is within 2% of expected
  - R² > 0.99
```

---

### Task 0.4 — Compile translation catalogues
**Requirement:** LIB-05
**Effort:** Small (1 hour)

**What to do:**
Run `msgfmt` on the `.po` files to produce `.mo` binaries. Verify the library loads them.

**Acceptance criteria:**
- [ ] `.mo` files exist for both EN and PT locales
- [ ] Library loads translations without error
- [ ] A test confirms at least one string translates correctly in both languages

**Claude Code prompt:**
```
Find the .po files in pump/utilities/locales/. Compile them:
  msgfmt pump/utilities/locales/en/LC_MESSAGES/messages.po -o pump/utilities/locales/en/LC_MESSAGES/messages.mo
  msgfmt pump/utilities/locales/pt/LC_MESSAGES/messages.po -o pump/utilities/locales/pt/LC_MESSAGES/messages.mo

Then write a test that imports the i18n module and verifies a known string
returns the correct translation in both languages.
```

---

### Task 0.5 — FastAPI skeleton
**Requirement:** API-01 (partial)
**Effort:** Small (2-3 hours)

**What to do:**
Create the FastAPI app with one working endpoint: `/api/analysis/fit-curve`. It accepts a design point and test points, calls `PerformanceCurve.fit()`, and returns the fitted curve data as JSON.

**Acceptance criteria:**
- [ ] `pump/api/main.py` exists with a FastAPI app instance
- [ ] `/api/analysis/fit-curve` endpoint accepts POST with JSON body
- [ ] Request body validated with Pydantic model
- [ ] Response contains fitted curve arrays (flow, head, power, efficiency)
- [ ] `/docs` serves Swagger UI
- [ ] `uvicorn pump.api.main:app --reload` starts without error

**Claude Code prompt:**
```
Create pump/api/main.py with FastAPI. Add one endpoint:

POST /api/analysis/fit-curve
- Request: { design_point: {...}, test_points: [{...}], degree: 4 }
- Maps to PerformanceCurve.fit()
- Response: { flow_rates: [], heads: [], powers: [], efficiencies: [], r_squared: float }

Create pump/api/schemas.py with Pydantic models for the request and response.
Use the field names and types from the existing DesignPoint and TestPoint classes.
Add CORS middleware allowing all origins (we'll restrict in production).

Write an integration test in tests/test_api.py using httpx AsyncClient.
```

---

### Task 0.6 — End-to-end proof
**Requirement:** Validates architecture from ADR-001
**Effort:** Medium (3-4 hours)

**What to do:**
Modify the existing React app (PumpLabGUI) to call the FastAPI endpoint. Enter data in the form, click a button, see a curve in the browser. This is the moment of truth.

**Acceptance criteria:**
- [ ] React app has a fetch call to `POST /api/analysis/fit-curve`
- [ ] Response data renders in a Recharts chart (even a basic line chart is fine)
- [ ] The full cycle works: form input → API call → Python computation → JSON response → chart display
- [ ] Both `uvicorn` and `npm run dev` can run simultaneously with proxy configured

**Claude Code prompt:**
```
Read PumpLabGUI/src/ to understand the existing React app structure.
Add a hook or function that:
1. Collects the design point and test points from the existing form state
2. POSTs them to http://localhost:8000/api/analysis/fit-curve
3. Receives the fitted curve arrays
4. Renders a basic Recharts LineChart with flow on X, head on Y

Configure Vite proxy so /api/* forwards to localhost:8000.
Don't redesign the UI — just wire the existing form to the new endpoint
and add one chart component.
```

---

## Sprint 0 gate review

Before moving to Sprint 1, verify:

| Check | Status |
|---|---|
| `pip install -e .` works | [ ] |
| `pytest tests/ -v` passes with golden numbers | [ ] |
| All 4 audit bugs fixed with tests | [ ] |
| Translation .mo files compile and load | [ ] |
| FastAPI serves `/docs` with Swagger UI | [ ] |
| React → FastAPI → pump → chart cycle works | [ ] |

**If any check fails, fix it before starting Sprint 1.** The whole point of Sprint 0 is that failures here are cheap. Failures in Sprint 2 are expensive.

---

## What you learn in Sprint 0

- How Python packaging works (pyproject.toml, editable installs, venvs)
- How to write tests that validate engineering calculations
- How to create a REST API that wraps a computation library
- How to connect a React frontend to a Python backend
- The discipline of "prove it works before building more"
