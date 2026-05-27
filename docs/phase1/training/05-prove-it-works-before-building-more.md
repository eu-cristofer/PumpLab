# 5. Prove it works before building more

## The principle

Every software project fails the same way. The team designs an
ambitious architecture, builds 70 % of it in beautiful isolation, then
integrates at the end — and discovers two systems that each work alone
but disagree at the seams. The fix is expensive precisely because so
much code already exists; refactoring 70 % of a half-built system feels
worse than finishing it, so the team finishes it, and ships something
fragile.

Sprint 0 exists to make that failure impossible. Before any "real"
feature work begins, you prove the end-to-end stack: form input →
HTTP → Python → JSON → chart. Once that round trip exists — even with
trivial logic — every later feature is just "swap the logic." The
expensive integration questions are answered while the code is small
enough to throw away.

This is the discipline. It does not feel productive at the time. The
deliverable looks like a chart of a polynomial nobody will ever ship.
It is the highest-leverage week of the project.

## The Sprint 0 reference

The gate review table in
[sprint-0-foundation.md](../sprints/sprint-0-foundation.md) is the
artefact:

| Check | Status |
|---|---|
| `pip install -e .` works | ✅ |
| `pytest tests/ -v` passes with golden numbers | ✅ |
| All 4 audit bugs fixed with tests | ✅ |
| Translation .mo files compile and load | ✅ |
| FastAPI serves `/docs` with Swagger UI | ✅ |
| React → FastAPI → pump → chart cycle works | ✅ |

Six boxes. None of them are "the feature works"; all of them are
"the assumption underlying the feature works." That distinction is
the entire point of Sprint 0.

## The recipe

### Step 1 — Write the gate review *first*

Before touching code, list the assertions that, if they all held,
would let you start Sprint 1 with confidence. They are usually the
form "X works at all," not "X works well."

For Sprint 0 the questions were:

- *Can a fresh clone install this package?* (Sprint 1 will break if
  not.)
- *Do my engineering calculations match a notebook the domain expert
  has signed off?* (Sprint 1 builds on these numbers.)
- *Can a browser call this Python function over HTTP?* (Sprint 1 is
  this loop times five endpoints.)

### Step 2 — Build the absolute minimum that satisfies each box

The chart in Sprint 0 is intentionally ugly. The endpoint exposes one
route. The fixtures cover one pump. The point is **coverage of the
shape**, not depth.

If you find yourself adding a "while I'm here, let me also..." feature,
stop. That feature belongs in Sprint 1. Sprint 0 is for proving the
runway is flat, not for designing the plane.

### Step 3 — Verify each box independently

Don't trust transitive proof. The fact that `pytest` passed doesn't
prove `pip install -e .` works in a fresh venv — pytest may have run
against the source tree directly. The fact that the API test passed
doesn't prove the React app can call it — that goes through a different
client and a different transport.

For each gate row, run the actual command. The Sprint 0 log carries
the receipts:

```bash
rm -rf .venv-test
python3 -m venv .venv-test
.venv-test/bin/pip install -e ".[dev]"       # box 1
.venv-test/bin/pytest tests/ -v              # boxes 2, 3, 4
.venv-test/bin/uvicorn pump.api.main:app &   # box 5: /docs returns 200
curl http://localhost:8000/api/health        # box 6: round trip
```

### Step 4 — Log deviations explicitly

When reality forces a deviation from the plan, capture it in the sprint
doc *as a deviation*, not as a silent change. Sprint 0 deviated on two
points — the Vite proxy and the bugs that turned out to be pre-fixed —
and both are recorded in the [completion log](../sprints/sprint-0-foundation.md#deviations-from-the-original-plan).

Future-you reading the sprint doc will want to know: did the plan
match reality, and if not, where? Silent deviations rot into
"why is the architecture this way?" archaeological questions six months
later.

### Step 5 — Hold the line on scope

The pressure to add scope in Sprint 0 is highest from people who don't
yet understand the project. "While you're wiring the API, can you also
add the second endpoint?" The honest answer is "the second endpoint is
Sprint 1; if I add it here, Sprint 0 takes two weeks and we don't have
a working gate before Sprint 1 begins." Use the gate review as the
deciding criterion: anything that doesn't move a checkbox is not
Sprint 0 work.

## Pitfalls

- **"It works on my machine."** Sprint 0 is the moment to find out it
  doesn't work on a clean machine. Test the install in a brand-new
  venv that has never seen the project. Better still, test it in a
  Docker container or on a CI runner.
- **Skipping the React box because "the backend works."** The backend
  working alone is a 20 % proof, not a proof. The most expensive bugs
  live in the seam between frontend and backend (units, CORS, error
  shapes). If you skip the integration box, those bugs will surface in
  Sprint 2 when you have ten more features to maintain.
- **Adding tests in Sprint 1 instead of Sprint 0.** Tests are not
  "polish" you add later. They are the executable form of the gate
  review. Without them, every change in Sprint 1 risks silently
  breaking the proof Sprint 0 just built.
- **Treating the gate as advisory.** "Five out of six is good enough,
  let's start Sprint 1." If a gate check fails, fix it before
  proceeding. The whole reason Sprint 0 is cheap is that failures
  there are small. Failures in Sprint 2 are large.
- **No deviation log.** If the plan didn't survive contact with the
  code, that's information. Capture it where it belongs (the sprint
  doc), not in a Slack message that will be unsearchable in a month.

---

## The one-line summary

> "Sprint 0 is the cheapest sprint. The cost of every later sprint is
> proportional to how much you got wrong here."
