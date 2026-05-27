# 4. Connecting a React frontend to a Python backend

## The principle

The frontend and the backend are two processes that don't share memory.
The only thing they share is **bytes over HTTP** — usually JSON. Every
problem in this layer is one of three things:

1. The two sides disagree on the wire format (field name, type, units).
2. The browser blocks the request for a security reason (CORS, mixed
   content, cookies).
3. The user can't tell the difference between "loading", "succeeded",
   and "failed" because the frontend forgot to show one of those states.

Get those three right and the rest is plumbing.

## The Sprint 0 reference

Three small surfaces:

- [PumpLabGUI/api-client.jsx](../../../PumpLabGUI/api-client.jsx) — the
  whole client. ~140 lines: payload builder, `fetch` call,
  `BackendCurveCard` React component with idle/loading/error/ok states.
- [PumpLabGUI/index.html](../../../PumpLabGUI/index.html) — script tag
  registration. Load order matters because the GUI sets globals with
  `Object.assign(window, …)`.
- [PumpLabGUI/screen-setup.jsx](../../../PumpLabGUI/screen-setup.jsx) —
  one new line: `<BackendCurveCard state={state} unit={unit}/>` under
  the standards banner.

## The recipe

### Step 1 — Decide your request shape outside the component

Translate UI state into API payload in a pure function. Pure functions
are testable, debuggable in isolation, and can be reused if a second
screen wants the same call.

```js
function buildFitCurveRequest(state, unit) {
  const { rated, points } = state;
  const pressureUnit = unit === "kgf" ? "kgf/cm**2" : "bar";
  const sg = parseFloat(rated.sgNom) || 1;

  const validPoints = points
    .map(p => {
      const q = parseFloat(p.q);
      if (isNaN(q) || q <= 0) return null;
      return {
        capacity:           { value: q,                    unit: "m**3/h" },
        inlet_pressure:     { value: parseFloat(p.pSuc),   unit: pressureUnit },
        outlet_pressure:    { value: parseFloat(p.pDis),   unit: pressureUnit },
        breaking_power:     { value: parseFloat(p.power),  unit: "kW" },
        speed_of_rotation:  { value: parseFloat(p.n),      unit: "rpm" },
      };
    })
    .filter(Boolean);

  return {
    fluid: { name: "Service Fluid", density: { value: sg * 1000, unit: "kg/m**3" } },
    design_point: { ... },
    test_points: validPoints,
    degree: Math.min(4, Math.max(2, validPoints.length - 1)),
    smooth_points: 60,
  };
}
```

Three small things this does right:

- Coerces strings → numbers and drops invalid rows. The form stores
  values as strings; the API wants numbers.
- Carries units explicitly. The UI's "kgf or bar" toggle becomes a
  string the backend converts via Pint.
- Picks a sensible polynomial degree from the data count. Frontend
  defaults that depend on user input are friendlier than hard-coded
  knobs.

### Step 2 — One async helper for the call itself

```js
async function fitCurveViaApi(payload) {
  const response = await fetch(`${API_BASE}/api/analysis/fit-curve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try { detail = JSON.parse(text).detail || text; } catch (_) {}
    throw new Error(`API ${response.status}: ${detail}`);
  }
  return JSON.parse(text);
}
```

Why read `text` first, then `JSON.parse`? Because a 500 error might
return HTML, not JSON. Calling `response.json()` on HTML throws an
opaque parser error that hides the actual status code.

### Step 3 — Four UI states, always

```js
function BackendCurveCard({ state, unit }) {
  const [status, setStatus] = React.useState("idle");
  const [error, setError] = React.useState(null);
  const [result, setResult] = React.useState(null);

  const onClick = async () => {
    setStatus("loading");
    setError(null);
    try {
      const payload = buildFitCurveRequest(state, unit);
      if (payload.test_points.length < 3) {
        throw new Error("Need at least 3 complete test points.");
      }
      const body = await fitCurveViaApi(payload);
      setResult(body);
      setStatus("ok");
    } catch (e) {
      setError(e.message || String(e));
      setStatus("error");
    }
  };
  // ...
}
```

`idle | loading | error | ok` — four explicit states. Every async UI
needs them. A spinner without an error state is the cause of the
"it's been loading for an hour" support ticket.

### Step 4 — Render the response with the units you got back

```js
<KPI label="Rated H" value={result.rated_head.toFixed(2)} unit={result.units.head}/>
<LineChart
  xLabel={`Flow [${result.units.flow}]`}
  yLabel="Head"
  unitY={result.units.head}
  points={result.measured_flows.map((q, i) => ({ x: q, y: result.measured_heads[i] }))}
  nameplate={{ x: result.rated_flow, y: result.rated_head, label: "Rated" }}
/>
```

Read the unit string from `result.units`, don't hard-code "m" or "kW".
If the backend later switches to imperial for one user, the chart
labels follow automatically.

### Step 5 — Solve CORS once at the backend

The browser sees `localhost:5173` calling `localhost:8000` as cross-origin.
The backend must respond to OPTIONS preflight requests and include
`Access-Control-Allow-Origin` headers on the actual response. FastAPI's
`CORSMiddleware` handles both.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

You can verify it from a shell:

```bash
curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  http://localhost:8000/api/analysis/fit-curve
# → 200
```

If the preflight returns anything other than 2xx, the browser will not
send the POST, and your fetch logs show a generic `TypeError: Failed
to fetch` — which is misleading. Always verify preflight first.

## Pitfalls

- **`http://` vs `https://` mixed content.** If you ever deploy the
  frontend over HTTPS and call an HTTP backend, the browser silently
  drops the request. In dev both are HTTP and you'd never notice until
  the staging deploy breaks.
- **Storing form values as numbers.** React form `value=` should stay
  string; converting too early breaks empty-field handling. Convert at
  the boundary, in `buildFitCurveRequest`, not in the `onChange`.
- **No error UI.** A 500 with no banner is invisible to the user. Every
  `catch` in the call site must produce something on screen.
- **Hard-coded `API_BASE`.** Fine for Sprint 0. Sprint 2 needs an env
  var or runtime config — the desktop shell will use a different base
  (often `http://localhost:<random-port>` chosen at startup).
- **Re-rendering the chart on every keystroke.** If you put
  `<BackendCurveCard/>` inside the form and pass the whole form state
  down, every keystroke re-renders the chart's SVG. Memoise or move
  the heavy children outside the hot state path.
- **Trusting backend units.** The backend tells you what unit the
  magnitude is in (`result.units.head`); the frontend must use that
  string in its labels. Don't assume "m" forever — the backend is one
  PR away from emitting feet.
