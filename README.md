# PumpLab

PumpLab is a dual-target (desktop + web) API 610 centrifugal pump Factory Acceptance Test (FAT) engineering tool and computation library. It provides a bilingual (EN/PT) interface and a robust Python mathematical engine for pump performance curve fitting, tolerance checking, and report generation.

## Installation

This project uses `mamba` for dependency management. To set up the environment and install the package in editable mode (which includes dev dependencies), run:

```bash
git clone https://github.com/cristofer/PumpLab.git
cd PumpLab
mamba env create -f environment.yml
mamba activate pump
```

> **Note:** 🚫 **Do not put channels in `environment.yml`.** 
> Channels depend on where the environment is being built (e.g., company network vs. public internet). Please configure your channels locally in your `.condarc` file.

## Quickstart

Here is a basic example of using the Python library to create a design point, define test points, and evaluate pump performance:

```python
from pump import Fluid, Q_
from pump.point import DesignPoint, TestPoint
from pump.performance_curve import PerformanceCurve

water = Fluid(name="Water", density=Q_(1000, "kg/m**3"))
dp = DesignPoint(fluid=water, capacity=Q_(120, "m**3/h"), differential_head=Q_(85, "m"))

test_points = [
    TestPoint(fluid=water, capacity=Q_(0, "m**3/h"), _head=Q_(100, "m")),
    TestPoint(fluid=water, capacity=Q_(60, "m**3/h"), _head=Q_(95, "m")),
    TestPoint(fluid=water, capacity=Q_(120, "m**3/h"), _head=Q_(85, "m"))
]

curve = PerformanceCurve(fluid=water, points=test_points, polynomial_degree=2)
print(f"Predicted head at 100 m³/h: {curve.predict_head(Q_(100, 'm**3/h')):.2f~P}")
```

## Running the Application

PumpLab includes a React frontend and a FastAPI backend.
- **API Server**: Run `uvicorn pump.api.main:app --reload` to start the backend.
- **Frontend**: Navigate to `PumpLabGUI/` and run `npm run dev`.

## Documentation

- **Concepts & Project Docs**: See the `docs/` folder for deep dives into pump performance curves, affinity laws, project requirements, and architecture.
- **API Documentation**: Once the FastAPI server is running, visit http://localhost:8000/docs for the auto-generated OpenAPI/Swagger UI.