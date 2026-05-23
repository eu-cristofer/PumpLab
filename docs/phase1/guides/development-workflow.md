# Development workflow guide
## How to conduct sprints with the Claude toolchain

---

## The rhythm

Every sprint follows the same cycle. Learn this rhythm and it becomes muscle memory.

```
Plan → Build → Verify → Review → Gate
 │       │        │        │       │
 │       │        │        │       └─ All checks pass? → next sprint
 │       │        │        └─ Read your own code. Does it make sense?
 │       │        └─ Run tests. Does it actually work?
 │       └─ Write code. One task at a time.
 └─ Read the sprint file. Know what you're building today.
```

---

## Before you start each day

1. Open the current sprint file (`sprints/sprint-N-*.md`)
2. Find the first unchecked task
3. Read its acceptance criteria — these are your "done" conditions
4. Read the Claude Code prompt — this is your starting point
5. Open your terminal

---

## The build cycle for a single task

### Step 1: Understand before you build

Read the requirement. Read the acceptance criteria. If you don't understand what something means (e.g. "API 610 tolerance band"), go to the concept doc in `concepts/`. The concept docs exist so you understand the engineering before you write the code.

Ask yourself: "If someone gave me the finished result, how would I verify it's correct?" That's your test.

### Step 2: Start Claude Code

Open your terminal in the project root:

```bash
claude
```

Claude Code reads your `CLAUDE.md` file automatically. It knows the project structure, the rules, and the conventions. If `CLAUDE.md` doesn't exist yet, create it in Sprint 0 (copy the template from the HLD).

### Step 3: Give Claude Code the task

Don't paste the entire sprint file. Give it the specific task. The sprint files include Claude Code prompts for each task — use them as a starting point, then adjust based on what you see.

**Good prompt pattern:**
```
Read [specific file]. Then [specific action]. The acceptance criteria are:
1. [criterion 1]
2. [criterion 2]
Verify by [test method].
```

**Bad prompt pattern:**
```
Build the input screen.
```

The difference: specificity. Claude Code works best when it knows exactly what files to read, what to produce, and how to verify.

### Step 4: Review what Claude Code produces

This is the most important step. Do not skip it.

Read every line Claude writes. You are learning to be a software engineer, and reading code is how you learn. For each file Claude creates or modifies, ask yourself:

- Do I understand what this code does?
- Does it match the acceptance criteria?
- Would I be able to explain this to someone else?
- Are there any hard-coded values that should be configurable?
- Are there any missing error cases?

If you don't understand something, ask Claude Code:
```
Explain what this function does line by line: [paste the function]
```

### Step 5: Test it

Run the tests:
```bash
pytest tests/ -v
```

Run the app and try it manually:
```bash
# Terminal 1: API
uvicorn pump.api.main:app --reload

# Terminal 2: Frontend
cd PumpLabGUI && npm run dev
```

Try to break it. Enter invalid data. Leave fields empty. Enter extremely large numbers. Click buttons in the wrong order. If it breaks, you found a bug before your users did.

### Step 6: Commit

If it works and passes all acceptance criteria:

```bash
git add -A
git commit -m "feat: [short description of what you built]"
```

**Commit message format:**
- `feat: add design point input form with validation`
- `fix: handle missing attributes in PerformanceChecker`
- `test: add golden numbers fixture for curve fitting`
- `docs: complete pump performance curves concept page`
- `chore: add pyproject.toml with pinned dependencies`

One commit per task. Don't batch multiple tasks into one commit.

### Step 7: Check off the acceptance criteria

Go back to the sprint file. Check the boxes for every criterion that passes. If any criterion fails, fix it before moving to the next task.

---

## Git workflow

### Branching strategy (keep it simple)

```
main ─────────────────────────────────────────────────
  │                                         │
  └── sprint-0 ──── merge ──────────────────┘
                        │
                        └── sprint-1 ──── merge ────
                                              │
                                              └── sprint-2 ──── merge → v1.0 tag
```

One branch per sprint. Merge to main at each sprint gate.

```bash
# Start a sprint
git checkout main
git checkout -b sprint-0

# Work on tasks, commit each one
git add -A && git commit -m "feat: ..."

# At sprint gate (all checks pass)
git checkout main
git merge sprint-0
git tag sprint-0-complete
git push origin main --tags
```

### When things go wrong

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all uncommitted changes
git checkout -- .

# See what changed
git diff
git log --oneline -10
```

---

## Using Claude's tools effectively

### Claude Code (terminal) — for implementation

Use when: writing code, fixing bugs, creating files, running tests, refactoring.

```bash
# Start a session
claude

# Give it context
> Read pump/core/performance_curve.py and tests/test_golden_numbers.py.
> The fit() method doesn't handle the case where all test points have
> the same flow rate. Add a guard that raises ValueError with a clear message.
> Write a test for it.
```

**Tips:**
- Always tell it which files to read first
- Give it the acceptance criteria from the sprint file
- Ask it to run tests after making changes
- Ask it to explain code you don't understand

### Claude Design (browser) — for UI

Use when: designing screens, experimenting with layouts, prototyping interactions.

```
Link your repo (PumpLabGUI/ subdirectory).
Then: "Design the verdict screen for a pump FAT analysis tool.
It shows a table of guarantee points with measured vs rated values,
deviation percentages, and PASS/FAIL badges. Color: green for pass,
red for fail. Overall verdict at the top: ACCEPTED or REJECTED.
Style: clean, technical, data-dense."
```

Then hand off to Claude Code when the design is right.

### Claude Chat (this interface) — for planning and learning

Use when: thinking through architecture, understanding concepts, reviewing plans, asking "how does X work?"

Don't use Claude Chat for writing code that goes into your project. Use Claude Code for that — it has your repo context.

---

## How to handle being stuck

It will happen. Here's the escalation path:

### Level 1: Read the error message
Most error messages tell you exactly what's wrong. Read the full traceback, not just the last line.

### Level 2: Ask Claude Code
```
> I'm getting this error: [paste full traceback]
> This happens when I [describe what you did]
> The expected behavior is [what should happen]
```

### Level 3: Isolate the problem
Strip the code down to the simplest case that reproduces the error. If you can reproduce it in 5 lines, you can fix it in 5 minutes.

### Level 4: Step back and re-read the requirement
Sometimes you're stuck because you're building the wrong thing. Go back to the sprint file, re-read the acceptance criteria, and ask: "Am I solving the right problem?"

### Level 5: Take a break
Walk away for 15 minutes. Your brain processes problems in the background. The solution often appears when you stop forcing it.

---

## The CLAUDE.md file

This file lives in your repo root. Claude Code reads it automatically at the start of every session. It's your project's instruction manual for Claude. Keep it updated as the project evolves.

```markdown
# CLAUDE.md

## Project
PumpLab — API 610 centrifugal pump FAT analysis tool.

## Architecture
- pump/ — Python computation library (the core, never modify without asking)
- pump/api/ — FastAPI backend (thin wrapper over pump/)
- PumpLabGUI/src/ — React 18 frontend (shared between desktop and web)
- tests/ — pytest test suite
- docs/ — project documentation

## Rules
- All computation in Python, never duplicate in JavaScript
- REST/JSON boundary between frontend and backend
- SI units internally, conversion at display layer only
- Every public function needs a docstring
- Every bug fix needs a test that fails before and passes after

## Commands
- pytest tests/ -v — run all tests
- uvicorn pump.api.main:app --reload — run API server
- cd PumpLabGUI && npm run dev — run frontend dev server

## Current sprint
Sprint [N] — see docs/phase-1/sprints/sprint-[N]-*.md
```

---

## Quality habits

### Before every commit

1. `pytest tests/ -v` — all green?
2. Read your own diff: `git diff --staged`
3. Did you add a test for new functionality?
4. Did you update CLAUDE.md if you changed project structure?
5. Is the commit message descriptive?

### Before every sprint gate

1. Walk through the gate checklist — every box checked?
2. Run the full test suite one more time
3. Test manually: do the complete workflow from start to finish
4. Try to break it: invalid input, empty state, rapid clicking
5. Check both languages (EN and PT)

### Weekly (regardless of sprint)

1. Update the risks register if you discovered new risks
2. Update open questions if you resolved any
3. Commit your documentation changes
4. Push to remote: `git push origin [branch]`

---

## Measuring progress

Track three things per week:

1. **Tasks completed** — how many sprint tasks are checked off
2. **Tests passing** — total count of green tests
3. **Bugs found** — how many issues you caught before they shipped

Don't track hours worked. Track outcomes.

A good week: 3 tasks completed, 5 new tests passing, 2 bugs caught.
A bad week: 0 tasks completed. (Ask yourself: was I stuck? On what? Why?)

---

## The mindset

You are not asking Claude to build your product for you. You are building your product with Claude as a tool. The difference matters.

- Claude Code writes the code. You understand it.
- Claude Code runs the tests. You interpret the results.
- Claude Code suggests architecture. You make the decisions.
- Claude Code produces output. You verify it's correct.

Every time you skip the "understand" step, you accumulate debt. Every time you review carefully, you accumulate skill. There are no shortcuts.

The goal is not to ship PumpLab. The goal is to become someone who can ship products like PumpLab. PumpLab is the vehicle, not the destination.
