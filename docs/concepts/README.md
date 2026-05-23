# Technical concept documentation

**Deliverable 3 — Phase 0**

Each computation domain that the project must cover gets its own concept page, following the template defined in `phase1/00_phase_spec.md`:

> What it is · Engineering context · Governing equations · Computation flowchart · Library mapping · Assumptions and limitations · References

The library-mapping table inside each domain doc rolls up to the gap analysis in [`../library-audit.md`](../library-audit.md) §2. Where a domain is not yet implemented, the mapping table records *what the library function should be* — these rows become the API contract for Phase 1.

| # | Domain | Library status | Doc |
|---|---|---|---|
| 1 | Pump performance curves | ✅ implemented | [`01-pump-performance-curves.md`](01-pump-performance-curves.md) |
| 2 | System resistance curves | ❌ gap | [`02-system-resistance-curves.md`](02-system-resistance-curves.md) |
| 3 | Operating point | ❌ gap | [`03-operating-point.md`](03-operating-point.md) |
| 4 | NPSH analysis | ❌ gap | [`04-npsh-analysis.md`](04-npsh-analysis.md) |
| 5 | Affinity laws | 🟡 speed-only | [`05-affinity-laws.md`](05-affinity-laws.md) |
| 6 | Specific speed | ❌ gap | [`06-specific-speed.md`](06-specific-speed.md) |
| 7 | Series & parallel operation | ❌ gap | [`07-series-parallel-operation.md`](07-series-parallel-operation.md) |
| 8 | Pipe hydraulics | ❌ gap | [`08-pipe-hydraulics.md`](08-pipe-hydraulics.md) |

## Conventions used in these docs

- **Units**: every equation is dimensionally consistent in SI. The library's internal canonical units are listed in `pump/utilities/unit_conversion.py:STANDARD_UNITS` (m³/h, m, kPa, kW, rpm, kg/m³, °C, cP). User-facing conversions are not the responsibility of the math — they happen in the unit-conversion layer.
- **Symbols**: `Q` flow, `H` head, `P` power, `η` efficiency, `N` speed, `D` diameter, `ρ` density, `μ` dynamic viscosity, `ν` kinematic viscosity, `g` gravity (9.81 m/s²). Subscript `1` = inlet/suction, `2` = outlet/discharge.
- **Flowcharts**: drawn in Mermaid so they render natively on GitHub and in the future help system. Each node is keyed to the library mapping table.
- **Math notation**: ASCII / Unicode in the body, LaTeX-ish for clarity (`H = ΔP/(ρ g)`, `Q ∝ N`). Where a textbook expression matters precisely the doc spells it out.

## How to read each doc

If you are an **engineer** approaching pump fundamentals for the first time, read *What it is* and *Engineering context* — they are written without jargon. If you are a **developer** implementing the domain, the *Governing equations* + *Computation flowchart* + *Library mapping* triad is the contract.
