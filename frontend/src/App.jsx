// App.jsx — root component, state, screen wiring.

import React from "react";
import {
  useTweaks, TweaksPanel, TweakSection, TweakText,
  TweakSelect, TweakColor, TweakRadio, TweakButton,
} from "./components/tweaks-panel.jsx";
import {
  I18N, STANDARDS, Icon, TopBar, Sidebar, StatusBar,
} from "./components/app-shell.jsx";
import { KGF_TO_BAR } from "./components/charts.jsx";
import { ScreenSetup } from "./screens/screen-setup.jsx";
import { ScreenResults } from "./screens/screen-results.jsx";
import { ScreenMRT } from "./screens/screen-mrt.jsx";
import { ScreenReports, ExportModal } from "./screens/screen-reports.jsx";

const SAMPLE_RATED = {
  tag: "P-101A",
  qNom: "120",
  hNom: "85",
  nNom: "3550",
  pNom: "42",
  sgNom: "1.000",
  muNom: "1.0",
  hShut: "102",
};

const SAMPLE_POINTS = [
  { q: "30",  pSuc: "0.30", pDis: "10.40", tW: "24.0", power: "19.8", n: "3548" },
  { q: "60",  pSuc: "0.30", pDis: "10.08", tW: "24.1", power: "26.6", n: "3549" },
  { q: "90",  pSuc: "0.30", pDis: "9.54",  tW: "24.3", power: "32.5", n: "3550" },
  { q: "120", pSuc: "0.30", pDis: "8.80",  tW: "24.5", power: "38.7", n: "3551" },
  { q: "150", pSuc: "0.30", pDis: "7.85",  tW: "24.6", power: "45.2", n: "3550" },
  { q: "175", pSuc: "0.30", pDis: "6.92",  tW: "24.8", power: "50.6", n: "3549" },
];

const EMPTY_RATED = { tag: "", qNom: "", hNom: "", nNom: "", pNom: "", sgNom: "1.000", muNom: "", hShut: "" };
const EMPTY_POINTS = [
  { q: "", pSuc: "", pDis: "", tW: "", power: "", n: "" },
  { q: "", pSuc: "", pDis: "", tW: "", power: "", n: "" },
  { q: "", pSuc: "", pDis: "", tW: "", power: "", n: "" },
];

const SAMPLE_MRT = {
  nde: { vib: "2.4", bear: "76", noise: "78", seal: "3.5" },
  de:  { vib: "2.8", bear: "84", noise: "79", seal: "4.0" },
};

const ACCENT_MAP = {
  "#1f3a8a": { soft: "#e5e9f5", darkSoft: "#1a2347" },
  "#0f766e": { soft: "#def0ed", darkSoft: "#0e2b29" },
  "#b45309": { soft: "#f8ecd8", darkSoft: "#3a2810" },
  "#2a2d35": { soft: "#e4e3df", darkSoft: "#1c1f25" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "brand": "PumpLab",
  "aesthetic": "instrument",
  "accent": "#1f3a8a",
  "density": "normal",
  "lang": "en"
}/*EDITMODE-END*/;

export default function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLangState] = React.useState(tweaks.lang || "en");
  const [unit, setUnit] = React.useState("kgf");
  const [std, setStd] = React.useState("api610");
  const [tab, setTab] = React.useState("setup");
  const [parallel, setParallel] = React.useState(false);
  const [showExport, setShowExport] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [project, setProject] = React.useState({
    name: "Acceptance test P-101A",
    operator: "L. Almeida",
    site: "U-21 / Bay 03",
    notes: "Re-certification after impeller swap.",
  });
  const [mrt, setMrt] = React.useState(SAMPLE_MRT);

  const [state, setState] = React.useState({
    rated: SAMPLE_RATED,
    points: SAMPLE_POINTS,
    std: "api610",
    lastCalcAt: null,
    dirty: false,
  });

  React.useEffect(() => { setLangState(tweaks.lang || "en"); }, [tweaks.lang]);

  const setLang = (l) => { setTweak("lang", l); };

  React.useEffect(() => {
    document.body.dataset.aesthetic = tweaks.aesthetic;
    document.body.dataset.density = tweaks.density;
    const accentHex = tweaks.accent;
    const map = ACCENT_MAP[accentHex] || ACCENT_MAP["#1f3a8a"];
    document.body.style.setProperty("--accent", accentHex);
    const soft = tweaks.aesthetic === "dark" ? map.darkSoft : map.soft;
    document.body.style.setProperty("--accent-soft", soft);
  }, [tweaks.aesthetic, tweaks.accent, tweaks.density]);

  React.useEffect(() => { setState(s => ({ ...s, std })); }, [std]);

  const t = I18N[lang];

  const handleSetUnit = (newUnit) => {
    if (newUnit === unit) return;
    const factor = newUnit === "bar" ? KGF_TO_BAR : 1 / KGF_TO_BAR;
    setState(s => ({
      ...s,
      points: s.points.map(p => ({
        ...p,
        pSuc: p.pSuc === "" ? "" : (parseFloat(p.pSuc) * factor).toFixed(3),
        pDis: p.pDis === "" ? "" : (parseFloat(p.pDis) * factor).toFixed(3),
      })),
    }));
    setUnit(newUnit);
    showToast(newUnit === "bar" ? "Converted to bar" : "Converted to kgf/cm²");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const onCalc = () => {
    setState(s => ({ ...s, lastCalcAt: Date.now(), dirty: false }));
    setTab("results");
    showToast(lang === "pt" ? "Cálculo concluído" : "Calculation complete");
  };

  const onRecalc = () => {
    setState(s => ({ ...s, lastCalcAt: Date.now() }));
    showToast(lang === "pt" ? "Recalculado" : "Recalculated");
  };

  const onLoadSample = () => {
    setState(s => ({ ...s, rated: SAMPLE_RATED, points: SAMPLE_POINTS, lastCalcAt: null, dirty: true }));
    setProject({ name: "Acceptance test P-101A", operator: "L. Almeida", site: "U-21 / Bay 03", notes: "Re-certification after impeller swap." });
    setMrt(SAMPLE_MRT);
    showToast(t.importToast);
  };

  const onExportData = () => { setShowExport(true); };
  const onExportReport = () => { setShowExport(true); };

  const lastVerdict = state.lastCalcAt ? { cls: "pass", key: "pass" } : null;
  const sx = { ...state, onCalc, onRecalc, onLoadSample, onExportData };

  return (
    <div className="app">
      <TopBar
        t={t} lang={lang} setLang={setLang}
        unit={unit} setUnit={handleSetUnit}
        std={std} setStd={setStd}
        standards={STANDARDS}
        brand={tweaks.brand || "PumpLab"}
        onSave={onExportData}
        onCalc={onCalc}
        dirty={state.dirty}
      />
      <div className="app-body">
        <Sidebar
          t={t} tab={tab} setTab={setTab}
          tag={state.rated.tag} std={std}
          standards={STANDARDS}
          parallel={parallel} setParallel={setParallel}
          pointCount={state.points.length}
          lastVerdict={lastVerdict}
        />
        <main className="canvas" data-screen-label={tab}>
          {tab === "setup"   && <ScreenSetup t={t} state={sx} set={setState} unit={unit} project={project} setProject={setProject}/>}
          {tab === "results" && <ScreenResults t={t} state={sx} unit={unit} onExportReport={onExportReport}/>}
          {tab === "mrt"     && <ScreenMRT t={t} mrt={mrt} setMrt={setMrt}/>}
          {tab === "reports" && <ScreenReports t={t} state={sx} project={project} onExport={() => { setShowExport(true); }}/>}
        </main>
      </div>
      <StatusBar t={t} std={std} standards={STANDARDS} unit={unit} points={state.points.length} lastCalc={state.lastCalcAt ? new Date(state.lastCalcAt).toLocaleTimeString() : null} tag={state.rated.tag}/>

      {showExport && (
        <ExportModal
          t={t}
          onClose={() => setShowExport(false)}
          onConfirm={(fmt) => {
            setShowExport(false);
            showToast(`${t.exportToast} · .${fmt}`);
          }}
        />
      )}

      {toast && (
        <div className="toast">
          <Icon name="check" size={14}/> {toast}
        </div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Brand">
          <TweakText
            label="Product name"
            value={tweaks.brand}
            onChange={v => setTweak("brand", v)}
          />
        </TweakSection>

        <TweakSection label="Aesthetic">
          <TweakSelect
            label="Visual style"
            value={tweaks.aesthetic}
            onChange={v => setTweak("aesthetic", v)}
            options={[
              { value: "instrument", label: "Scientific instrument" },
              { value: "industrial", label: "Industrial · mono" },
              { value: "saas", label: "Modern SaaS" },
              { value: "dark", label: "Dark CAD" },
            ]}
          />
          <TweakColor
            label="Accent"
            value={tweaks.accent}
            onChange={v => setTweak("accent", v)}
            options={["#1f3a8a", "#0f766e", "#b45309", "#2a2d35"]}
          />
          <TweakRadio
            label="Density"
            value={tweaks.density}
            onChange={v => setTweak("density", v)}
            options={[{ value: "normal", label: "Normal" }, { value: "compact", label: "Compact" }]}
          />
        </TweakSection>

        <TweakSection label="Quick">
          <TweakButton label="Load sample data" onClick={onLoadSample}/>
          <TweakButton label="Clear all fields" onClick={() => {
            setState(s => ({ ...s, rated: EMPTY_RATED, points: EMPTY_POINTS.slice(), lastCalcAt: null, dirty: false }));
            setProject({ name: "", operator: "", site: "", notes: "" });
            showToast("Cleared");
          }}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}
