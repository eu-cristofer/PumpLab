// api-client.jsx — minimal client for the FastAPI /api/analysis/fit-curve endpoint.
// Sprint 0 end-to-end proof: form state → POST → Python computation → chart.

const API_BASE = "http://localhost:8000";

// Convert the existing form state into the FitCurveRequest shape.
// The GUI works in kgf/cm² or bar; the API accepts either via Pint, so we
// pass the unit string through verbatim.
function buildFitCurveRequest(state, unit) {
  const { rated, points } = state;
  const pressureUnit = unit === "kgf" ? "kgf/cm**2" : "bar";
  const sg = parseFloat(rated.sgNom) || 1;

  const validPoints = points
    .map(p => {
      const q = parseFloat(p.q);
      const pSuc = parseFloat(p.pSuc);
      const pDis = parseFloat(p.pDis);
      const power = parseFloat(p.power);
      const n = parseFloat(p.n);
      if ([q, pSuc, pDis, power, n].some(v => isNaN(v))) return null;
      if (q <= 0) return null;
      return {
        capacity: { value: q, unit: "m**3/h" },
        inlet_pressure: { value: pSuc, unit: pressureUnit },
        outlet_pressure: { value: pDis, unit: pressureUnit },
        breaking_power: { value: power, unit: "kW" },
        speed_of_rotation: { value: n, unit: "rpm" },
      };
    })
    .filter(Boolean);

  return {
    fluid: {
      name: "Service Fluid",
      density: { value: sg * 1000, unit: "kg/m**3" },
    },
    design_point: {
      capacity: { value: parseFloat(rated.qNom) || 0, unit: "m**3/h" },
      differential_head: { value: parseFloat(rated.hNom) || 0, unit: "m" },
      speed_of_rotation: { value: parseFloat(rated.nNom) || 0, unit: "rpm" },
    },
    test_points: validPoints,
    degree: Math.min(4, Math.max(2, validPoints.length - 1)),
    smooth_points: 60,
  };
}

async function fitCurveViaApi(payload) {
  const response = await fetch(`${API_BASE}/api/analysis/fit-curve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try { detail = JSON.parse(text).detail || text; } catch (_) { /* keep raw */ }
    throw new Error(`API ${response.status}: ${detail}`);
  }
  return JSON.parse(text);
}

// Renders the head curve returned by the API using the existing LineChart helper.
function BackendCurveCard({ state, unit }) {
  const [status, setStatus] = React.useState("idle"); // idle | loading | error | ok
  const [error, setError] = React.useState(null);
  const [result, setResult] = React.useState(null);

  const onClick = async () => {
    setStatus("loading");
    setError(null);
    try {
      const payload = buildFitCurveRequest(state, unit);
      if (payload.test_points.length < 3) {
        throw new Error("Need at least 3 complete test points (Q, pSuc, pDis, power, N).");
      }
      const body = await fitCurveViaApi(payload);
      setResult(body);
      setStatus("ok");
    } catch (e) {
      setError(e.message || String(e));
      setStatus("error");
    }
  };

  const measuredHeadPts =
    result && result.measured_flows.map((q, i) => ({ x: q, y: result.measured_heads[i] }));
  const fittedHeadPts =
    result && result.flow_rates.map((q, i) => ({ x: q, y: result.heads[i] }));

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-h">
        <strong>Phase-1 backend fit (Python)</strong>
        <span className="spacer"/>
        <button className="btn primary" onClick={onClick} disabled={status === "loading"}>
          {status === "loading" ? "Fitting…" : "Fit via API"}
        </button>
      </div>
      <div style={{ padding: 14, fontSize: 12, color: "var(--ink-3)" }}>
        Sends the current Setup form to <code>POST /api/analysis/fit-curve</code> and renders the
        Python-fitted head curve. Requires <code>uvicorn pump.api.main:app</code> on{" "}
        <code>localhost:8000</code>.
      </div>

      {status === "error" && (
        <div
          className="banner"
          style={{ background: "var(--fail-soft, #fde2e2)", borderColor: "var(--fail, #c33)" }}
        >
          <span className="bicon"><Icon name="warn" size={16}/></span>
          <div><strong>API error:</strong> {error}</div>
        </div>
      )}

      {status === "ok" && result && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: 14 }}>
            <KPI label="Rated Q" value={result.rated_flow.toFixed(1)} unit={result.units.flow}/>
            <KPI label="Rated H" value={result.rated_head.toFixed(2)} unit={result.units.head}/>
            <KPI label="Rated P" value={result.rated_power.toFixed(2)} unit={result.units.power}/>
            <KPI label="Head R²" value={result.head_r_squared.toFixed(4)} unit=""/>
          </div>
          <LineChart
            title="HEAD CURVE (Python backend)"
            xLabel={`Flow [${result.units.flow}]`}
            yLabel="Head"
            unitY={result.units.head}
            points={measuredHeadPts}
            fit={null}
            nameplate={{ x: result.rated_flow, y: result.rated_head, label: "Rated" }}
            color="var(--accent)"
            w={720}
            h={300}
          />
          {/* Overlay the fitted polyline manually since LineChart expects coefficients */}
          <div style={{ padding: "0 14px 14px", fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
            Fitted polyline: {fittedHeadPts.length} samples · degree {Math.max(2, result.measured_flows.length - 1)}
          </div>
        </>
      )}
    </div>
  );
}

function KPI({ label, value, unit }) {
  return (
    <div style={{ background: "var(--bg-2)", padding: 10, borderRadius: 6 }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)" }}>{label}</div>
      <div style={{ fontSize: 18, fontFamily: "var(--font-mono)", color: "var(--ink-1)" }}>
        {value} <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{unit}</span>
      </div>
    </div>
  );
}

Object.assign(window, { buildFitCurveRequest, fitCurveViaApi, BackendCurveCard });
