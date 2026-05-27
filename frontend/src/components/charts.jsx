// charts.jsx — SVG charts (Head/Power/Efficiency vs Flow)

import React from "react";

// Polynomial regression utility (configurable degree)
function polyFit(xs, ys, deg) {
  const n = xs.length;
  const m = deg + 1;
  const A = Array.from({ length: m }, () => Array(m).fill(0));
  const b = Array(m).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < m; k++) A[j][k] += Math.pow(xs[i], j + k);
      b[j] += ys[i] * Math.pow(xs[i], j);
    }
  }
  for (let i = 0; i < m; i++) {
    let maxR = i;
    for (let r = i + 1; r < m; r++) if (Math.abs(A[r][i]) > Math.abs(A[maxR][i])) maxR = r;
    [A[i], A[maxR]] = [A[maxR], A[i]];
    [b[i], b[maxR]] = [b[maxR], b[i]];
    for (let r = i + 1; r < m; r++) {
      const f = A[r][i] / (A[i][i] || 1e-12);
      for (let c = i; c < m; c++) A[r][c] -= f * A[i][c];
      b[r] -= f * b[i];
    }
  }
  const x = Array(m).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < m; j++) s -= A[i][j] * x[j];
    x[i] = s / (A[i][i] || 1e-12);
  }
  return x;
}

function polyEval(coefs, x) {
  let y = 0;
  for (let i = 0; i < coefs.length; i++) y += coefs[i] * Math.pow(x, i);
  return y;
}

function niceTicks(min, max, count = 5) {
  const span = max - min || 1;
  const rough = span / count;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  let step;
  if (norm < 1.5) step = 1 * pow;
  else if (norm < 3) step = 2 * pow;
  else if (norm < 7) step = 5 * pow;
  else step = 10 * pow;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = start; v <= end + 1e-9; v += step) ticks.push(+v.toFixed(8));
  return { ticks, min: start, max: end, step };
}

function fmtN(v) {
  if (v === 0) return "0";
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 100) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

function LineChart({ title, xLabel, yLabel, unitY, points, fit, nameplate, tol, w = 720, h = 320, color }) {
  const padL = 56, padR = 24, padT = 18, padB = 38;
  const pw = w - padL - padR;
  const ph = h - padT - padB;
  if (!points || points.length === 0) {
    return <div style={{padding: 40, textAlign: "center", color: "var(--ink-4)", fontFamily: "var(--font-mono)", fontSize: 12}}>No data yet</div>;
  }
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const fitYs = fit ? xs.map(x => polyEval(fit, x)).concat(ys) : ys;
  const allY = fitYs.concat(nameplate ? [nameplate.y] : []);
  const xT = niceTicks(0, Math.max(...xs) * 1.1, 5);
  const yMin = Math.max(0, Math.min(...allY) * 0.85);
  const yMax = Math.max(...allY) * 1.15;
  const yT = niceTicks(yMin, yMax, 5);

  const x2p = x => padL + (x - xT.min) / (xT.max - xT.min) * pw;
  const y2p = y => padT + ph - (y - yT.min) / (yT.max - yT.min) * ph;

  let fitPath = "";
  if (fit) {
    const N = 80;
    const x0 = xT.min, x1 = xT.max;
    for (let i = 0; i <= N; i++) {
      const x = x0 + (x1 - x0) * i / N;
      const y = polyEval(fit, x);
      fitPath += (i === 0 ? "M" : "L") + x2p(x).toFixed(1) + "," + y2p(y).toFixed(1) + " ";
    }
  }

  let bandPath = "";
  if (fit && tol && nameplate) {
    const N = 60;
    const x0 = xT.min, x1 = xT.max;
    const top = [];
    const bot = [];
    for (let i = 0; i <= N; i++) {
      const x = x0 + (x1 - x0) * i / N;
      const yC = polyEval(fit, x);
      top.push([x2p(x), y2p(yC * (1 + tol[1] / 100))]);
      bot.push([x2p(x), y2p(yC * (1 + tol[0] / 100))]);
    }
    bandPath = "M" + top.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L") +
               " L" + bot.reverse().map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L") + " Z";
  }

  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img">
      <text x={padL} y={14} style={{fontSize: 11, fill: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em"}}>{title}</text>
      {bandPath && <path d={bandPath} className="band"/>}
      <g className="grid">
        {yT.ticks.map(v => (
          <line key={"yg" + v} x1={padL} x2={w - padR} y1={y2p(v)} y2={y2p(v)}/>
        ))}
      </g>
      <g className="axis">
        <line x1={padL} x2={padL} y1={padT} y2={padT + ph}/>
        <line x1={padL} x2={w - padR} y1={padT + ph} y2={padT + ph}/>
        {xT.ticks.map(v => (
          <g key={"xt" + v}>
            <line x1={x2p(v)} x2={x2p(v)} y1={padT + ph} y2={padT + ph + 4}/>
            <text x={x2p(v)} y={padT + ph + 16} textAnchor="middle">{fmtN(v)}</text>
          </g>
        ))}
        {yT.ticks.map(v => (
          <g key={"yt" + v}>
            <line x1={padL - 4} x2={padL} y1={y2p(v)} y2={y2p(v)}/>
            <text x={padL - 8} y={y2p(v) + 3} textAnchor="end">{fmtN(v)}</text>
          </g>
        ))}
        <text x={padL + pw / 2} y={h - 8} textAnchor="middle" style={{fill: "var(--ink-3)"}}>{xLabel}</text>
        <text x={12} y={padT + ph / 2} textAnchor="middle" transform={`rotate(-90 12 ${padT + ph / 2})`} style={{fill: "var(--ink-3)"}}>{yLabel}{unitY ? " [" + unitY + "]" : ""}</text>
      </g>
      {nameplate && (
        <g>
          <line x1={x2p(nameplate.x)} x2={x2p(nameplate.x)} y1={padT} y2={padT + ph} className="nameplate"/>
          <line x1={padL} x2={w - padR} y1={y2p(nameplate.y)} y2={y2p(nameplate.y)} className="nameplate"/>
          <circle cx={x2p(nameplate.x)} cy={y2p(nameplate.y)} r="4" fill="none" stroke="var(--ink-2)" strokeWidth="1.5"/>
          <text x={x2p(nameplate.x) + 6} y={y2p(nameplate.y) - 6} style={{fill: "var(--ink-2)", fontSize: 10}}>{nameplate.label || "Nameplate"}</text>
        </g>
      )}
      {fit && <path d={fitPath} className="data fit" style={{stroke: color || "var(--accent)"}}/>}
      {points.map((p, i) => (
        <circle key={i} cx={x2p(p.x)} cy={y2p(p.y)} r="4" className={"pt" + (p.out ? " pt-out" : "")} style={{fill: p.out ? "var(--fail)" : (color || "var(--accent)")}}/>
      ))}
    </svg>
  );
}

// Pressure conversion constant (used in screen-setup + main App for unit toggle)
const KGF_TO_BAR = 0.980665;

function pToBar(v, unit) { return unit === "kgf" ? v * KGF_TO_BAR : v; }

// Head [m] from suction/discharge pressure (delta P) and SG.
function computeHead(pSuc, pDis, unit, sg) {
  if (pSuc === "" || pDis === "" || isNaN(+pSuc) || isNaN(+pDis)) return "";
  const dPbar = pToBar(+pDis, unit) - pToBar(+pSuc, unit);
  const rho = (sg || 1) * 1000;
  const H = (dPbar * 1e5) / (rho * 9.81);
  return H;
}

// Build all three series from points + rated
function buildCurves(points, rated, unit) {
  const sg = parseFloat(rated.sgNom) || 1;
  const data = points
    .map(p => {
      const q = parseFloat(p.q);
      const h = computeHead(p.pSuc, p.pDis, unit, sg);
      const P = parseFloat(p.power);
      if (isNaN(q) || h === "" || isNaN(P) || q <= 0) return null;
      const Phyd = (q / 3600) * (sg * 1000) * 9.81 * h / 1000; // kW
      const eta = P > 0 ? (Phyd / P) * 100 : 0;
      return { q, h, P, eta };
    })
    .filter(Boolean)
    .sort((a, b) => a.q - b.q);
  return data;
}

export { LineChart, polyFit, polyEval, buildCurves, fmtN, computeHead, KGF_TO_BAR };
