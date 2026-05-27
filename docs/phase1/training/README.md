# Training notes

Companion pages that unpack the skills exercised across the Phase 1 sprints.
Every example is real code that landed in the repo, not a toy.

Read them in order if you're new to the stack; pick the one that matches the
task at hand if you're hunting for a specific recipe.

## Sprint 0 — foundation ([sprint-0-foundation.md](../sprints/sprint-0-foundation.md))

| # | Topic | Why it matters |
|---|-------|----------------|
| 1 | [Python packaging](01-python-packaging.md) | A package you can't `pip install` can't be shipped or tested. |
| 2 | [Testing engineering calculations](02-engineering-calculation-tests.md) | "It runs" is not "it's correct". Golden numbers and physical sanity checks are how you know. |
| 3 | [Wrapping a library with a REST API](03-rest-api-wrapping-a-library.md) | The pump library is the engine; FastAPI is how every other surface (web, desktop) drives it. |
| 4 | [Connecting a React frontend to a Python backend](04-react-frontend-to-python-backend.md) | Two languages, two processes, one user — `fetch`, JSON, CORS, units. |
| 5 | [Prove it works before building more](05-prove-it-works-before-building-more.md) | The single discipline that turns a sprint plan into a working v1. |

## Sprint 1 — hot path ([sprint-1-hot-path.md](../sprints/sprint-1-hot-path.md))

| # | Topic | Why it matters |
|---|-------|----------------|
| 6 | [Frontend toolchain migration](06-frontend-toolchain-migration.md) | Pre-sprint: from CDN prototype to Vite + ES modules, with the Electron sidecar contract in mind. Written under the academic-research convention with APA-cited primary sources. |

Each page follows the same shape:
- **The principle** — one paragraph.
- **The sprint reference** — pointers into the actual files we changed.
- **The recipe** — step-by-step pattern you can reuse.
- **Pitfalls** — what to watch for when you do this next.
