// screen-mrt.jsx — Mechanical Running Test (vibration, bearing temp, noise, seal)

// API 610 12th ed. vibration limits (illustrative)
// Vibration: rigid-mounted, > 3600 rpm, overall unfiltered: 3.0 mm/s rms warn; 4.5 fail
const MRT_LIMITS = {
  vibration: { ok: 2.5, warn: 3.0, max: 5.0, unit: "mm/s rms" },
  bearing: { ok: 82, warn: 93, max: 110, unit: "°C" },
  noise: { ok: 80, warn: 85, max: 95, unit: "dB(A)" },
  seal: { ok: 5, warn: 15, max: 30, unit: "ml/h" },
};

function verdictGauge(v, lim) {
  if (v <= lim.ok) return "pass";
  if (v <= lim.warn) return "warn";
  return "fail";
}

function GaugeBar({ value, lim }) {
  const max = lim.max;
  const okPct = (lim.ok / max) * 100;
  const warnPct = (lim.warn / max) * 100;
  const pos = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div>
      <div className="mrt-bar">
        <div className="zone ok"   style={{left: "0%", width: okPct + "%"}}/>
        <div className="zone warn" style={{left: okPct + "%", width: (warnPct - okPct) + "%"}}/>
        <div className="zone fail" style={{left: warnPct + "%", width: (100 - warnPct) + "%"}}/>
        <div className="needle" style={{left: `calc(${pos}% - 1px)`}}/>
      </div>
      <div className="mrt-scale">
        <span>0</span>
        <span style={{position:"absolute", left: `calc(${okPct}% - 8px)`, marginTop: 2}}>{lim.ok}</span>
        <span style={{position:"absolute", left: `calc(${warnPct}% - 8px)`, marginTop: 2}}>{lim.warn}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function MrtCard({ title, sub, value, setValue, lim, t, icon }) {
  const v = parseFloat(value) || 0;
  const verdict = verdictGauge(v, lim);
  return (
    <div className="mrt-card">
      <div className="mrt-head">
        <div className="row" style={{gap: 8}}>
          <span style={{color:"var(--accent)"}}><Icon name={icon} size={16}/></span>
          <div>
            <div className="card-title">{title}</div>
            <div className="card-sub">{sub}</div>
          </div>
        </div>
        <span className={"badge " + verdict}><span className="bdot"/> {t[verdict === "pass" ? "pass" : verdict === "warn" ? "warn" : "fail"]}</span>
      </div>
      <div className="row" style={{justifyContent:"space-between", alignItems:"flex-end"}}>
        <div className="mrt-num">
          {v.toFixed(2)}
          <span className="unit">{lim.unit}</span>
        </div>
        <div style={{width: 160}}>
          <input className="input" type="number" step="any" value={value} onChange={e => setValue(e.target.value)} placeholder="—"/>
        </div>
      </div>
      <GaugeBar value={v} lim={lim}/>
      <div className="row" style={{justifyContent:"space-between", color:"var(--ink-3)", fontFamily:"var(--font-mono)", fontSize:10.5, marginTop:2}}>
        <span>OK ≤ {lim.ok} · WARN ≤ {lim.warn} · FAIL &gt; {lim.warn}</span>
        <span>API 610 12ª</span>
      </div>
    </div>
  );
}

function ScreenMRT({ t, mrt, setMrt }) {
  const [run, setRun] = React.useState("nde"); // nde or de
  const cur = mrt[run];
  const upd = (k, v) => setMrt(m => ({ ...m, [run]: { ...m[run], [k]: v } }));

  const tests = [
    { k: "vib", title: t.vib, sub: "Overall, unfiltered", icon: "wave", lim: MRT_LIMITS.vibration },
    { k: "bear", title: t.bear, sub: run === "nde" ? t.nde : t.de, icon: "therm", lim: MRT_LIMITS.bearing },
    { k: "noise", title: t.noise, sub: "1 m from pump skid", icon: "speaker", lim: MRT_LIMITS.noise },
    { k: "seal", title: t.seal, sub: "Mechanical seal drip", icon: "drop", lim: MRT_LIMITS.seal },
  ];

  // overall verdict
  const verdicts = tests.map(test => verdictGauge(parseFloat(cur[test.k]) || 0, test.lim));
  const overall = verdicts.includes("fail") ? "fail" : verdicts.includes("warn") ? "warn" : "pass";

  // Time series (4 hour run, sample data)
  const series = generateMrtSeries(cur);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.mrt}</h1>
          <div className="page-sub">4-hour continuous run · {run === "nde" ? t.nde : t.de}</div>
        </div>
        <div className="page-actions">
          <div className="subtabs">
            <button aria-pressed={run === "nde"} onClick={() => setRun("nde")}>{t.nde}</button>
            <button aria-pressed={run === "de"} onClick={() => setRun("de")}>{t.de}</button>
          </div>
          <span className={"badge " + overall}><span className="bdot"/> {t[overall === "pass" ? "pass" : overall === "warn" ? "warn" : "fail"]}</span>
        </div>
      </div>

      <div className="mrt-grid">
        {tests.map(test => (
          <MrtCard
            key={test.k}
            title={test.title}
            sub={test.sub}
            value={cur[test.k]}
            setValue={v => upd(test.k, v)}
            lim={test.lim}
            t={t}
            icon={test.icon}
          />
        ))}
      </div>

      {/* Time chart */}
      <div className="chart-card" style={{marginTop: 14}}>
        <div className="card-h">
          <div>
            <div className="card-title">Continuous monitoring · 4 h</div>
            <div className="card-sub">Vibration, bearing temp & noise during the running test</div>
          </div>
          <div className="row">
            <Legend swatch="line" color="var(--accent)" label={t.vib}/>
            <Legend swatch="line" color="#b45309" label={t.bear}/>
            <Legend swatch="line" color="#0f766e" label={t.noise}/>
          </div>
        </div>
        <div className="chart-canvas">
          <MultiChart series={series}/>
        </div>
      </div>

      {/* Checklist */}
      <div className="card" style={{marginTop: 14}}>
        <div className="card-h">
          <div className="card-title">API 610 — required pass/fail criteria</div>
        </div>
        <div className="card-body">
          <div className="grid c2" style={{gap: 8}}>
            {[
              ["Vibration overall ≤ 3.0 mm/s rms (rigid mount, >3600 rpm)", verdicts[0]],
              ["Bearing housing temp rise ≤ 50°C over ambient", verdicts[1]],
              ["Sound pressure ≤ 85 dB(A) at 1 m", verdicts[2]],
              ["Mech. seal leakage ≤ 15 ml/h", verdicts[3]],
              ["No measurable shaft displacement", overall],
              ["No external leakage from joints / casing", "pass"],
            ].map((row, i) => (
              <div key={i} className="row" style={{padding:"8px 10px", border:"1px solid var(--line-soft)", borderRadius:"var(--radius)", background:"var(--bg-canvas)"}}>
                <span className={"badge " + row[1]}><span className="bdot"/> {t[row[1] === "pass" ? "pass" : row[1] === "warn" ? "warn" : "fail"]}</span>
                <span style={{fontSize:12, color:"var(--ink-2)"}}>{row[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate a 4h time series proportional to current measured values
function generateMrtSeries(cur) {
  const N = 80;
  const vib = []; const bear = []; const noise = [];
  const vV = parseFloat(cur.vib) || 0;
  const bV = parseFloat(cur.bear) || 0;
  const nV = parseFloat(cur.noise) || 0;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const ramp = Math.min(1, t * 6);
    const drift = 1 + 0.06 * Math.sin(t * 9) + 0.03 * Math.cos(t * 21);
    const noiseFactor = 1 + (Math.sin(i * 13) * Math.cos(i * 7)) * 0.04;
    vib.push({ t, v: vV * ramp * drift * noiseFactor });
    bear.push({ t, v: 25 + (bV - 25) * Math.min(1, t * 2.2) * (1 + 0.01 * Math.sin(t * 11)) });
    noise.push({ t, v: nV * ramp * (1 + 0.015 * Math.cos(t * 17)) });
  }
  return { vib, bear, noise };
}

function MultiChart({ series }) {
  const w = 1100, h = 220;
  const padL = 50, padR = 12, padT = 12, padB = 28;
  const pw = w - padL - padR; const ph = h - padT - padB;

  // Independent y-axes scaled to series max
  const seriesList = [
    { key: "vib", color: "var(--accent)", data: series.vib, max: Math.max(5, Math.max(...series.vib.map(p => p.v)) * 1.2) },
    { key: "bear", color: "#b45309", data: series.bear, max: 120 },
    { key: "noise", color: "#0f766e", data: series.noise, max: 100 },
  ];

  const x2p = t => padL + t * pw;
  const buildPath = (data, max) => {
    return data.map((p, i) => {
      const y = padT + ph - (p.v / max) * ph;
      return (i === 0 ? "M" : "L") + x2p(p.t).toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
  };

  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`}>
      <g className="grid">
        {[0, .25, .5, .75, 1].map(t => (
          <line key={t} x1={x2p(t)} x2={x2p(t)} y1={padT} y2={padT + ph}/>
        ))}
        {[0, .25, .5, .75, 1].map(t => (
          <line key={"h"+t} x1={padL} x2={w - padR} y1={padT + ph * t} y2={padT + ph * t}/>
        ))}
      </g>
      <g className="axis">
        <line x1={padL} x2={w - padR} y1={padT + ph} y2={padT + ph}/>
        <line x1={padL} x2={padL} y1={padT} y2={padT + ph}/>
        {[0, 1, 2, 3, 4].map(h => (
          <text key={h} x={x2p(h / 4)} y={padT + ph + 16} textAnchor="middle">{h}h</text>
        ))}
      </g>
      {seriesList.map(s => (
        <path key={s.key} d={buildPath(s.data, s.max)} fill="none" stroke={s.color} strokeWidth="1.7"/>
      ))}
    </svg>
  );
}

Object.assign(window, { ScreenMRT, MRT_LIMITS });
