"""Pydantic request/response models for the analysis endpoints.

Field names mirror the `DesignPoint` / `TestPoint` keyword arguments so a
single source of truth governs what the frontend must send. Units are
passed alongside magnitudes to keep the API explicit; everything is
funnelled through `pump.quantity_factory` server-side, so the client may
send any compatible unit string.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class Quantity(BaseModel):
    """A magnitude + unit pair, e.g. `{"value": 120, "unit": "m**3/h"}`."""

    model_config = ConfigDict(extra="forbid")

    value: float
    unit: str


class FluidIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(default="Water")
    density: Quantity = Field(
        default_factory=lambda: Quantity(value=1000.0, unit="kg/m**3")
    )


class DesignPointIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    capacity: Quantity
    differential_head: Quantity
    speed_of_rotation: Optional[Quantity] = None
    NPSH_available: Optional[Quantity] = None


class TestPointIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    capacity: Quantity
    inlet_pressure: Quantity
    outlet_pressure: Quantity
    breaking_power: Quantity
    speed_of_rotation: Quantity
    inlet_diameter: Optional[Quantity] = None
    outlet_diameter: Optional[Quantity] = None


class FitCurveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fluid: FluidIn = Field(default_factory=FluidIn)
    design_point: DesignPointIn
    test_points: list[TestPointIn] = Field(min_length=3)
    degree: int = Field(default=4, ge=1, le=6)
    smooth_points: int = Field(default=50, ge=2, le=500)


class FitCurveResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Measured points (sorted by capacity), all in standard units.
    measured_flows: list[float]
    measured_heads: list[float]
    measured_powers: list[float]
    measured_efficiencies: list[float]

    # Smooth fitted curves over the measured flow range.
    flow_rates: list[float]
    heads: list[float]
    powers: list[float]
    efficiencies: list[float]

    # Predictions at the rated capacity.
    rated_flow: float
    rated_head: float
    rated_power: float
    rated_efficiency: float

    # Quality metrics.
    head_r_squared: float
    power_r_squared: float
    efficiency_r_squared: float

    # Units in which the magnitudes above are expressed.
    units: dict[str, str]
