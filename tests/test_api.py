"""Integration tests for the FastAPI surface.

Uses httpx + FastAPI's TestClient (ASGI transport) to exercise the
fit-curve endpoint end-to-end without needing a live uvicorn server.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from pump.api.main import app

pytestmark = pytest.mark.asyncio

# B-432301D inputs (identical to conftest fixtures; duplicated here to
# keep the API tests self-describing as JSON-shaped payloads).
PAYLOAD = {
    "fluid": {
        "name": "Water",
        "density": {"value": 1000.0, "unit": "kg/m**3"},
    },
    "design_point": {
        "capacity": {"value": 850, "unit": "m**3/h"},
        "differential_head": {"value": 110.5, "unit": "m"},
        "speed_of_rotation": {"value": 1750, "unit": "rpm"},
    },
    "test_points": [
        {
            "capacity": {"value": q, "unit": "m**3/h"},
            "inlet_pressure": {"value": p_in, "unit": "kgf/cm**2"},
            "outlet_pressure": {"value": p_out, "unit": "kgf/cm**2"},
            "breaking_power": {"value": load, "unit": "kW"},
            "speed_of_rotation": {"value": n, "unit": "rpm"},
            "inlet_diameter": {"value": 12, "unit": "in"},
            "outlet_diameter": {"value": 10, "unit": "in"},
        }
        for q, p_in, p_out, load, n in zip(
            [477.700, 656.580, 856.970, 1085.190, 1284.840, 1541.170],
            [1.968, 1.938, 1.978, 1.988, 1.927, 1.815],
            [13.909, 13.797, 13.560, 12.930, 12.308, 11.550],
            [284.440, 325.370, 394.900, 402.840, 442.100, 501.730],
            [1798, 1798, 1797, 1797, 1797, 1796],
        )
    ],
    "degree": 4,
    "smooth_points": 30,
}


async def _client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def test_health_endpoint():
    async with await _client() as c:
        r = await c.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


async def test_fit_curve_returns_arrays_and_predictions():
    async with await _client() as c:
        r = await c.post("/api/analysis/fit-curve", json=PAYLOAD)
    assert r.status_code == 200, r.text
    body = r.json()

    # Arrays present and same length
    n = len(body["flow_rates"])
    assert n == PAYLOAD["smooth_points"]
    for key in ("heads", "powers", "efficiencies"):
        assert len(body[key]) == n

    # Measured arrays match number of input points
    assert len(body["measured_flows"]) == len(PAYLOAD["test_points"])

    # Rated predictions are non-trivial
    assert body["rated_flow"] == pytest.approx(850.0, rel=1e-6)
    assert body["rated_head"] > 0
    assert body["rated_power"] > 0
    assert body["rated_efficiency"] > 0

    # Fit quality (six measured points, no shutoff — small loosening vs. golden test)
    assert body["head_r_squared"] > 0.99
    assert body["power_r_squared"] > 0.98
    assert body["efficiency_r_squared"] > 0.97

    # Units echo
    assert body["units"]["flow"] == "m**3/h"
    assert body["units"]["head"] == "m"


async def test_fit_curve_rejects_too_few_points():
    bad = {**PAYLOAD, "test_points": PAYLOAD["test_points"][:2]}
    async with await _client() as c:
        r = await c.post("/api/analysis/fit-curve", json=bad)
    assert r.status_code == 422


async def test_openapi_docs_are_served():
    async with await _client() as c:
        r = await c.get("/docs")
    assert r.status_code == 200
    assert "swagger" in r.text.lower()
