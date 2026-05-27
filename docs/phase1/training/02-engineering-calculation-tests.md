# 2. Testing engineering calculations

## The principle

Software tests usually answer "does the code run?". Engineering tests
must answer **"is the answer physically correct?"** Those are different
questions, and the test code looks different.

A good engineering test has three layers:

1. **Mathematical** — the function returns finite, well-typed values for
   reasonable inputs (no `NaN`, no `AttributeError`, units are correct).
2. **Numerical** — the fit quality is good (R², residuals, max deviation)
   and behaves deterministically (same input order ⇒ same output).
3. **Physical** — the predicted value at a known operating point matches a
   measured ground truth within a stated tolerance (in our case, ±2 %
   from NFR-06).

Without all three, you can ship a library that runs, returns numbers, and
is silently wrong. That is the worst possible outcome for an engineering
tool — the user trusts it because it has tests.

## The Sprint 0 reference

Two files do the work:

- [tests/conftest.py](../../../tests/conftest.py) — shared fixtures: the
  B-432301D pump (real notebook data — 1 design point + 7 measured
  points + water and oil fluids).
- [tests/test_golden_numbers.py](../../../tests/test_golden_numbers.py) —
  the five tests below, each guarding one layer.

The data:

```python
CAPACITIES        = [0.00001, 477.700, 656.580, 856.970, 1085.190, 1284.840, 1541.170]
INLET_PRESSURES   = [2.240, 1.968, 1.938, 1.978, 1.988, 1.927, 1.815]
OUTLET_PRESSURES  = [14.031, 13.909, 13.797, 13.560, 12.930, 12.308, 11.550]
LOADS             = [209.610, 284.440, 325.370, 394.900, 402.840, 442.100, 501.730]
SPEEDS            = [1798, 1798, 1798, 1797, 1797, 1797, 1796]
```

These are not made up. They are measurements from one specific pump
(B-432301D) that the project owner has cleared as known-good.

## The recipe

### Step 1 — Capture the "truth" once

Take real notebook output, copy it into a constant in the test file with
a comment naming the source. Future-you will not remember which run the
numbers came from; the comment is the receipt.

```python
# Per-point expected values from the notebook (cell #25).
# capacity (m³/h) → (head_m, power_kW, eff_pct)
EXPECTED_BY_POINT = {
    477.700:  (119.55, 284.44, 54.71),
    656.580:  (118.89, 325.37, 65.38),
    856.970:  (116.36, 394.90, 68.81),
    1085.190: (110.32, 402.84, 80.98),
    1284.840: (105.08, 442.10, 83.22),
    1541.170: (99.20,  501.73, 83.03),
}
```

### Step 2 — Assert the mathematical layer

The library should compute head from inlet/outlet pressures using the
fluid density, the gravitational constant, and the geometry. The test
just confirms it lands where the notebook said it would, to two decimals.

```python
def test_per_point_head_matches_measurement(water_curve):
    for point in water_curve.points:
        q = round(point.capacity.magnitude, 3)
        if q not in EXPECTED_BY_POINT:
            continue
        expected_head, _, _ = EXPECTED_BY_POINT[q]
        assert point.head.magnitude == pytest.approx(expected_head, rel=TOL)
```

`pytest.approx(value, rel=TOL)` is the engineering test idiom. Floating
point makes `==` useless above the last few digits; `rel=0.02` says "two
percent of the expected value is fine". Pick `rel` deliberately — for
NFR-06 it's the documented ±2 %.

### Step 3 — Assert the numerical layer (fit quality)

```python
def _r_squared(observed, predicted):
    ss_res = ((observed - predicted) ** 2).sum()
    ss_tot = ((observed - observed.mean()) ** 2).sum()
    return 1.0 - ss_res / ss_tot

def test_fit_quality_r_squared(water_curve):
    points = water_curve.points
    heads = np.array([p.head.magnitude for p in points])
    predicted = np.array([water_curve.predict_head(p.capacity).magnitude for p in points])
    assert _r_squared(heads, predicted) > 0.99
```

R² > 0.99 says the polynomial explains 99 % of the variance — strong fit
for seven points. Lower thresholds tell you the curve under-fits the
data (try a higher polynomial degree) or the data itself is too noisy.

Determinism is the other numerical concern. Shuffle the input and the
fit must not change:

```python
def test_curve_fit_deterministic_under_shuffle():
    water, points = _build_curve()
    a = PerformanceCurve(fluid=water, points=points[:])
    shuffled = points[:]; random.Random(0).shuffle(shuffled)
    b = PerformanceCurve(fluid=water, points=shuffled)
    q = Q_(300, "m**3/h")
    assert a.predict_head(q).magnitude == pytest.approx(b.predict_head(q).magnitude)
```

This is in [tests/test_bugs.py](../../../tests/test_bugs.py) — a guard
against the §4.4 audit finding where the fitter received unsorted
points and gave order-dependent results.

### Step 4 — Assert the physical layer

The killer test. Take the water curve, apply the affinity laws to scale
to the rated speed (1750 rpm), correct the fluid to the service fluid
(oil at SG 0.972), then ask the curve for head at the design rated
capacity. Compare to the design point's known differential head.

```python
def test_service_curve_at_rated_matches_design_head(water_curve, oil, design_point):
    service = water_curve.to_speed(Q_(1750, "rpm")).to_fluid(oil)
    predicted = service.predict_head(design_point.capacity).magnitude
    expected  = design_point.differential_head.magnitude  # 110.5 m
    assert predicted == pytest.approx(expected, rel=TOL)
```

This single test exercises the entire pipeline: unit conversion, point
computation, sort + fit, polynomial regression, affinity laws, fluid
correction, polynomial evaluation. If any link breaks, this test catches
it. If you only had time to write one test, write this one.

## Pitfalls

- **Don't write tests against your own library's output.** Capture the
  truth from a different source — the notebook a domain expert ran by
  hand, a published curve, an ISO 9906 reference case. Otherwise the
  test only proves "the code still does what it did yesterday", which is
  not the same as "the code is right".
- **`pytest.approx` defaults.** With no `rel`/`abs` argument, the default
  tolerance is 1e-6 relative — far tighter than physical measurements
  warrant. Always specify your tolerance.
- **Asserting on intermediate dictionaries.** Tests that read
  `summary["test_summary"]["Head"][0]` break on every refactor. Assert on
  the public API method's return value, not its internal shape.
- **Don't combine math + physics in one assert.** If a single test fails,
  you must know whether the math is wrong or the physics is wrong. Split
  layers across tests.
- **Don't skip `R² > 0.99` because "the curve looks right in the
  notebook".** A 4th-order polynomial on 5 points overfits silently. The
  R² floor catches both overfit and noisy data, and protects future-you
  from a slow drift.
