"""Regression tests for the four bugs identified in library-audit.md §4.2-4.5.

Each test was written to fail against the pre-fix code and pass once the
corresponding fix in pump/ is applied.
"""

import random

import pytest

from pump import (
    DesignPoint,
    Fluid,
    PerformanceChecker,
    PerformanceCurve,
    Q_,
    TestPoint,
)
from pump.utilities.unit_conversion import STANDARD_UNITS, quantity_factory


# ---------------------------------------------------------------------------
# Bug §4.2 — `pint` exception classes referenced but module not imported.
# ImprovedQuantity.convert has `except pint.UndefinedUnitError:` and
# `except pint.DimensionalityError:` clauses, but the module imports only
# `from pint import UnitRegistry, Quantity` — never `pint` itself.  If
# either clause ever fired it would raise NameError instead of the
# intended ValueError.  The fix is to add `import pint`.
# ---------------------------------------------------------------------------

def test_pint_module_available_for_exception_handlers():
    import pint as pint_module

    from pump.utilities import unit_conversion

    assert hasattr(unit_conversion, "pint"), (
        "unit_conversion must import `pint` so its except clauses are valid"
    )
    assert unit_conversion.pint.UndefinedUnitError is pint_module.UndefinedUnitError
    assert unit_conversion.pint.DimensionalityError is pint_module.DimensionalityError


def test_quantity_factory_does_not_crash_on_unmatched_dim():
    """A quantity whose dimensionality is not in STANDARD_UNITS should fall
    through and return unchanged (with a UserWarning) — not NameError."""
    import warnings

    weird = Q_(1, "mol")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        result = quantity_factory(weird)
    assert result.magnitude == 1


# ---------------------------------------------------------------------------
# Bug §4.3 — PerformanceChecker crashes when DesignPoint lacks head_shutoff
# or breaking_power.  acceptable_limits / check_summary / test_summary_with_limits
# referenced the optional attributes unconditionally.
# ---------------------------------------------------------------------------

def _build_curve():
    water = Fluid(name="Water", density=Q_(1000, "kg/m**3"))
    points = [
        TestPoint(
            fluid=water,
            capacity=Q_(q, "m**3/h"),
            inlet_pressure=Q_(1.0, "kgf/cm**2"),
            outlet_pressure=Q_(p, "kgf/cm**2"),
            breaking_power=Q_(load, "kW"),
            speed_of_rotation=Q_(1750, "rpm"),
        )
        for q, p, load in [
            (100.0, 10.0, 50.0),
            (200.0, 9.5, 60.0),
            (300.0, 9.0, 70.0),
            (400.0, 8.0, 80.0),
            (500.0, 6.5, 90.0),
        ]
    ]
    return water, points


def test_checker_no_shutoff_no_breaking_power_does_not_crash():
    water, points = _build_curve()
    design = DesignPoint(
        fluid=water,
        capacity=Q_(300, "m**3/h"),
        differential_head=Q_(85, "m"),
    )
    curve = PerformanceCurve(fluid=water, points=points)
    checker = PerformanceChecker(design, curve)

    # All three properties must work even though head_shutoff / breaking_power
    # are not present on the design point.
    limits = checker.acceptable_limits
    assert "Head (min)" in limits
    assert "Head (max)" in limits

    summary = checker.check_summary
    assert "Flow" in summary

    with_limits = checker.test_summary_with_limits
    assert "Flow" in with_limits


# ---------------------------------------------------------------------------
# Bug §4.4 — PerformanceFitter was fitted on the unsorted input.
# After the fix, the fitter's `.points` must match the curve's sorted order
# regardless of how the input is shuffled.
# ---------------------------------------------------------------------------

def test_fitter_uses_sorted_points():
    water, points = _build_curve()

    shuffled = points[:]
    rng = random.Random(42)
    rng.shuffle(shuffled)

    curve = PerformanceCurve(fluid=water, points=shuffled)
    fitter_caps = [p.capacity.magnitude for p in curve.fitter.points]
    curve_caps = [p.capacity.magnitude for p in curve.points]

    assert fitter_caps == curve_caps
    assert fitter_caps == sorted(fitter_caps)


def test_curve_fit_deterministic_under_shuffle():
    water, points = _build_curve()
    rng = random.Random(0)

    a = PerformanceCurve(fluid=water, points=points[:])
    shuffled = points[:]
    rng.shuffle(shuffled)
    b = PerformanceCurve(fluid=water, points=shuffled)

    # Predictions at a fixed capacity must match.
    q = Q_(300, "m**3/h")
    assert a.predict_head(q).magnitude == pytest.approx(b.predict_head(q).magnitude)
    assert a.predict_breaking_power(q).magnitude == pytest.approx(
        b.predict_breaking_power(q).magnitude
    )


# ---------------------------------------------------------------------------
# Bug §4.5 — Hard-coded "m**3/h" in prediction methods.
# Predictions must work for any flow unit input and must use the standard
# unit lookup, not a literal string.
# ---------------------------------------------------------------------------

def test_capacity_standard_unit_is_used_for_prediction():
    water, points = _build_curve()
    curve = PerformanceCurve(fluid=water, points=points)

    # The library's standard capacity unit
    standard = STANDARD_UNITS["capacity"]["default"]
    assert standard == "m**3/h"

    # Same flow expressed in two units should give the same head prediction.
    q_metric = Q_(300, "m**3/h")
    q_litres = Q_(300_000.0 / 3600.0, "L/s")  # 300 m³/h in litres per second

    h_metric = curve.predict_head(q_metric).magnitude
    h_litres = curve.predict_head(q_litres).magnitude
    assert h_metric == pytest.approx(h_litres, rel=1e-9)


def test_predict_metric_does_not_hardcode_unit_literal():
    """predict_metric must route the capacity through the standard-unit
    lookup, not through a hard-coded "m**3/h" literal."""
    import inspect

    src = inspect.getsource(PerformanceCurve.predict_metric)
    assert '"m**3/h"' not in src and "'m**3/h'" not in src, (
        "predict_metric must use STANDARD_UNITS / quantity_factory rather than "
        "a hard-coded capacity unit string"
    )
