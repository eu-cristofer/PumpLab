// screen-setup.jsx — Rated point + test points table

// Convert pressure between kgf/cm² <-> bar
const KGF_TO_BAR = 0.980665;

function pToBar(v, unit) { return unit === "kgf" ? v * KGF_TO_BAR : v; }

// Head [m] from suction/discharge pressure (delta P) and SG. Simplified:
// H ≈ (Pd - Ps)*1e5 / (rho * g) where rho = SG*1000 kg/m³, g = 9.81
function computeHead(pSuc, pDis, unit, sg) {
  if (pSuc === "" || pDis === "" || isNaN(+pSuc) || isNaN(+pDis)) return "";
  const dPbar = pToBar(+pDis, unit) - pToBar(+pSuc, unit);
  const rho = (sg || 1) * 1000;
  const H = (dPbar * 1e5) / (rho * 9.81);
  return H;
}

function NumField({ label, unit, value, onChange, placeholder, required, readonly, text }) {
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        {unit && <span className="unit">[{unit}]</span>}
        {required && <span className="req">*</span>}
      </div>
      <input
        className={"input" + (text ? " text" : "")}
        type={text ? "text" : "number"}
        value={value}
        readOnly={readonly}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        step="any"
      />
    </div>
  );
}

function ScreenSetup({ t, state, set, unit, project, setProject }) {
  const { rated, points } = state;

  const setRated = (k, v) => set(s => ({ ...s, rated: { ...s.rated, [k]: v }, dirty: true }));
  const setPoint = (i, k, v) => set(s => {
    const p = [...s.points];
    p[i] = { ...p[i], [k]: v };
    return { ...s, points: p, dirty: true };
  });
  const addPoint = () => set(s => ({ ...s, points: [...s.points, { q: "", pSuc: "", pDis: "", tW: "", power: "", n: "" }], dirty: true }));
  const removeLast = () => set(s => ({ ...s, points: s.points.length > 1 ? s.points.slice(0, -1) : s.points, dirty: true }));
  const removeAt = (i) => set(s => ({ ...s, points: s.points.filter((_, idx) => idx !== i), dirty: true }));

  const pUnitShort = unit === "kgf" ? "kgf/cm²" : "bar";
  const sg = parseFloat(rated.sgNom) || 1;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.setup}</h1>
          <div className="page-sub">{rated.tag ? `TAG ${rated.tag}` : "—"} · {t.testPoints.toLowerCase()}: {points.length}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => state.onLoadSample()}><Icon name="import"/> {t.import}</button>
          <button className="btn" onClick={() => state.onExportData()}><Icon name="export"/> {t.export}</button>
          <button className="btn primary" onClick={() => state.onCalc()}><Icon name="play"/> {t.calculate}</button>
        </div>
      </div>

      <div className="banner">
        <span className="bicon"><Icon name="info" size={16}/></span>
        <div>
          <strong>{t.standardsBar}:</strong> Q {fmtBand(TOLERANCES[state.std].q)} · H {fmtBand(TOLERANCES[state.std].h)} · η {fmtBand(TOLERANCES[state.std].eta)} · P {fmtBand(TOLERANCES[state.std].p)}
        </div>
        <div className="spacer"/>
        <span className="pill">{state.std.toUpperCase()}</span>
      </div>

      <BackendCurveCard state={state} unit={unit}/>

      {/* Project meta */}
      <div className="card" style={{marginBottom: 14}}>
        <div className="card-h">
          <div>
            <div className="card-title">{t.project}</div>
          </div>
        </div>
        <div className="card-body">
          <div className="grid c4">
            <NumField text label={t.project} value={project.name} onChange={v => setProject(p => ({...p, name: v}))} />
            <NumField text label={t.operator} value={project.operator} onChange={v => setProject(p => ({...p, operator: v}))} />
            <NumField text label={t.siteRef} value={project.site} onChange={v => setProject(p => ({...p, site: v}))} />
            <div className="field">
              <div className="field-label"><span>{t.notes}</span></div>
              <input className="input text" value={project.notes} onChange={e => setProject(p => ({...p, notes: e.target.value}))}/>
            </div>
          </div>
        </div>
      </div>

      {/* Rated point */}
      <div className="card" style={{marginBottom: 14}}>
        <div className="card-h">
          <div>
            <div className="card-title">{t.ratedPoint}</div>
            <div className="card-sub">{t.ratedPointSub}</div>
          </div>
          <div className="row">
            <span className="pill"><Icon name="info" size={11}/> {t.fields.tag} *</span>
          </div>
        </div>
        <div className="card-body">
          <div className="grid c4">
            <NumField text required label={t.fields.tag} value={rated.tag} onChange={v => setRated("tag", v)} placeholder="P-101A"/>
            <NumField required label={t.fields.qNom} unit={t.units.flow} value={rated.qNom} onChange={v => setRated("qNom", v)} placeholder="120"/>
            <NumField required label={t.fields.hNom} unit={t.units.head} value={rated.hNom} onChange={v => setRated("hNom", v)} placeholder="85"/>
            <NumField required label={t.fields.nNom} unit={t.units.rpm} value={rated.nNom} onChange={v => setRated("nNom", v)} placeholder="3550"/>
            <NumField required label={t.fields.pNom} unit={t.units.power} value={rated.pNom} onChange={v => setRated("pNom", v)} placeholder="42"/>
            <NumField required label={t.fields.sgNom} unit={t.units.sg} value={rated.sgNom} onChange={v => setRated("sgNom", v)} placeholder="1.000"/>
            <NumField label={t.fields.muNom} unit={t.units.visc} value={rated.muNom} onChange={v => setRated("muNom", v)} placeholder="1.0"/>
            <NumField label={t.fields.hShut} unit={t.units.head} value={rated.hShut} onChange={v => setRated("hShut", v)} placeholder="102"/>
          </div>
        </div>
      </div>

      {/* Points table */}
      <div className="tbl-wrap">
        <div className="tbl-head">
          <div>
            <div className="card-title">{t.testPoints}</div>
            <div className="card-sub">{t.testPointsSub}</div>
          </div>
          <div className="row">
            <span className="pill">{points.length} pts</span>
            <span className="pill">P: {pUnitShort}</span>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th className="cell-idx">#</th>
              <th>{t.fields.q}<span className="u">{t.units.flow}</span></th>
              <th>{t.fields.pSuc}<span className="u">{pUnitShort}</span></th>
              <th>{t.fields.pDis}<span className="u">{pUnitShort}</span></th>
              <th>{t.fields.tW}<span className="u">{t.units.temp}</span></th>
              <th>{t.fields.hCalc}<span className="u">{t.units.head}</span></th>
              <th>{t.fields.power}<span className="u">{t.units.power}</span></th>
              <th>{t.fields.n}<span className="u">{t.units.rpm}</span></th>
              <th className="cell-act"></th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => {
              const h = computeHead(p.pSuc, p.pDis, unit, sg);
              return (
                <tr key={i}>
                  <td className="cell-idx">{String(i + 1).padStart(2, "0")}</td>
                  <td><input className="cell-num" type="number" step="any" value={p.q} onChange={e => setPoint(i, "q", e.target.value)} placeholder="—"/></td>
                  <td><input className="cell-num" type="number" step="any" value={p.pSuc} onChange={e => setPoint(i, "pSuc", e.target.value)} placeholder="—"/></td>
                  <td><input className="cell-num" type="number" step="any" value={p.pDis} onChange={e => setPoint(i, "pDis", e.target.value)} placeholder="—"/></td>
                  <td><input className="cell-num" type="number" step="any" value={p.tW} onChange={e => setPoint(i, "tW", e.target.value)} placeholder="—"/></td>
                  <td><input className="cell-num ro" readOnly value={h === "" ? "" : h.toFixed(2)}/></td>
                  <td><input className="cell-num" type="number" step="any" value={p.power} onChange={e => setPoint(i, "power", e.target.value)} placeholder="—"/></td>
                  <td><input className="cell-num" type="number" step="any" value={p.n} onChange={e => setPoint(i, "n", e.target.value)} placeholder="—"/></td>
                  <td className="cell-act">
                    <button className="row-rm" onClick={() => removeAt(i)} title="Remove"><Icon name="x" size={12}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="tbl-foot">
          <div className="row">
            <button className="btn sm" onClick={addPoint}><Icon name="plus"/> {t.addRow}</button>
            <button className="btn sm" onClick={removeLast}><Icon name="minus"/> {t.removeLast}</button>
          </div>
          <div className="row dim" style={{fontFamily:"var(--font-mono)", fontSize:11}}>
            <span>{t.fields.hCalc} = ΔP × 10⁵ / (ρ · g)</span>
            <span className="kbd">↵</span><span>next row</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtBand(b) {
  const fmt = v => (v >= 0 ? `+${v}` : `${v}`) + "%";
  return `${fmt(b[0])} / ${fmt(b[1])}`;
}

Object.assign(window, { ScreenSetup, computeHead, fmtBand, KGF_TO_BAR });
