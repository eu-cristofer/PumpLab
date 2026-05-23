# 05 — Affinity laws

**Status:** 🟡 speed branch implemented (`PerformanceCurve.to_speed`); impeller-trim branch is a gap
**Related use cases:** UC-06, UC-07

## What it is

The affinity laws (also called the *pump laws* or, when applied to fans, the *fan laws*) are a set of similarity rules that predict how a centrifugal pump's performance scales when you change *one* of its geometric or kinematic parameters — most commonly its rotational speed `N`, or its impeller diameter `D`.

In plain English: if you spin the same impeller 10 % faster, you push 10 % more flow against 21 % more head and you draw 33 % more power.

## Engineering context

Engineers use the affinity laws to:

- Predict how an installed pump will behave on a **variable frequency drive** (VFD) — the only change is `N` (UC-06).
- Decide how much to **trim an impeller** to bring an oversized pump down to design conditions without buying a new one (UC-07).
- Re-base a manufacturer's test curve (run at one speed) to the actual installed speed.

The laws are an *approximation*. They are exact for ideal, geometrically similar flow at constant efficiency. In practice they are very accurate for moderate speed changes (within ±25 %) and slightly less accurate for impeller trims (efficiency drops slightly as the impeller is trimmed away from its design diameter).

## Governing equations

### Speed change (same impeller)

```
Q₂ / Q₁  =  N₂ / N₁
H₂ / H₁  =  (N₂ / N₁)²
P₂ / P₁  =  (N₂ / N₁)³
η₂      ≈   η₁
NPSH-R₂ / NPSH-R₁  =  (N₂ / N₁)²
```

### Impeller diameter change (same casing, same speed)

```
Q₂ / Q₁  =  D₂ / D₁
H₂ / H₁  =  (D₂ / D₁)²
P₂ / P₁  =  (D₂ / D₁)³
η₂       ≈  η₁ · (D₂ / D₁)^0.5    (Hydraulic Institute empirical correction)
```

The HI correction recognises that geometric similarity is *not* exact when only the impeller is trimmed (the casing diameter stays put, so tip clearance changes). For a trim of less than 5 % of the original diameter, the bare ratio is usually accurate enough.

### Generalised (both at once)

```
Q ∝ N · D³
H ∝ N² · D²
P ∝ ρ · N³ · D⁵
```

The third expression also reveals where the **density dependence** sits — power scales linearly with `ρ`, which is what `PerformanceCurve.to_fluid` exploits when re-basing a water curve to another fluid (concept 01).

## Computation flowchart

```mermaid
flowchart TD
  C1["PerformanceCurve at N₁, D₁"] --> Choose{change which?}
  Choose -- speed N --> S
  Choose -- diameter D --> D
  Choose -- both --> Both

  subgraph S[Speed branch]
    S1[ratio = N₂/N₁]
    S1 --> SQ[Q₂ = Q₁·ratio]
    S1 --> SH[H₂ = H₁·ratio²]
    S1 --> SP[P₂ = P₁·ratio³]
    S1 --> SE[η₂ = η₁]
  end

  subgraph D[Diameter branch]
    D1[ratio = D₂/D₁]
    D1 --> DQ[Q₂ = Q₁·ratio]
    D1 --> DH[H₂ = H₁·ratio²]
    D1 --> DP[P₂ = P₁·ratio³]
    D1 --> DE[η₂ = η₁·√ratio]
  end

  subgraph Both[Combined branch]
    B[Q₂ = Q₁·(N₂D₂³)/(N₁D₁³)]
    B --> BH[H₂ = H₁·(N₂D₂)²/(N₁D₁)²]
    B --> BP[P₂ = P₁·(N₂D₂^{5/3})³/(N₁D₁^{5/3})³]
  end

  SQ --> C2["New PerformanceCurve"]
  DQ --> C2
  B  --> C2
```

## Library mapping

| Step in flowchart | Library function | Module | Status |
|---|---|---|---|
| Speed-only transform | `PerformanceCurve.to_speed(new_speed)` | `pump.performance_curve` | ✅ |
| Diameter-only transform | `PerformanceCurve.to_diameter(new_diameter)` | `pump.performance_curve` | ❌ gap |
| Combined transform | `PerformanceCurve.to(new_speed=…, new_diameter=…)` | `pump.performance_curve` | ❌ gap |
| Fluid re-base (density) | `PerformanceCurve.to_fluid(new_fluid)` | `pump.performance_curve` | 🟡 partial — no viscosity correction |
| Viscosity correction | per ANSI/HI 9.6.7 — correction factors `C_Q`, `C_H`, `C_η` from viscosity ratio | new helper | ❌ gap |

The speed branch (`to_speed`, `pump/performance_curve.py:435-504`) is correct and tested manually against an example notebook. The diameter and viscosity branches are the obvious next features.

## Assumptions and limitations

- **Geometric similarity.** Only valid when the impeller / casing geometry is preserved during the change (or the change is small enough that geometric similarity is a reasonable approximation).
- **Constant efficiency in the speed branch.** Slightly optimistic — large speed reductions actually drop efficiency a couple of points because Reynolds number falls and mechanical losses become a larger fraction of input power. Adequate for first-cut sizing.
- **Trim limit.** Most centrifugal pumps tolerate up to ~10 % diameter reduction before the curve becomes erratic; the library should refuse trims beyond a user-set fraction and warn.
- **NPSH-R scales as `N²` only approximately.** The Hydraulic Institute publishes more conservative scaling rules for high-energy services; not modelled here.
- **The speed-branch implementation** currently does *not* re-fit the polynomial — it transforms each measured point and reconstructs a new `PerformanceCurve`. This means the returned curve's polynomial coefficients are *recomputed* from the transformed points, which is the right thing to do (preserves fit quality at the new speed).

## References

- ANSI/HI 1.3 — *Rotodynamic Centrifugal Pumps for Design and Application*, §1.3.2 (Affinity rules).
- ANSI/HI 9.6.7 — *Effects of Liquid Viscosity on Rotodynamic Pump Performance* (the source of the `C_Q`, `C_H`, `C_η` viscosity-correction tables).
- API 610 / ISO 13709, §6.1.10 (Impeller trim).
- Karassik et al. — *Pump Handbook*, 4th ed., §2.3 (Modelling laws).
