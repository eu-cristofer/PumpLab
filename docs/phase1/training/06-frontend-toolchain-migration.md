# 6. Frontend toolchain migration — from CDN prototype to Vite + ES modules

This is the first companion note for Sprint 1. It documents the pre-sprint
migration step that converted the [PumpLabGUI/](../../../PumpLabGUI/)
CDN-loaded React prototype into the Vite-built [frontend/](../../../frontend/)
renderer that both the web target and the Sprint 2 Electron shell will load.
Subsequent Sprint 1 notes build on this layout.

This note follows the academic-research convention: every architectural claim
that does not concern code in this repository is anchored to a primary source
in the [References](#references) section, formatted in APA 7th edition
(American Psychological Association, 2020).

## The principle

A prototype loaded from a CDN through `@babel/standalone` is a demonstration
artifact, not a deployment artifact. It cannot consume npm packages, cannot be
statically analyzed by a bundler, and exposes its component graph through
mutation of the global `window` object — a model the JavaScript language has
explicitly moved away from. The ECMAScript specification has standardised
module declarations through the `import` and `export` syntax since the 6th
edition (ECMA International, 2025, §16), making the language itself, rather
than a script-tag load order, the source of truth for which symbol comes from
where.

The migration must also respect the Phase 1 desktop target. Two transport
models exist for connecting a renderer to a local Python computation engine:
either a one-of-a-kind JavaScript–Python bridge over Electron's
`contextBridge` (Electron Maintainers, n.d.), or the *sidecar* pattern, in
which the desktop shell spawns the same FastAPI process the web target
deploys and the renderer communicates with both over the same HTTP surface.
Burns and Oppenheimer (2016) catalogue the sidecar among single-node
container design patterns, in which a secondary process is attached to a
parent application and shares its lifecycle. Adopting the sidecar means the
renderer's HTTP client is identical in dev, web, and desktop; adopting a
custom bridge means maintaining two transports indefinitely. The migration
commits to the sidecar by routing every renderer fetch through `/api/*`.

## The Sprint 1 reference

Five small surfaces in [frontend/](../../../frontend/):

- [frontend/package.json](../../../frontend/package.json) — declares
  `react`, `react-dom`, and `vite` as the only runtime/build dependencies.
- [frontend/vite.config.js](../../../frontend/vite.config.js) — installs
  `@vitejs/plugin-react` and proxies `/api/*` to `http://localhost:8000`,
  the FastAPI process from Sprint 0.
- [frontend/index.html](../../../frontend/index.html) — Vite entry; loads
  one `<script type="module" src="/src/main.jsx">`. No CDN scripts, no
  in-browser Babel.
- [frontend/src/components/](../../../frontend/src/components/) and
  [frontend/src/screens/](../../../frontend/src/screens/) — 1:1 ES-module
  port of the nine `.jsx` files from `PumpLabGUI/`. File boundaries are
  preserved so the diff is auditable.
- [frontend/electron/README.md](../../../frontend/electron/README.md) —
  placeholder for Sprint 2 Task 2.7 documenting the sidecar contract.

The original [PumpLabGUI/](../../../PumpLabGUI/) directory is retained as
the parity reference until the new renderer is verified in a browser.

## The recipe

### Step 1 — Decide the deployment model first

Before the first line of toolchain configuration, pin the deployment topology.
Two questions settle it:

1. *Where does the Python computation engine live in each target?* For
   PumpLab the answer is the same FastAPI process everywhere: a separately
   deployed service for the web target, a locally spawned subprocess for
   the desktop target. This is the sidecar arrangement described by Burns
   and Oppenheimer (2016).
2. *What is the renderer's wire format to that engine?* HTTP requests
   against `/api/*` paths, encoded as JSON. Because the Electron renderer is
   a Chromium-derived process (Electron Maintainers, n.d.), `fetch` is
   available unchanged; nothing in the Electron-specific API needs to leak
   into the React code.

Once these are pinned, the toolchain choice becomes mechanical: the build
must produce a static bundle that the web host and the Electron main
process can both load, and the dev server must route the same `/api/*`
paths to the local FastAPI during development.

### Step 2 — Convert window globals to ES module imports

The prototype's nine files each ended with a line of the form
`Object.assign(window, { Foo, Bar })`, and consumers read those symbols off
`window` implicitly by relying on a script load order in `index.html`. This
is not how the language is specified to operate. ECMA-262 defines a module
record whose imports and exports are resolved before execution begins (ECMA
International, 2025, §16.2), enabling static analysis and dead-code
elimination.

The migration replaces each terminal `Object.assign` with a corresponding
`export` statement and introduces explicit `import` lines at every consumer.
A representative pair, from
[frontend/src/components/api-client.jsx](../../../frontend/src/components/api-client.jsx):

```js
// Before — PumpLabGUI/api-client.jsx
Object.assign(window, { buildFitCurveRequest, fitCurveViaApi, BackendCurveCard });
```

```js
// After — frontend/src/components/api-client.jsx
import React from "react";
import { Icon } from "./app-shell.jsx";
import { LineChart } from "./charts.jsx";
// ...
export { buildFitCurveRequest, fitCurveViaApi, BackendCurveCard };
```

Two practical disciplines fall out of this conversion:

- *Symbols cross module boundaries explicitly.* The migration surfaced one
  cross-file dependency that the old `window` model concealed:
  `screen-mrt.jsx` was using `Legend` from `screen-results.jsx`. The new
  layout makes that dependency an explicit `import`, which an IDE and a
  bundler can both follow.
- *Utilities migrate to the data they format.* `fmtBand`, which formats a
  tolerance band, moved from `screen-setup.jsx` to `app-shell.jsx` alongside
  the `TOLERANCES` table it operates on. Similarly, `KGF_TO_BAR` and
  `computeHead` moved into `charts.jsx` next to the other unit math. Module
  boundaries reveal the natural homes that script-tag load order obscured.

### Step 3 — Configure a dev server that serves native modules

Vite's design uses the same `import` machinery in development that the
specification mandates for production: source files are served on demand
over native ESM, the browser requests them as their imports are encountered,
and Vite transforms each file as it is requested using esbuild for fast
single-file compilation (Vite Maintainers, n.d.). For production, Vite has
historically bundled with Rollup to amortise the cost of nested-import
network round trips (Vite Maintainers, n.d.).

The configuration in [frontend/vite.config.js](../../../frontend/vite.config.js)
is short because most of the work is in the defaults:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
  build: { outDir: "dist", sourcemap: true },
});
```

`strictPort: true` makes a port conflict fail loudly instead of silently
falling back to a different port — important when a co-resident process
(such as a leftover `python3 -m http.server`) is already on 5173.

### Step 4 — Make `/api/*` the only transport

The Sprint 0 client used an absolute URL: `http://localhost:8000/api/...`.
This was correct for Sprint 0's proof but bakes in the assumption that the
backend is always on `localhost:8000`. The migrated client in
[frontend/src/components/api-client.jsx](../../../frontend/src/components/api-client.jsx)
now uses a relative URL:

```js
const API_BASE = "";

async function fitCurveViaApi(payload) {
  const response = await fetch(`${API_BASE}/api/analysis/fit-curve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  // ...
}
```

The same relative path works in three environments:

| Environment | What handles `/api/*`                                              |
|-------------|---------------------------------------------------------------------|
| Dev         | Vite proxy forwards to `http://localhost:8000` (`vite.config.js`).  |
| Web prod    | The reverse proxy in front of the deployed FastAPI serves it.       |
| Desktop     | Electron's spawned uvicorn sidecar serves it on a runtime-chosen port; the Electron preload injects the base URL once at startup. |

The Electron column relies on the process model: the main process spawns
and supervises the sidecar, and the renderer (which Electron documents as
inheriting from Chromium and being responsible for rendering web content;
Electron Maintainers, n.d.) consumes the URL through a small bridge exposed
via `contextBridge`. The contract is "tell the renderer which port", not
"build a new transport." The standalone Python binary that the desktop ships
is produced by PyInstaller, which collects "the active Python interpreter"
together with the program so end users "do not need to install any
particular version of Python or any modules" (PyInstaller Development Team,
n.d.).

### Step 5 — Verify the module graph before claiming parity

A migration that "looks ported" can still have an unresolved import or a
mis-cased path that escapes a casual eye. Two cheap checks before declaring
parity:

```bash
cd frontend
npm install
npm run build       # vite resolves the full graph; any missing import errors here
npm run dev         # serves /src/*.jsx; HTTP probes confirm files compile
```

For the migration, `npm run build` reported "39 modules transformed" with
no errors, and the dev server returned 200 on `/`, `/src/main.jsx`,
`/src/App.jsx`, `/src/screens/screen-setup.jsx`, `/src/components/api-client.jsx`,
and `/src/styles.css`. A 200 only proves the file *resolves and compiles*;
it does not prove the UI renders identically. That last check requires a
browser and a side-by-side comparison against the retained `PumpLabGUI/`.

## Pitfalls

- **Treating "200 OK" as "feature parity."** Vite returning a compiled
  module is necessary but not sufficient. The renderer's runtime behaviour
  — state transitions, chart legends, theme toggles — must be exercised
  against the prototype before [PumpLabGUI/](../../../PumpLabGUI/) is
  deleted.
- **Leaving `API_BASE` absolute.** A relative URL is the load-bearing
  reason the same client works in dev, web, and Electron. Reintroducing
  `http://localhost:8000` anywhere in the renderer fragments the transport.
- **Putting Electron deps in a separate `package.json`.** A second
  `node_modules` doubles the install footprint and complicates
  electron-builder's input. The `frontend/` layout keeps a single
  `package.json` for both renderer and (eventually) Electron main process.
- **Skipping `strictPort`.** A silent port fallback in Vite hides
  collisions until a user reports that the page they see is stale. Make
  the conflict fail at startup; resolve it deliberately.
- **Conflating "ES modules in the browser" with "ES modules in Node."**
  Both are governed by the same specification (ECMA International, 2025),
  but the resolver rules and the meaning of bare specifiers differ. Vite
  smooths the difference for the browser; Electron's main-process Node
  scripts in Sprint 2 will reckon with it directly.
- **Forgetting that the sidecar is a process.** Burns and Oppenheimer
  (2016) describe the sidecar as sharing the parent application's
  lifecycle. The Electron main process must therefore supervise the
  spawned uvicorn — start it, wait for `/api/health`, restart on crash,
  and tear it down on quit. The renderer is not equipped to do this.

## References

ECMA International. (2025). *ECMAScript® 2025 language specification*
(16th ed.). https://262.ecma-international.org/

Electron Maintainers. (n.d.). *Process model*. Electron Documentation.
Retrieved May 27, 2026, from
https://www.electronjs.org/docs/latest/tutorial/process-model

Burns, B., & Oppenheimer, D. (2016). Design patterns for container-based
distributed systems. In *Proceedings of the 8th USENIX Workshop on Hot
Topics in Cloud Computing (HotCloud '16)*. USENIX Association.
https://research.google/pubs/pub45406

American Psychological Association. (2020). *Publication manual of the
American Psychological Association* (7th ed.).

PyInstaller Development Team. (n.d.). *What PyInstaller does and how it
does it*. PyInstaller Documentation. Retrieved May 27, 2026, from
https://pyinstaller.org/en/stable/operating-mode.html

Vite Maintainers. (n.d.). *Why Vite?* Vite Documentation. Retrieved
May 27, 2026, from https://vite.dev/guide/why
