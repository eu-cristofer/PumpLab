# Sprint 0 training notes

These five companion pages unpack the skills exercised in
[sprint-0-foundation.md](../sprints/sprint-0-foundation.md). Every example
is the real code that landed during Sprint 0 — not a toy.

Read them in order if you're new to the stack; pick the one that matches
the task at hand if you're hunting for a specific recipe.

| # | Topic | Why it matters |
|---|-------|----------------|
| 1 | [Python packaging](01-python-packaging.md) | A package you can't `pip install` can't be shipped or tested. |
| 2 | [Testing engineering calculations](02-engineering-calculation-tests.md) | "It runs" is not "it's correct". Golden numbers and physical sanity checks are how you know. |
| 3 | [Wrapping a library with a REST API](03-rest-api-wrapping-a-library.md) | The pump library is the engine; FastAPI is how every other surface (web, desktop) drives it. |
| 4 | [Connecting a React frontend to a Python backend](04-react-frontend-to-python-backend.md) | Two languages, two processes, one user — `fetch`, JSON, CORS, units. |
| 5 | [Prove it works before building more](05-prove-it-works-before-building-more.md) | The single discipline that turns a sprint plan into a working v1. |

Each page follows the same shape:
- **The principle** — one paragraph.
- **The Sprint 0 reference** — pointers into the actual files we changed.
- **The recipe** — step-by-step pattern you can reuse.
- **Pitfalls** — what to watch for when you do this in Sprint 1+.
