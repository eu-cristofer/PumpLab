// screen-results.jsx — KPIs, hero charts, tolerance table

import React from "react";
import { Icon, STANDARDS, TOLERANCES, fmtBand } from "../components/app-shell.jsx";
import { LineChart, polyFit, polyEval, buildCurves } from "../components/charts.jsx";

function verdictForDev(dev, band) {
  if (dev >= band[0] && dev <= band[1]) return "pass";
  const margin = Math.max(Math.abs(band[0]), Math.abs(band[1])) * 0.25 || 1;
  if (dev >= band[0] - margin && dev <= band[1] + margin) return "warn";
  return "fail";
}

function pct(v, ref) {
  if (!ref) return 0;
  return ((v - ref) / ref) * 100;
}

function ScreenResults({ t, state, unit, onExportReport }) {
  const { rated, points, std, lastCalcAt } = state;
  const [series, setSeries] = React.useState(null);
  const [tab, setTab] = React.useState("head");

  React.useEffect(() => {
    if (!lastCalcAt) { setSeries(null); return; }
    const data = buildCurves(points, rated, unit);
    if (data.length < 3) { setSeries({ empty: true }); return; }
    const qs = data.map(d => d.q);
    const Hcoef = polyFit(qs, data.map(d => d.h), 2);
    const Pcoef = polyFit(qs, data.map(d => d.P), 2);
    const Ecoef = polyFit(qs, data.map(d => d.eta), 2);
    const qN = parseFloat(rated.qNom);
    const predicted = {
      H: polyEval(Hcoef, qN),
      P: polyEval(Pcoef, qN),
      eta: polyEval(Ecoef, qN),
    };
    const qMin = Math.min(...qs), qMax = Math.max(...qs);
    let bepQ = qN, bepEta = predicted.eta;
    for (let i = 0; i <= 200; i++) {
      const q = qMin + (qMax - qMin) * i / 200;
      const e = polyEval(Ecoef, q);
      if (e > bepEta) { bepEta = e; bepQ = q; }
    }
    const bep = { q: bepQ, eta: bepEta, h: polyEval(Hcoef, bepQ), p: polyEval(Pcoef, bepQ) };

    setSeries({ data, Hcoef, Pcoef, Ecoef, predicted, bep });
  }, [lastCalcAt, unit]);

  if (!lastCalcAt) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t.results}</h1>
            <div className="page-sub">{t.notRun}</div>
          </div>
        </div>
        <div className="card" style={{padding: 64, textAlign: "center"}}>
          <div style={{color: "var(--ink-3)", fontSize: 14, marginBottom: 12}}>{t.runCalc}</div>
          <button className="btn primary" onClick={() => state.onCalc()}><Icon name="play"/> {t.calculate}</button>
        </div>
      </div>
    );
  }

  if (!series || series.empty) {
    return (
      <div className="page">
        <h1 className="page-title">{t.results}</h1>
        <div className="banner" style={{background: "var(--warn-soft)", borderColor: "var(--warn)"}}>
          <span className="bicon"><Icon name="warn" size={16}/></span>
          Not enough valid test points. Need at least 3 points with flow, pressures and power.
        </div>
      </div>
    );
  }

  const { data, Hcoef, Pcoef, Ecoef, predicted, bep } = series;
  const tol = TOLERANCES[std];

  const qN = parseFloat(rated.qNom);
  const hN = parseFloat(rated.hNom);
  const pN = parseFloat(rated.pNom);

  const devH = pct(predicted.H, hN);
  const devP = pct(predicted.P, pN);
  const devQ = 0;

  const rows = [
    { key: "q",   label: t.fields.qNom, nom: qN, pred: qN, dev: devQ, band: tol.q, unit: t.units.flow },
    { key: "h",   label: t.fields.hNom, nom: hN, pred: predicted.H, dev: devH, band: tol.h, unit: t.units.head },
    { key: "p",   label: t.fields.pNom, nom: pN, pred: predicted.P, dev: devP, band: tol.p, unit: t.units.power },
    { key: "eta", label: t.chart.eta,    nom: null, pred: predicted.eta, dev: 0, band: tol.eta, unit: "%" },
  ];

  const verdicts = rows.map(r => verdictForDev(r.dev, r.band));
  const overall = verdicts.includes("fail") ? "fail" : verdicts.includes("warn") ? "warn" : "pass";

  const headPoints = data.map(d => ({ x: d.q, y: d.h, out: false }));
  const powerPoints = data.map(d => ({ x: d.q, y: d.P, out: false }));
  const effPoints = data.map(d => ({ x: d.q, y: d.eta, out: false }));

  const chartTabs = [
    { id: "head", label: t.chart.head, value: predicted.H.toFixed(2) + " m" },
    { id: "power", label: t.chart.power, value: predicted.P.toFixed(2) + " kW" },
    { id: "eff", label: t.chart.eff, value: predicted.eta.toFixed(1) + " %" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.results}</h1>
          <div className="page-sub">{rated.tag || "—"} · {t.predicted.toLowerCase()} @ Q={qN} m³/h · {STANDARDS.find(s=>s.id===std).short}</div>
        </div>
        <div className="page-actions">
          <span className={"badge " + overall}><span className="bdot"/> {t[overall === "pass" ? "pass" : overall === "warn" ? "warn" : "fail"]}</span>
          <button className="btn" onClick={() => state.onRecalc()}><Icon name="calc"/> Recalc</button>
          <button className="btn primary" onClick={onExportReport}><Icon name="export"/> {t.export}</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <Kpi label={t.fields.hNom} value={predicted.H.toFixed(2)} unit="m" refVal={hN} dev={devH} verdict={verdicts[1]}/>
        <Kpi label={t.fields.pNom} value={predicted.P.toFixed(2)} unit="kW" refVal={pN} dev={devP} verdict={verdicts[2]}/>
        <Kpi label={t.chart.eta} value={predicted.eta.toFixed(1)} unit="%" verdict={verdicts[3]}/>
        <Kpi label={t.bep} value={bep.q.toFixed(1)} unit="m³/h" hint={`η ${bep.eta.toFixed(1)}%`}/>
      </div>

      <div className="results-grid">
        {/* Chart */}
        <div className="chart-card">
          <div className="chart-tabs">
            {chartTabs.map(ct => (
              <button key={ct.id} className={"chart-tab" + (tab === ct.id ? " active" : "")} onClick={() => setTab(ct.id)}>
                {ct.label}
                <span className="v">{ct.value}</span>
              </button>
            ))}
          </div>
          <div className="chart-canvas">
            {tab === "head" && (
              <LineChart
                title={t.chart.head} xLabel={t.chart.flow + " [m³/h]"} yLabel={t.chart.h} unitY="m"
                points={headPoints} fit={Hcoef}
                nameplate={{ x: qN, y: hN, label: `${t.nameplate}: ${hN} m @ ${qN} m³/h` }}
                tol={tol.h}
              />
            )}
            {tab === "power" && (
              <LineChart
                title={t.chart.power} xLabel={t.chart.flow + " [m³/h]"} yLabel={t.chart.p} unitY="kW"
                points={powerPoints} fit={Pcoef}
                nameplate={{ x: qN, y: pN, label: `${t.nameplate}: ${pN} kW` }}
                tol={tol.p}
              />
            )}
            {tab === "eff" && (
              <LineChart
                title={t.chart.eff} xLabel={t.chart.flow + " [m³/h]"} yLabel={t.chart.eta} unitY="%"
                points={effPoints} fit={Ecoef}
                nameplate={null}
              />
            )}
          </div>
          <div style={{padding: "10px 14px", borderTop: "1px solid var(--line-soft)", display:"flex", gap:18, fontSize:11, color:"var(--ink-3)", fontFamily:"var(--font-mono)"}}>
            <Legend swatch="line" color="var(--accent)" label={t.legend.fit}/>
            <Legend swatch="dot" color="var(--accent)" label={t.legend.pts}/>
            <Legend swatch="dash" color="var(--ink-3)" label={t.legend.nameplate}/>
            <Legend swatch="band" color="var(--accent)" label={t.legend.band}/>
          </div>
        </div>

        {/* Tolerance side */}
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">{t.tolerance} — {STANDARDS.find(s=>s.id===std).short}</div>
              <div className="card-sub">{t.predicted} vs {t.nameplate.toLowerCase()} @ Q={qN} m³/h</div>
            </div>
            <span className={"badge " + overall}><span className="bdot"/> {t[overall === "pass" ? "pass" : overall === "warn" ? "warn" : "fail"]}</span>
          </div>
          <table className="tol-tbl">
            <thead>
              <tr>
                <th>{/* metric */}</th>
                <th style={{textAlign:"right"}}>{t.nameplate}</th>
                <th style={{textAlign:"right"}}>{t.predicted}</th>
                <th style={{textAlign:"right"}}>Δ%</th>
                <th style={{textAlign:"right"}}>{t.tolerance}</th>
                <th style={{textAlign:"center"}}>{t.verdict}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key}>
                  <td>
                    <div>{r.label}</div>
                    <div style={{fontSize:10.5, color:"var(--ink-4)", fontFamily:"var(--font-mono)"}}>{r.unit}</div>
                  </td>
                  <td className="num">{r.nom == null ? "—" : r.nom.toFixed(r.key === "p" ? 2 : 2)}</td>
                  <td className="num">{r.pred.toFixed(r.key === "eta" ? 1 : 2)}</td>
                  <td className="num" style={{color: Math.abs(r.dev) > 1 ? (r.dev > 0 ? "var(--pass)" : "var(--fail)") : "var(--ink-3)"}}>
                    {r.nom == null ? "—" : (r.dev >= 0 ? "+" : "") + r.dev.toFixed(2)}
                  </td>
                  <td className="num" style={{color:"var(--ink-3)"}}>{fmtBand(r.band)}</td>
                  <td style={{textAlign:"center"}}>
                    <span className={"badge " + verdicts[i]}><span className="bdot"/> {t[verdicts[i] === "pass" ? "pass" : verdicts[i] === "warn" ? "warn" : "fail"]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-body dense" style={{display:"flex", gap:8, flexWrap:"wrap", borderTop:"1px solid var(--line-soft)"}}>
            <span className="pill">{t.bep}: Q {bep.q.toFixed(1)} m³/h</span>
            <span className="pill">η_max {bep.eta.toFixed(1)}%</span>
            <span className="pill">H@BEP {bep.h.toFixed(1)} m</span>
            <span className="pill">P@BEP {bep.p.toFixed(1)} kW</span>
            <span className="pill">{data.length} pts</span>
          </div>
        </div>
      </div>

      {/* All points table */}
      <div className="card" style={{marginTop: 14}}>
        <div className="card-h">
          <div className="card-title">{t.testPoints} · {t.measured}</div>
          <span className="pill">{data.length} pts</span>
        </div>
        <table className="tol-tbl">
          <thead>
            <tr>
              <th>#</th>
              <th style={{textAlign:"right"}}>{t.fields.q} [m³/h]</th>
              <th style={{textAlign:"right"}}>H [m]</th>
              <th style={{textAlign:"right"}}>P [kW]</th>
              <th style={{textAlign:"right"}}>η [%]</th>
              <th style={{textAlign:"right"}}>H fit [m]</th>
              <th style={{textAlign:"right"}}>Δ% (H)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => {
              const hFit = polyEval(Hcoef, d.q);
              const dev = pct(d.h, hFit);
              return (
                <tr key={i}>
                  <td>{String(i + 1).padStart(2, "0")}</td>
                  <td className="num">{d.q.toFixed(2)}</td>
                  <td className="num">{d.h.toFixed(2)}</td>
                  <td className="num">{d.P.toFixed(2)}</td>
                  <td className="num">{d.eta.toFixed(1)}</td>
                  <td className="num" style={{color:"var(--ink-3)"}}>{hFit.toFixed(2)}</td>
                  <td className="num" style={{color: Math.abs(dev) > 3 ? "var(--warn)" : "var(--ink-3)"}}>{(dev>=0?"+":"") + dev.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, unit, refVal, dev, verdict, hint }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}<span className="unit">{unit}</span></div>
      <div className="kpi-foot">
        {dev != null && refVal != null && (
          <span className={"delta " + (dev >= 0 ? "up" : "down")}>{dev >= 0 ? "▲" : "▼"} {Math.abs(dev).toFixed(2)}%</span>
        )}
        {refVal != null && <span>vs {refVal}</span>}
        {hint && <span>{hint}</span>}
        {verdict && <span className={"badge " + verdict} style={{marginLeft:"auto", height:18, padding:"0 6px", fontSize:9.5}}><span className="bdot"/>{verdict.toUpperCase()}</span>}
      </div>
    </div>
  );
}

function Legend({ swatch, color, label }) {
  let mark = null;
  if (swatch === "line") mark = <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="2"/></svg>;
  if (swatch === "dot") mark = <svg width="10" height="10"><circle cx="5" cy="5" r="3.5" fill={color}/></svg>;
  if (swatch === "dash") mark = <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="1.5" strokeDasharray="3 3"/></svg>;
  if (swatch === "band") mark = <svg width="20" height="10"><rect x="0" y="0" width="20" height="10" fill={`color-mix(in oklab, ${color}, transparent 80%)`}/></svg>;
  return (
    <span style={{display:"inline-flex", alignItems:"center", gap:6}}>
      {mark} {label}
    </span>
  );
}

export { ScreenResults, verdictForDev, Kpi, Legend };
