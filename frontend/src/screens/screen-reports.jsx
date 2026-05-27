// screen-reports.jsx — Reports screen + Export modal

import React from "react";
import { Icon, STANDARDS } from "../components/app-shell.jsx";

function ScreenReports({ t, state, project, onExport }) {
  const { rated, points, std, lastCalcAt } = state;
  const fmtDate = (ts) => ts ? new Date(ts).toLocaleString() : "—";

  const summary = [
    { k: t.fields.tag, v: rated.tag || "—" },
    { k: t.project, v: project.name || "—" },
    { k: t.operator, v: project.operator || "—" },
    { k: t.siteRef, v: project.site || "—" },
    { k: t.standard, v: STANDARDS.find(s => s.id === std)?.short },
    { k: "Last calc", v: fmtDate(lastCalcAt) },
    { k: "Points", v: points.length },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.reports}</h1>
          <div className="page-sub">Export the full test bundle in the format of your choice</div>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={() => onExport("html")}><Icon name="doc"/> HTML</button>
          <button className="btn" onClick={() => onExport("docx")}><Icon name="doc"/> .doc</button>
          <button className="btn" onClick={() => onExport("json")}><Icon name="export"/> JSON</button>
        </div>
      </div>

      <div className="grid c3" style={{alignItems:"stretch"}}>
        {[
          { id: "html", title: "Printable HTML report", sub: "Full report with charts, tolerance tables and MRT criteria. Ready for print → PDF.", icon: "doc", ext: ".html" },
          { id: "docx", title: "Word document", sub: "Editable .doc file for engineering documentation systems and signatures.", icon: "doc", ext: ".doc" },
          { id: "json", title: "Raw JSON bundle", sub: "Inputs, computed series and verdicts — ready to round-trip back into the app.", icon: "export", ext: ".json" },
        ].map(card => (
          <div key={card.id} className="card" style={{display:"flex", flexDirection:"column"}}>
            <div className="card-body" style={{flex:1, display:"flex", flexDirection:"column", gap:10}}>
              <div className="row" style={{justifyContent:"space-between"}}>
                <span style={{color:"var(--accent)"}}><Icon name={card.icon} size={20}/></span>
                <span className="pill">{card.ext}</span>
              </div>
              <div style={{fontSize:14, fontWeight:600, letterSpacing:"-.01em"}}>{card.title}</div>
              <div style={{color:"var(--ink-3)", fontSize:12, flex:1}}>{card.sub}</div>
              <button className="btn primary sm" onClick={() => onExport(card.id)}><Icon name="export"/> {t.download}</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginTop: 14}}>
        <div className="card-h">
          <div className="card-title">Bundle preview</div>
          <span className="pill">{lastCalcAt ? "calc done" : "not run"}</span>
        </div>
        <div className="card-body">
          <div className="grid c4">
            {summary.map((s, i) => (
              <div key={i} style={{display:"flex", flexDirection:"column", gap:2, padding:"8px 10px", border:"1px solid var(--line-soft)", borderRadius:"var(--radius)", background:"var(--bg-canvas)"}}>
                <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:".08em", color:"var(--ink-3)"}}>{s.k}</div>
                <div className="num" style={{fontSize:13, color:"var(--ink)"}}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportModal({ t, onClose, onConfirm }) {
  const [fmt, setFmt] = React.useState("html");
  const [scope, setScope] = React.useState({ inputs: true, charts: true, mrt: true, tolerance: true });
  const toggle = k => setScope(s => ({ ...s, [k]: !s[k] }));

  return (
    <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-h">
          <div>
            <div className="modal-title">{t.saveTitle}</div>
            <div className="muted" style={{fontSize:11.5}}>{t.saveSub}</div>
          </div>
          <button className="btn ghost icon" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body">
          <div className="card-title" style={{marginBottom: 8}}>Format</div>
          <div className="col" style={{gap: 6}}>
            {[
              { id: "html", label: t.formats.html, hint: "→ open in browser, save as PDF" },
              { id: "docx", label: t.formats.docx, hint: "→ editable in Word / LibreOffice" },
              { id: "json", label: t.formats.json, hint: "→ machine-readable bundle" },
            ].map(o => (
              <label key={o.id} className="check radio" style={{padding:"10px 12px", border:"1px solid var(--line)", borderRadius:"var(--radius)", background: fmt === o.id ? "var(--accent-soft)" : "transparent", borderColor: fmt === o.id ? "var(--accent)" : "var(--line)"}}>
                <input type="radio" checked={fmt === o.id} onChange={() => setFmt(o.id)}/>
                <span style={{flex:1}}>
                  <div style={{fontSize: 13, color: "var(--ink)"}}>{o.label}</div>
                  <div className="muted" style={{fontSize:11}}>{o.hint}</div>
                </span>
              </label>
            ))}
          </div>

          <div className="card-title" style={{marginTop: 14, marginBottom: 8}}>Include sections</div>
          <div className="grid c2" style={{gap: 6}}>
            {[
              ["inputs", "Inputs & nameplate"],
              ["charts", "Performance curves"],
              ["tolerance", "Tolerance verdicts"],
              ["mrt", "Mechanical running results"],
            ].map(([k, label]) => (
              <label key={k} className="check" style={{padding:"8px 10px", border:"1px solid var(--line-soft)", borderRadius:"var(--radius)"}}>
                <input type="checkbox" checked={scope[k]} onChange={() => toggle(k)}/>
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>{t.cancel}</button>
          <button className="btn primary" onClick={() => onConfirm(fmt, scope)}><Icon name="export"/> {t.download}</button>
        </div>
      </div>
    </div>
  );
}

export { ScreenReports, ExportModal };
