# PumpLab frontend (web + Electron renderer)

React + Vite. Powers both the web target and the Electron desktop shell. All
computation lives in the Python `pump.api` package (CON-01) — the renderer only
calls REST endpoints.

## Development

In one terminal, run the FastAPI backend:

```bash
uvicorn pump.api.main:app --reload
```

In another, run Vite from this directory:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api/*` → `http://localhost:8000`,
so the renderer code uses relative URLs and works unchanged in dev, production
web, and Electron.

## Production build

```bash
npm run build
```

Outputs to `dist/`. For web deployment, serve `dist/` behind a reverse proxy
that also serves the FastAPI app at `/api/*`. For Electron, the main process
loads `dist/index.html` and spawns the Python sidecar (see `electron/`, Sprint 2).

## Layout

```
frontend/
├── electron/          # Electron main, preload, sidecar — Sprint 2
├── src/
│   ├── components/    # tweaks-panel, app-shell, charts, api-client
│   ├── screens/       # screen-setup, screen-results, screen-mrt, screen-reports
│   ├── App.jsx        # root component (state + screen wiring)
│   ├── main.jsx       # Vite entry; mounts App
│   └── styles.css     # all styles
├── index.html
├── package.json
└── vite.config.js
```

## Migration notes

This is a Sprint-1 Task 1.0 migration of the original `PumpLabGUI/` prototype:
flat directory, CDN React, in-browser Babel. The old GUI is kept at the repo
root as `PumpLabGUI/` until parity is verified, then deleted.

Behavioral changes vs. the prototype:

- `api-client.jsx` calls `/api/...` instead of `http://localhost:8000/api/...`.
  In dev this goes through the Vite proxy; in Electron the sidecar serves on
  the same path.
- `Object.assign(window, ...)` global wiring is replaced by ES module
  imports/exports. File boundaries are otherwise unchanged.
- `fmtBand` (was in `screen-setup.jsx`) and `computeHead`/`KGF_TO_BAR` (also in
  `screen-setup.jsx`) moved to where the data they format lives:
  `app-shell.jsx` and `charts.jsx` respectively.
