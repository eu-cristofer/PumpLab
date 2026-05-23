// app-shell.jsx — top bar, sidebar, status bar, i18n

const I18N = {
  en: {
    appName: "PumpLab",
    appSub: "API 610 Performance & MRT",
    standard: "Standard",
    unit: "Pressure unit",
    language: "Language",
    parallel: "Parallel operation",
    tagsLabel: "Tests",
    setup: "Test Setup",
    results: "Results",
    mrt: "Mechanical Running",
    reports: "Reports",
    import: "Import data",
    export: "Export data",
    calculate: "Calculate & plot",
    save: "Save",
    close: "Close",
    new: "New test",
    ratedPoint: "Rated point (nameplate)",
    ratedPointSub: "Required values from the pump datasheet",
    testPoints: "Test points",
    testPointsSub: "Measured points during the performance run",
    addRow: "Add point",
    removeLast: "Remove last",
    fields: {
      tag: "Pump TAG",
      qNom: "Rated flow",
      hNom: "Rated head",
      nNom: "Rated speed",
      pNom: "Rated power",
      sgNom: "Relative density",
      muNom: "Kinematic viscosity",
      hShut: "Shutoff head",
      q: "Flow",
      pSuc: "Suction pressure",
      pDis: "Discharge pressure",
      tW: "Water temp.",
      hCalc: "Head (calc.)",
      power: "Power",
      n: "Speed",
    },
    units: {
      flow: "m³/h",
      head: "m",
      rpm: "rpm",
      power: "kW",
      sg: "–",
      visc: "cSt",
      temp: "°C",
      mmps: "mm/s rms",
      celsius: "°C",
      db: "dB(A)",
      mlh: "ml/h",
    },
    chart: { head: "Head vs Flow", power: "Power vs Flow", eff: "Efficiency vs Flow", flow: "Flow", h: "Head", p: "Power", eta: "Efficiency" },
    bep: "BEP",
    nameplate: "Nameplate",
    measured: "Measured",
    predicted: "Predicted",
    deviation: "Deviation",
    tolerance: "Tolerance",
    verdict: "Verdict",
    pass: "Pass",
    warn: "Warn",
    fail: "Fail",
    pending: "Pending",
    notRun: "Not run",
    runCalc: "Run calculation to see results",
    statusReady: "Ready",
    statusUnsaved: "Unsaved changes",
    statusOK: "All checks passed",
    statusFail: "Action required",
    standardsBar: "Standard band per API 610",
    quickActions: "Quick actions",
    docs: "Documentation",
    project: "Test project",
    operator: "Operator",
    siteRef: "Site / Tag ref.",
    notes: "Notes",
    saveTitle: "Export results",
    saveSub: "Choose the format for the test report",
    cancel: "Cancel",
    download: "Download",
    formats: { json: "JSON (raw data)", html: "HTML report (printable)", docx: "Word document (.doc)" },
    vib: "Overall vibration",
    bear: "Bearing temperature",
    noise: "Sound pressure",
    seal: "Seal leakage",
    nde: "Non-drive end",
    de: "Drive end",
    limit: "Limit",
    importToast: "Sample data loaded",
    exportToast: "Report ready",
    legend: { fit: "Polynomial fit", pts: "Test points", nameplate: "Nameplate", band: "Tolerance band", out: "Out of tolerance" },
  },
  pt: {
    appName: "PumpLab",
    appSub: "API 610 — Performance & Mecânico",
    standard: "Norma",
    unit: "Unid. de pressão",
    language: "Idioma",
    parallel: "Bomba em paralelo",
    tagsLabel: "Ensaios",
    setup: "Ensaio",
    results: "Resultados",
    mrt: "Mecânico (MRT)",
    reports: "Relatórios",
    import: "Importar dados",
    export: "Exportar dados",
    calculate: "Calcular e gerar gráficos",
    save: "Salvar",
    close: "Fechar",
    new: "Novo ensaio",
    ratedPoint: "Ponto nominal (plaqueta)",
    ratedPointSub: "Valores obrigatórios da plaqueta da bomba",
    testPoints: "Pontos de ensaio",
    testPointsSub: "Pontos medidos durante o teste de performance",
    addRow: "Adicionar ponto",
    removeLast: "Remover último",
    fields: {
      tag: "TAG da bomba",
      qNom: "Q nominal",
      hNom: "Head nominal",
      nNom: "Rotação nominal",
      pNom: "Potência nominal",
      sgNom: "Densidade relativa",
      muNom: "Viscosidade",
      hShut: "Head no shutoff",
      q: "Vazão",
      pSuc: "P. sucção",
      pDis: "P. descarga",
      tW: "Temp. água",
      hCalc: "Head calc.",
      power: "Potência",
      n: "Rotação",
    },
    units: {
      flow: "m³/h",
      head: "m",
      rpm: "rpm",
      power: "kW",
      sg: "–",
      visc: "cSt",
      temp: "°C",
      mmps: "mm/s rms",
      celsius: "°C",
      db: "dB(A)",
      mlh: "ml/h",
    },
    chart: { head: "Head × Vazão", power: "Potência × Vazão", eff: "Rendimento × Vazão", flow: "Vazão", h: "Head", p: "Potência", eta: "Rendimento" },
    bep: "BEP",
    nameplate: "Plaqueta",
    measured: "Medido",
    predicted: "Predito",
    deviation: "Desvio",
    tolerance: "Tolerância",
    verdict: "Veredicto",
    pass: "Aprovado",
    warn: "Atenção",
    fail: "Reprovado",
    pending: "Pendente",
    notRun: "Não calculado",
    runCalc: "Execute o cálculo para ver os resultados",
    statusReady: "Pronto",
    statusUnsaved: "Alterações não salvas",
    statusOK: "Todos os critérios atendidos",
    statusFail: "Ação necessária",
    standardsBar: "Faixa da norma API 610",
    quickActions: "Ações rápidas",
    docs: "Documentação",
    project: "Projeto",
    operator: "Operador",
    siteRef: "Local / Tag ref.",
    notes: "Observações",
    saveTitle: "Exportar resultados",
    saveSub: "Escolha o formato do relatório",
    cancel: "Cancelar",
    download: "Baixar",
    formats: { json: "JSON (dados brutos)", html: "Relatório HTML (imprimível)", docx: "Documento Word (.doc)" },
    vib: "Vibração global",
    bear: "Temp. mancal",
    noise: "Pressão sonora",
    seal: "Vazamento selagem",
    nde: "Lado oposto ao acoplamento",
    de: "Lado do acoplamento",
    limit: "Limite",
    importToast: "Dados de exemplo carregados",
    exportToast: "Relatório pronto",
    legend: { fit: "Ajuste polinomial", pts: "Pontos do ensaio", nameplate: "Plaqueta", band: "Faixa de tolerância", out: "Fora de tolerância" },
  },
};

// Standards list (rendered the same in both languages)
const STANDARDS = [
  { id: "api610", label: "API 610 (12ª) / ISO 13709 + N-553", short: "API 610" },
  { id: "asme73", label: "ASME B73.1 / B73.2 + N-906", short: "ASME B73" },
  { id: "iso5199", label: "ISO 5199 + N-906", short: "ISO 5199" },
];

// Tolerance bands per standard (Q, H, P, eta) — illustrative %
const TOLERANCES = {
  api610: { q: [-0, +10], h: [-0, +10], eta: [-5, +5], p: [-0, +4] },
  asme73: { q: [-5, +10], h: [-5, +10], eta: [-7, +5], p: [-0, +8] },
  iso5199:{ q: [-7, +9],  h: [-7, +9],  eta: [-8, +5], p: [-0, +9] },
};

// Icons (simple inline SVGs)
const Icon = ({ name, size = 14 }) => {
  const props = { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "gauge": return <svg {...props}><circle cx="8" cy="9" r="5"/><path d="M8 9l3-2.5"/><path d="M3 9a5 5 0 0 1 10 0"/></svg>;
    case "chart": return <svg {...props}><path d="M2 13h12"/><path d="M3 11l3-4 3 2 4-6"/></svg>;
    case "wave":  return <svg {...props}><path d="M2 8c1.5-3 3-3 4 0s2.5 3 4 0 3-3 4 0"/></svg>;
    case "doc":   return <svg {...props}><path d="M4 2h6l3 3v9H4z"/><path d="M10 2v3h3"/><path d="M6 8h5M6 11h4"/></svg>;
    case "import":return <svg {...props}><path d="M8 2v8"/><path d="M5 7l3 3 3-3"/><path d="M3 13h10"/></svg>;
    case "export":return <svg {...props}><path d="M8 10V2"/><path d="M5 5l3-3 3 3"/><path d="M3 13h10"/></svg>;
    case "play":  return <svg {...props}><path d="M5 3l8 5-8 5z" fill="currentColor"/></svg>;
    case "plus":  return <svg {...props}><path d="M8 3v10M3 8h10"/></svg>;
    case "minus": return <svg {...props}><path d="M3 8h10"/></svg>;
    case "x":     return <svg {...props}><path d="M4 4l8 8M12 4l-8 8"/></svg>;
    case "trash": return <svg {...props}><path d="M3 5h10M6 5V3h4v2M5 5l1 9h4l1-9"/></svg>;
    case "info":  return <svg {...props}><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5v.5"/></svg>;
    case "check": return <svg {...props}><path d="M3 8l3 3 7-7"/></svg>;
    case "warn":  return <svg {...props}><path d="M8 2l6 11H2z"/><path d="M8 7v3M8 11.5v.5"/></svg>;
    case "set":   return <svg {...props}><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3"/></svg>;
    case "calc":  return <svg {...props}><rect x="3" y="2" width="10" height="12" rx="1"/><path d="M5 5h6M5 8h1M8 8h1M11 8h0.5M5 11h1M8 11h1M11 11h0.5"/></svg>;
    case "globe": return <svg {...props}><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12"/></svg>;
    case "save":  return <svg {...props}><path d="M3 3h8l2 2v8H3z"/><path d="M5 3v4h6V3M5 13v-4h6v4"/></svg>;
    case "moon":  return <svg {...props}><path d="M13 9.5A5.5 5.5 0 1 1 6.5 3a4.5 4.5 0 0 0 6.5 6.5z"/></svg>;
    case "drop":  return <svg {...props}><path d="M8 2c2 3 4 5 4 8a4 4 0 1 1-8 0c0-3 2-5 4-8z"/></svg>;
    case "therm": return <svg {...props}><path d="M9 9V3a1.5 1.5 0 0 0-3 0v6a3 3 0 1 0 3 0z"/></svg>;
    case "speaker": return <svg {...props}><path d="M3 6h2l4-3v10L5 10H3z"/><path d="M11 6a3 3 0 0 1 0 4"/></svg>;
    default: return null;
  }
};

// ===== Top bar =====
function TopBar({ t, lang, setLang, unit, setUnit, std, setStd, standards, brand, onSave, onCalc, dirty }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">{(brand[0] || "P").toUpperCase()}</div>
        <div>
          <div className="brand-name">{brand}<span className="light"> / {t.appSub}</span></div>
        </div>
      </div>

      <div className="topbar-group">
        <label className="dim" style={{fontSize:11}}>{t.standard}</label>
        <select className="select" style={{height:26, fontSize:12, width: 280}} value={std} onChange={e => setStd(e.target.value)}>
          {standards.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <div className="sep-v"/>

      <div className="topbar-group">
        <label className="dim" style={{fontSize:11}}>{t.unit}</label>
        <div className="seg sm" role="tablist">
          <button aria-pressed={unit === "kgf"} onClick={() => setUnit("kgf")}>kgf/cm²</button>
          <button aria-pressed={unit === "bar"} onClick={() => setUnit("bar")}>bar</button>
        </div>
      </div>

      <div className="topbar-spacer"/>

      <div className="topbar-meta">{dirty ? "● " : "○ "}{dirty ? t.statusUnsaved : t.statusReady}</div>

      <div className="sep-v"/>

      <div className="topbar-group">
        <div className="seg sm">
          <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
          <button aria-pressed={lang === "pt"} onClick={() => setLang("pt")}>PT</button>
        </div>
      </div>

      <button className="btn sm" onClick={onSave} title={t.save}><Icon name="save"/></button>
      <button className="btn primary sm" onClick={onCalc}><Icon name="play"/> {t.calculate}</button>
    </div>
  );
}

// ===== Sidebar =====
function Sidebar({ t, tab, setTab, tag, std, standards, parallel, setParallel, pointCount, lastVerdict }) {
  const stdShort = standards.find(s => s.id === std)?.short || "";
  return (
    <aside className="sidebar">
      <div className="sidebar-section" style={{paddingBottom: 0}}>
        <div className="sidebar-label">{t.tagsLabel}</div>
      </div>
      <nav className="nav">
        <button className={"nav-item" + (tab === "setup" ? " active" : "")} onClick={() => setTab("setup")}>
          <span className="nav-icon"><Icon name="doc"/></span>
          <span>{t.setup}</span>
          <span className="nav-count">{pointCount}</span>
        </button>
        <button className={"nav-item" + (tab === "results" ? " active" : "")} onClick={() => setTab("results")}>
          <span className="nav-icon"><Icon name="chart"/></span>
          <span>{t.results}</span>
          {lastVerdict && <span className={"badge " + lastVerdict.cls} style={{height:18, padding:"0 6px", fontSize:9.5}}>{t[lastVerdict.key]}</span>}
        </button>
        <button className={"nav-item" + (tab === "mrt" ? " active" : "")} onClick={() => setTab("mrt")}>
          <span className="nav-icon"><Icon name="wave"/></span>
          <span>{t.mrt}</span>
        </button>
        <button className={"nav-item" + (tab === "reports" ? " active" : "")} onClick={() => setTab("reports")}>
          <span className="nav-icon"><Icon name="export"/></span>
          <span>{t.reports}</span>
        </button>
      </nav>

      <div className="side-status">
        <div><span className="k">{t.fields.tag}</span></div>
        <div className="v">{tag || "—"}</div>
        <div><span className="k">{t.standard}</span></div>
        <div className="v">{stdShort}</div>
        <label className="check" style={{marginTop: 4}}>
          <input type="checkbox" checked={parallel} onChange={e => setParallel(e.target.checked)}/>
          <span>{t.parallel}</span>
        </label>
      </div>

      <div className="sidebar-footer">
        <div className="muted" style={{fontFamily:"var(--font-mono)", fontSize:10.5}}>
          <div>API 610 · 12th ed.</div>
          <div>ISO 13709 · N-553</div>
        </div>
      </div>
    </aside>
  );
}

// ===== Status bar =====
function StatusBar({ t, std, standards, unit, points, lastCalc, tag }) {
  const stdLabel = standards.find(s => s.id === std)?.short || "";
  return (
    <div className="statusbar">
      <div className="sb-item"><span className="dot"/> {t.statusReady}</div>
      <div className="sep"/>
      <div className="sb-item">TAG: {tag || "—"}</div>
      <div className="sep"/>
      <div className="sb-item">{stdLabel}</div>
      <div className="sep"/>
      <div className="sb-item">P: {unit === "kgf" ? "kgf/cm²" : "bar"}</div>
      <div className="sep"/>
      <div className="sb-item">N pts: {points}</div>
      <div className="spacer" style={{flex:1}}/>
      <div className="sb-item">{lastCalc ? `calc @ ${lastCalc}` : "—"}</div>
      <div className="sep"/>
      <div className="sb-item">v0.6.2 · build 1428</div>
    </div>
  );
}

Object.assign(window, { I18N, STANDARDS, TOLERANCES, Icon, TopBar, Sidebar, StatusBar });
