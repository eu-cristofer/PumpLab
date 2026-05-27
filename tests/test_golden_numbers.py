"""Golden-numbers test for the B-432301D pump (examples/B-432301D.ipynb).

The fixtures in conftest.py mirror the notebook's design point and seven
test points.  This test guards the calculation chain against accuracy
regressions (NFR-06: ±2 %).  The "expected" values are the per-point
measurements and the design-point head; the assertions compare both
the raw computed properties and the fitted predictions to them.
"""

import numpy as np
import pytest

from pump import Q_

TOL = 0.02  # ±2% (NFR-06)


def _r_squared(observed: np.ndarray, predicted: np.ndarray) -> float:
    ss_res = ((observed - predicted) ** 2).sum()
    ss_tot = ((observed - observed.mean()) ** 2).sum()
    return 1.0 - ss_res / ss_tot


# Per-point expected values from the notebook (printed at cell #25).
# capacity (m³/h) → (head_m, power_kW, eff_pct).
EXPECTED_BY_POINT = {
    477.700: (119.55, 284.44, 54.71),
    656.580: (118.89, 325.37, 65.38),
    856.970: (116.36, 394.90, 68.81),
    1085.190: (110.32, 402.84, 80.98),
    1284.840: (105.08, 442.10, 83.22),
    1541.170: (99.20, 501.73, 83.03),
}


def test_per_point_head_matches_measurement(water_curve):
    """Head computed from the inlet/outlet pressures must match the
    notebook's reported head within 2 %."""
    for point in water_curve.points:
        q = round(point.capacity.magnitude, 3)
        if q not in EXPECTED_BY_POINT:
            continue
        expected_head, _, _ = EXPECTED_BY_POINT[q]
        assert point.head.magnitude == pytest.approx(expected_head, rel=TOL), (
            f"head at q={q} m³/h"
        )


def test_per_point_efficiency_matches_measurement(water_curve):
    for point in water_curve.points:
        q = round(point.capacity.magnitude, 3)
        if q not in EXPECTED_BY_POINT:
            continue
        _, _, expected_eff = EXPECTED_BY_POINT[q]
        assert point.efficiency.magnitude == pytest.approx(expected_eff, rel=TOL), (
            f"efficiency at q={q} m³/h"
        )


def test_fit_quality_r_squared(water_curve):
    """The polynomial fit must explain ≥ 99 % of the variance for head,
    power and efficiency."""
    points = water_curve.points

    heads = np.array([p.head.magnitude for p in points])
    predicted_h = np.array(
        [water_curve.predict_head(p.capacity).magnitude for p in points]
    )
    assert _r_squared(heads, predicted_h) > 0.99

    powers = np.array([p.breaking_power.magnitude for p in points])
    predicted_p = np.array(
        [water_curve.predict_breaking_power(p.capacity).magnitude for p in points]
    )
    assert _r_squared(powers, predicted_p) > 0.99

    effs = np.array([p.efficiency.magnitude for p in points])
    predicted_e = np.array(
        [water_curve.predict_efficiency(p.capacity).magnitude for p in points]
    )
    assert _r_squared(effs, predicted_e) > 0.99


def test_fitted_curve_predicts_measured_point_within_tolerance(water_curve):
    """Predicting the fitted polynomial at one of the original measurement
    capacities must land within 2 % of the measured head."""
    q = Q_(856.97, "m**3/h")
    expected_head, _, _ = EXPECTED_BY_POINT[856.970]
    predicted = water_curve.predict_head(q).magnitude
    assert predicted == pytest.approx(expected_head, rel=TOL)


def test_service_curve_at_rated_matches_design_head(water_curve, oil, design_point):
    """After correcting the water test curve to the design speed
    (1750 rpm) and the service fluid (oil), the head at the rated
    capacity must match the design differential head within 2 %.

    This is the end-to-end physics check: speed affinity + fluid
    correction + curve fit + polynomial prediction in one shot.
    """
    service = water_curve.to_speed(Q_(1750, "rpm")).to_fluid(oil)

    predicted = service.predict_head(design_point.capacity).magnitude
    expected = design_point.differential_head.magnitude  # 110.5 m

    assert predicted == pytest.approx(expected, rel=TOL), (
        f"service curve head at rated {design_point.capacity} differs from design "
        f"head {expected} m by > {TOL*100:.0f}% (got {predicted:.3f} m)"
    )
