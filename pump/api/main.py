"""FastAPI application entry point.

Run with:  uvicorn pump.api.main:app --reload
"""

from __future__ import annotations

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pump import DesignPoint, Fluid, PerformanceCurve, Q_, TestPoint
from pump.utilities.unit_conversion import STANDARD_UNITS, quantity_factory

from .schemas import FitCurveRequest, FitCurveResponse, Quantity, TestPointIn

app = FastAPI(
    title="PumpLab API",
    description="API 610 pump engineering computations.",
    version="0.0.1",
)

# Sprint 0: permissive CORS. Phase 2 will lock this down to the desktop
# shell + the deployed frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _q(quantity: Quantity) -> Q_:
    return Q_(quantity.value, quantity.unit)


def _build_test_point(fluid: Fluid, p: TestPointIn) -> TestPoint:
    kwargs: dict = {
        "fluid": fluid,
        "capacity": _q(p.capacity),
        "inlet_pressure": _q(p.inlet_pressure),
        "outlet_pressure": _q(p.outlet_pressure),
        "breaking_power": _q(p.breaking_power),
        "speed_of_rotation": _q(p.speed_of_rotation),
    }
    if p.inlet_diameter is not None:
        kwargs["inlet_diameter"] = _q(p.inlet_diameter)
    if p.outlet_diameter is not None:
        kwargs["outlet_diameter"] = _q(p.outlet_diameter)
    return TestPoint(**kwargs)


def _r_squared(observed: np.ndarray, predicted: np.ndarray) -> float:
    if observed.size == 0:
        return 0.0
    ss_tot = float(((observed - observed.mean()) ** 2).sum())
    if ss_tot == 0.0:
        return 1.0
    ss_res = float(((observed - predicted) ** 2).sum())
    return 1.0 - ss_res / ss_tot


@app.post("/api/analysis/fit-curve", response_model=FitCurveResponse)
def fit_curve(req: FitCurveRequest) -> FitCurveResponse:
    try:
        fluid = Fluid(name=req.fluid.name, density=_q(req.fluid.density))

        design_kwargs: dict = {
            "fluid": fluid,
            "capacity": _q(req.design_point.capacity),
            "differential_head": _q(req.design_point.differential_head),
        }
        if req.design_point.speed_of_rotation is not None:
            design_kwargs["speed_of_rotation"] = _q(req.design_point.speed_of_rotation)
        if req.design_point.NPSH_available is not None:
            design_kwargs["NPSH_available"] = _q(req.design_point.NPSH_available)
        design = DesignPoint(**design_kwargs)

        test_points = [_build_test_point(fluid, p) for p in req.test_points]
        curve = PerformanceCurve(
            fluid=fluid, points=test_points, polynomial_degree=req.degree
        )
    except (ValueError, AttributeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # Measured values (sorted by capacity inside PerformanceCurve)
    measured_flows = [p.capacity.magnitude for p in curve.points]
    measured_heads = [p.head.magnitude for p in curve.points]
    measured_powers = [p.breaking_power.magnitude for p in curve.points]
    measured_efficiencies = [p.efficiency.magnitude for p in curve.points]

    # Smooth fitted curves
    q_min, q_max = min(measured_flows), max(measured_flows)
    flow_rates = np.linspace(q_min, q_max, req.smooth_points).tolist()
    heads = [curve.predict_head(Q_(q, "m**3/h")).magnitude for q in flow_rates]
    powers = [curve.predict_breaking_power(Q_(q, "m**3/h")).magnitude for q in flow_rates]
    efficiencies = [
        curve.predict_efficiency(Q_(q, "m**3/h")).magnitude for q in flow_rates
    ]

    # Predictions at rated capacity
    rated_q = quantity_factory(design.capacity)
    rated_head = curve.predict_head(rated_q).magnitude
    rated_power = curve.predict_breaking_power(rated_q).magnitude
    rated_efficiency = curve.predict_efficiency(rated_q).magnitude

    # Fit quality
    predicted_h = np.array(
        [curve.predict_head(p.capacity).magnitude for p in curve.points]
    )
    predicted_p = np.array(
        [curve.predict_breaking_power(p.capacity).magnitude for p in curve.points]
    )
    predicted_e = np.array(
        [curve.predict_efficiency(p.capacity).magnitude for p in curve.points]
    )

    return FitCurveResponse(
        measured_flows=measured_flows,
        measured_heads=measured_heads,
        measured_powers=measured_powers,
        measured_efficiencies=measured_efficiencies,
        flow_rates=flow_rates,
        heads=heads,
        powers=powers,
        efficiencies=efficiencies,
        rated_flow=rated_q.magnitude,
        rated_head=rated_head,
        rated_power=rated_power,
        rated_efficiency=rated_efficiency,
        head_r_squared=_r_squared(np.array(measured_heads), predicted_h),
        power_r_squared=_r_squared(np.array(measured_powers), predicted_p),
        efficiency_r_squared=_r_squared(np.array(measured_efficiencies), predicted_e),
        units={
            "flow": STANDARD_UNITS["capacity"]["default"],
            "head": "m",
            "power": STANDARD_UNITS["power"]["default"],
            "efficiency": "%",
        },
    )
