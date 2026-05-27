# Electron shell (Sprint 2 — Task 2.7)

Placeholder. The Electron main process, preload, and Python sidecar manager
will live here when Sprint 2 Task 2.7 starts. The chosen architecture:

```
Electron main process (Node.js)
├── spawns the Python sidecar (PyInstaller-bundled uvicorn) on a free port
├── waits for /api/health to return 200
└── creates BrowserWindow loading frontend/dist/index.html

Renderer (React)
└── window-level config tells api-client.jsx which port to use, then
    every fetch("/api/...") works the same as web/dev — the sidecar
    serves the exact same FastAPI app from pump.api.main
```

## Why a sidecar (not a JS↔Python IPC bridge)

The FastAPI HTTP boundary is already the contract between frontend and Python.
Reusing it in Electron means:

- Zero new transport code — `api-client.jsx` is unchanged
- Same Pydantic validation, same error format, same Swagger docs
- The Python process is replaceable (PyInstaller, Nuitka, or even Docker)
  without renderer changes
- Web deploy and desktop produce identical behavior because they share the
  exact same API surface

The alternative (a custom JS↔Python IPC over Electron's contextBridge) would
fork the codebase: web fetches HTTP, desktop calls a bridge, and we maintain
both forever. Not worth it.

## Files (to be added in Sprint 2)

- `main.js` — Electron entry, BrowserWindow creation, sidecar lifecycle
- `preload.js` — exposes a small `window.pumplab` API to the renderer
  (sidecar port, app version, file dialog helpers for project save/load)
- `sidecar.js` — spawns/monitors/kills the bundled Python uvicorn process

## Build (Sprint 2)

```bash
# In frontend/, with electron + electron-builder added to devDependencies:
npm run build          # vite build → dist/
npm run electron:dev   # electron-vite or electron . pointing at dist/
npm run electron:dist  # electron-builder → Windows/macOS/Linux installers
```

The PyInstaller bundle of `pump.api.main` is built separately and copied into
the Electron app resources before `electron-builder` packages it.
