# 04 — NPSH analysis (cavitation)

**Status:** ❌ not implemented — **gap**
**Related use cases:** UC-05

## What it is

**Net Positive Suction Head** measures how much suction-side energy a pump has *above the fluid's vapour pressure*. If the energy available falls below what the impeller eye needs, the fluid flashes to vapour inside the pump — *cavitation*. Cavitation collapses noisily, erodes metal, destroys seals, and degrades the head curve.

Two values are compared:

- **NPSH-A (available)** — set by the *installation*: tank pressure, elevation, suction pipe losses, fluid vapour pressure.
- **NPSH-R (required)** — set by the *pump*: how much suction head it needs in order not to cavitate. The manufacturer publishes this as a curve `NPSH-R(Q)`.

A safe pump installation has `NPSH-A > NPSH-R` with a margin (usually 0.5 m to 1.0 m, or 10–25 % of NPSH-R).

## Engineering context

NPSH analysis is the single safety check that prevents pumps from being destroyed before they earn their keep. Application engineers check NPSH:

- When a pump is sized for hot fluid — vapour pressure is high, NPSH-A shrinks fast.
- When a pump is sized at high altitude — atmospheric pressure is lower.
- When a suction line is long, restrictive, or under-sized — friction eats NPSH-A.
- When tanks empty during a transient — the static term collapses.

Failing this check is one of the top three causes of pump failure in service (alongside dry running and operating off-curve at low Q).

## Governing equations

For a typical open-tank installation, suction flange at elevation `z_pump`, fluid surface at elevation `z_surface`:

```
NPSH-A = (p_atm + p_gauge − p_v) / (ρ g)  +  (z_surface − z_pump)  −  H_f,suction  −  v²/(2g)
```

where:

- `p_atm` atmospheric (or vessel) pressure at the surface,
- `p_gauge` any gauge pressure on top of the liquid surface (`0` for an open tank to atmosphere),
- `p_v` the **vapour pressure** of the fluid at the operating temperature,
- `H_f,suction` friction + minor losses in the suction line up to the pump flange,
- `v²/(2g)` the velocity head at the suction flange.

For a closed (pressurised) vessel `p_atm` is replaced by the vessel absolute pressure.

The **margin**:

```
NPSH margin    =  NPSH-A − NPSH-R
NPSH ratio     =  NPSH-A / NPSH-R   (≥ 1.10 typical minimum; ≥ 1.30 for high-energy or critical service)
```

NPSH-R itself is a *pump property* identified by 3 % head drop (the so-called *NPSH-3*) during a suppression test. Some standards (API 610 §6.1.6) require an additional margin over NPSH-3 for safety.

## Computation flowchart

```mermaid
flowchart TD
  Inst["Installation:<br/>p_atm or vessel pressure<br/>z_surface, z_pump<br/>suction line geometry"] --> A1
  Fluid["Fluid:<br/>ρ, vapour pressure p_v(T)"] --> A1
  Q["Q (operating flow)"] --> A1
  A1[Compute NPSH-A] --> NPSHA["NPSH-A(Q)"]

  PumpData["Pump test data:<br/>NPSH-R(Q) curve"] --> NPSHR["NPSH-R(Q)"]

  NPSHA --> Cmp{NPSH-A ≥ NPSH-R · (1+margin)?}
  NPSHR --> Cmp
  Cmp -- yes --> Pass[Cavitation-safe]
  Cmp -- no --> Fail[Cavitation risk]
  Pass --> Report[Report margin + ratio]
  Fail --> Report
```

## Library mapping

| Step in flowchart | Proposed library function | Module |
|---|---|---|
| Vapour pressure of a fluid | `Fluid.vapour_pressure(T)` — table lookup or Antoine eqn | `pump.utilities.fluid` (extend) |
| Installation description | `Installation(suction_segments, suction_fittings, vessel_pressure, surface_elevation, pump_elevation)` | `pump.system` (new) |
| Suction friction | reuse `SystemCurve` machinery from concept 02 over only the suction path | `pump.system` (new) |
| NPSH-A computation | `npsh_available(installation, fluid, capacity, temperature) -> Q_` | `pump.npsh` (new) |
| NPSH-R curve | `PerformanceCurve.predict_npshr(capacity)` if NPSH-R was supplied per `TestPoint` | `pump.performance_curve` (extend) |
| Verdict | `cavitation_check(npsh_a, npsh_r, min_margin=0.5*ureg.m) -> Verdict` | `pump.npsh` (new) |

**Gap details:** `TestPoint` accepts arbitrary kwargs, so storing `npsh_required` per measured point already works at the data layer. What is missing is (a) a vapour-pressure lookup, (b) a fitted `NPSH-R(Q)` polynomial alongside the H/P/η ones, (c) the `npsh_available` formula, (d) the verdict logic.

## Assumptions and limitations

- **Pure single fluids.** Mixtures and dissolved gases (which release at low pressure long before water vapour does) are not modelled.
- **Steady state.** Transient drops (pump trip on a parallel pump, valve closure) need a separate transient analyser.
- **NPSH-R is the as-tested 3 % drop value.** Pump cavitation in fact starts at higher NPSH (incipient cavitation), which can erode the impeller even when the head drop is < 3 %. The Hydraulic Institute publishes "cavitation-free" margins per service severity.
- **Temperature constant along the suction line.** No thermal coupling.

## References

- API 610 / ISO 13709, §6.1.6 (Suction performance, NPSH).
- ISO 9906:2012, §6.2 (NPSH test).
- Hydraulic Institute ANSI/HI 9.6.1 — *Rotodynamic Pumps Guideline for NPSH Margin*.
- Karassik et al. — *Pump Handbook*, 4th ed., Ch. 2 (Cavitation).
- Antoine equation for vapour pressure of water (and many process fluids) — *Perry's Chemical Engineers' Handbook*, 9th ed., Table 2-8.
