"""Shared pytest fixtures.

Centralises the test pump (B-432301D from examples/B-432301D.ipynb) so every
test file in the suite uses the same known-good inputs.
"""

import pytest

from pump import (
    DesignPoint,
    Fluid,
    PerformanceCurve,
    Q_,
    TestPoint,
)


# ---------------------------------------------------------------------------
# B-432301D — values copied verbatim from examples/B-432301D.ipynb
# ---------------------------------------------------------------------------

CAPACITIES = [0.00001, 477.700, 656.580, 856.970, 1085.190, 1284.840, 1541.170]
INLET_PRESSURES = [2.240, 1.968, 1.938, 1.978, 1.988, 1.927, 1.815]
OUTLET_PRESSURES = [14.031, 13.909, 13.797, 13.560, 12.930, 12.308, 11.550]
LOADS = [209.610, 284.440, 325.370, 394.900, 402.840, 442.100, 501.730]
SPEEDS = [1798, 1798, 1798, 1797, 1797, 1797, 1796]


@pytest.fixture
def water() -> Fluid:
    return Fluid(name="Water", density=Q_(1000, "kg/m**3"))


@pytest.fixture
def oil() -> Fluid:
    return Fluid(name="Oil", density=Q_(972, "kg/m**3"))


@pytest.fixture
def design_point(oil) -> DesignPoint:
    return DesignPoint(
        fluid=oil,
        capacity=Q_(850, "m**3/h"),
        differential_head=Q_(110.5, "m"),
        NPSH_available=Q_(8.08, "m"),
        speed_of_rotation=Q_(1750, "rpm"),
    )


@pytest.fixture
def test_points(water) -> list[TestPoint]:
    return [
        TestPoint(
            fluid=water,
            capacity=Q_(q, "m**3/h"),
            inlet_pressure=Q_(p_in, "kgf/cm**2"),
            outlet_pressure=Q_(p_out, "kgf/cm**2"),
            breaking_power=Q_(load, "kW"),
            speed_of_rotation=Q_(n, "rpm"),
            inlet_diameter=Q_(12, "in"),
            outlet_diameter=Q_(10, "in"),
        )
        for q, p_in, p_out, load, n in zip(
            CAPACITIES, INLET_PRESSURES, OUTLET_PRESSURES, LOADS, SPEEDS
        )
    ]


@pytest.fixture
def water_curve(water, test_points) -> PerformanceCurve:
    return PerformanceCurve(fluid=water, points=test_points)
