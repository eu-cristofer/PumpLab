# Phase 0 — Requirements understanding and analysis
## Pump data computation library — interface project

---

## What this phase produces

By the end of Phase 0, the team has a complete picture of what exists, who it serves, what it needs to do, and what "done" looks like. Nothing is designed. Nothing is coded. Every deliverable below is a document, a diagram, or a decision record.

---

## Deliverable 1 — Library audit report

The Python library is the product. Everything else wraps it. Before any interface work begins, the team must produce a written audit that answers:

### 1.1 Public API inventory

For every public function and class in the library, document:

- Function signature with types
- What it computes (one sentence, plain language)
- Input parameters: name, type, valid range, unit, default value
- Output: what it returns, structure, units
- Dependencies on other library functions
- Known edge cases or limitations
- Whether it is tested, and against what reference (textbook formula, vendor data, field measurement)

Format: a table, one row per function. This becomes the source of truth for the API layer.

### 1.2 Computation coverage map

Map what the library can compute today against what a pump engineer needs. Identify gaps.

| Domain | What the library does | What is missing |
|--------|----------------------|-----------------|
| Pump curves | | |
| System curves | | |
| Operating point | | |
| NPSH | | |
| Affinity laws | | |
| Impeller trimming | | |
| Series/parallel operation | | |
| Specific speed | | |
| Cavitation analysis | | |
| Motor sizing | | |
| Pipe friction (Darcy-Weisbach, Hazen-Williams) | | |
| Fluid properties | | |

### 1.3 Code health assessment

- Is it installable with pip? Does pyproject.toml exist?
- Type hints: present, partial, or absent?
- Docstrings: present, partial, or absent?
- Test coverage percentage
- Dependencies list (numpy, scipy, etc.)
- Python version compatibility
- Packaging: single module, package, or loose scripts?

**Deliverable format:** Markdown document with tables, committed to the repo as `docs/library-audit.md`.

---

## Deliverable 2 — User profile and use case registry

### 2.1 Who uses this

Not personas with stock photos. Concrete answers:

- What is their job title? (pump application engineer, plant maintenance engineer, rotating equipment consultant, mechanical engineering student, pump sales engineer)
- What do they know? (can they read a pump curve? do they understand NPSH? do they know what affinity laws are?)
- What tools do they use today for the same task? (Excel, vendor selection software, hand calculation, nothing)
- Where do they work? (office, plant floor, remote site, classroom)
- What device? (desktop at office, laptop in meetings, tablet on site)

### 2.2 Use case registry

Each use case is a row:

| ID | Use case | Actor | Trigger | Input | Expected output | Priority |
|----|----------|-------|---------|-------|-----------------|----------|
| UC-01 | Select a pump for given conditions | Application engineer | New project / RFQ | Flow, head, fluid, constraints | Recommended pump(s) with curves | |
| UC-02 | Verify pump performance | Maintenance engineer | Pump underperformance | Test data, catalog curve | Comparison overlay, deviation % | |
| UC-03 | Analyze system curve | Design engineer | New piping design | Pipe layout, fittings, elevation | System H-Q curve | |
| UC-04 | Find operating point | Any engineer | Design verification | Pump curve + system curve | OP coordinates, efficiency, power | |
| UC-05 | Check NPSH margin | Application engineer | Cavitation concern | Suction conditions, pump NPSH-R | NPSH-A vs NPSH-R, margin | |
| UC-06 | Evaluate speed change | Application engineer | VFD application | Current curve, new speed | New curve via affinity laws | |
| UC-07 | Evaluate impeller trim | Application engineer | Oversized pump | Current curve, new diameter | Trimmed curve | |
| UC-08 | Compare pumps | Sales engineer | Customer selection | Multiple pump curves | Overlay chart with comparison table | |
| UC-09 | Generate report | Any engineer | Client deliverable | Complete analysis | PDF report with charts and data | |
| UC-10 | Learn pump fundamentals | Student | Coursework | Conceptual parameters | Interactive educational diagrams | |

Priority is assigned by the project owner, not assumed.

**Deliverable format:** Markdown document, committed as `docs/use-cases.md`.

---

## Deliverable 3 — Technical concept documentation with flowcharts

This is what makes the project educational and professional. Every major computation domain gets a concept page with:

- What it is (plain language explanation)
- Why it matters (engineering context)
- The math (equations with variable definitions)
- A flowchart showing the computation logic
- How it maps to library functions

### Domains to document:

1. **Pump performance curves** — H-Q, efficiency-Q, power-Q, NPSH-R-Q
2. **System resistance curves** — static head, friction losses, minor losses
3. **Operating point determination** — pump-system intersection
4. **NPSH analysis** — available vs required, margin calculation
5. **Affinity laws** — speed variation, diameter variation
6. **Specific speed and pump type selection** — Ns, Nss, classification
7. **Series and parallel pump operation** — combined curves
8. **Pipe hydraulics** — Darcy-Weisbach, Moody diagram, fitting K-factors

Each concept page follows the same template:

```markdown
# [Concept name]

## What it is
[2-3 sentences, no jargon]

## Engineering context
[When and why an engineer uses this calculation]

## Governing equations
[LaTeX or Unicode math, with every variable defined]

## Computation flowchart
[Reference to the SVG/diagram file]

## Library mapping
| Step in flowchart | Library function | Module |
|-------------------|-----------------|--------|
| ... | ... | ... |

## Assumptions and limitations
[What the library assumes, where it breaks down]

## References
[Textbook, standard, or paper that validates the approach]
```

**Deliverable format:** One markdown file per domain in `docs/concepts/`, with accompanying flowchart diagrams. These become both internal documentation and user-facing help content in the application.

---

## Deliverable 4 — Data requirements specification

### 4.1 Input data catalog

| Data item | Source | Format | Persistence | Shared? |
|-----------|--------|--------|-------------|---------|
| Pump curve coefficients | User input or import | Polynomial coefficients or point pairs | Per project | No |
| Rated conditions | User input | Single values | Per project | No |
| System parameters | User input | Single values | Per project | No |
| Pipe schedule data | Built-in database | Lookup table | Static | Yes |
| Fluid property tables | Built-in database | Lookup table | Static | Yes |
| Fitting K-factors | Built-in database | Lookup table | Static | Yes |
| Pump catalog | Optional database | Structured records | Persistent | Yes |
| Test data | User import | CSV or manual entry | Per project | No |

### 4.2 Output data catalog

| Output | Format | Destination |
|--------|--------|-------------|
| Curve plot data | Arrays of (x, y) points | Chart component |
| Operating point | Single (flow, head, eff, power) | Display panel |
| NPSH margin | Single value + status | Display panel |
| Comparison table | Tabular data | Table component |
| Report | PDF with embedded charts | File download |
| Project file | Serialized state | Save/load |

### 4.3 Project file specification

Define what a "saved project" contains:

- All input parameters
- Pump curve data (coefficients or points)
- System configuration
- Calculation results (or ability to recompute)
- Chart view state (zoom, overlays, annotations)
- File format: JSON (human readable, version controlled) or binary
- Versioning scheme for backward compatibility

**Deliverable format:** Markdown document, committed as `docs/data-requirements.md`.

---

## Deliverable 5 — Dual-target architecture decision record

The project ships as a standalone desktop application AND a web application simultaneously. This is an architectural decision with consequences that must be understood before design begins.

### Questions to resolve:

**Shared core:**
- The Python library is the computation engine for both targets. How is it packaged?
- Is there a shared API layer that both targets consume, or does the desktop app call the library directly?

**Desktop application:**
- Framework choice: Electron + Python subprocess? Tauri + Python sidecar? PyQt/PySide? Tkinter? Dear PyGui?
- How does the desktop app bundle the Python runtime?
- Does it need to work fully offline?
- Installation mechanism: installer (.exe, .dmg, .deb), portable executable, or pip install?
- Auto-update mechanism?

**Web application:**
- Backend framework: FastAPI, Flask, Django?
- Frontend framework: React, Vue, plain HTML/JS?
- Hosting: self-hosted, cloud, static + API, or serverless?
- Authentication required?

**Shared vs divergent UI:**
- Is the interface identical on both platforms, or does each have platform-specific patterns?
- If shared: is the desktop app actually a web view (Electron/Tauri) running the same frontend?
- If divergent: how much design work doubles?

**Recommended evaluation approach:**

Build a decision matrix:

| Criterion | Weight | Option A (Electron + React) | Option B (Tauri + React) | Option C (PyQt desktop + React web) |
|-----------|--------|---------------------------|------------------------|-------------------------------------|
| Code sharing between targets | | | | |
| Offline capability | | | | |
| Installation size | | | | |
| Development speed | | | | |
| Team skill match | | | | |
| Long-term maintenance | | | | |
| Performance (chart rendering) | | | | |
| Python integration ease | | | | |

**Do not choose a stack in Phase 0.** Produce the decision matrix with scored options. The decision is made at the Phase 0 gate review with full context.

**Deliverable format:** Architecture decision record (ADR) in `docs/adr/001-dual-target-architecture.md`.

---

## Deliverable 6 — Non-functional requirements with acceptance criteria

No vague statements. Every requirement has a measurable threshold.

| ID | Category | Requirement | Acceptance criterion | Applies to |
|----|----------|-------------|---------------------|------------|
| NFR-01 | Performance | Curve computation response time | < 200ms for single pump curve (50 points) | Both |
| NFR-02 | Performance | Chart rendering time | < 500ms to render interactive chart | Both |
| NFR-03 | Performance | Slider interaction latency | < 100ms to update curve on parameter change | Both |
| NFR-04 | Usability | Unit switching | All values update instantly when switching SI ↔ Imperial | Both |
| NFR-05 | Usability | Learning curve | New user completes first pump curve in < 5 minutes without help | Both |
| NFR-06 | Reliability | Calculation accuracy | Results within 2% of validated reference data | Both |
| NFR-07 | Portability | Offline operation | Full computation capability without internet | Desktop |
| NFR-08 | Portability | Browser support | Chrome, Firefox, Safari, Edge (latest 2 versions) | Web |
| NFR-09 | Portability | OS support | Windows 10+, macOS 12+, Ubuntu 22+ | Desktop |
| NFR-10 | Data | Project save/load | Save and reload complete project state without data loss | Both |
| NFR-11 | Data | Export formats | Charts exportable as PNG, SVG. Data exportable as CSV | Both |
| NFR-12 | Packaging | Desktop install size | < 200 MB installed | Desktop |
| NFR-13 | Packaging | Desktop install steps | < 5 clicks from download to running | Desktop |
| NFR-14 | Documentation | API coverage | 100% of public functions documented with examples | Both |
| NFR-15 | Documentation | Concept coverage | All computation domains have concept pages with flowcharts | Both |

**Deliverable format:** Table in `docs/nfr.md`, reviewed and signed off.

---

## Deliverable 7 — Interface requirements (not design)

This is NOT wireframes. This is a list of what the interface must contain, organized by function. The design team uses this to create layouts in Phase 1.

### 7.1 Input requirements

For each input parameter, specify:
- Label (user-facing name)
- Unit options (m³/h, GPM, L/s for flow)
- Valid range
- Default value
- Input method (text field, slider, dropdown, file upload)
- Grouped with which other inputs
- Tooltip help text

### 7.2 Output requirements

For each output, specify:
- What is displayed (chart, number, table, status indicator)
- Update trigger (on input change, on button click, on tab switch)
- Precision (decimal places)
- Color coding rules (green/yellow/red for NPSH margin)
- Export capability needed

### 7.3 Chart requirements

For each chart type:
- Axes: what quantity, what unit, what range behavior (auto, fixed, user-set)
- Curves: how many overlays, how distinguished (color, line style, thickness)
- Interactivity: hover tooltip content, click behavior, zoom/pan, drag-to-adjust
- Annotations: operating point marker, BEP marker, NPSH limit line
- Legend: position, content, toggle visibility

### 7.4 Navigation and workflow requirements

- How does the user move between tasks? (tabs, sidebar, wizard, free-form)
- Is there a project concept? (new, open, save, save-as)
- Undo/redo needed?
- Print / export workflow

**Deliverable format:** Markdown document, committed as `docs/interface-requirements.md`.

---

## Deliverable 8 — Project glossary and unit standard

### 8.1 Glossary

Every domain term used in the interface, the documentation, or the code must be defined. Engineers from different traditions use different terms for the same thing.

| Term | Definition | Also known as |
|------|-----------|---------------|
| Head | Energy per unit weight of fluid, expressed as height of fluid column (m or ft) | Total dynamic head, TDH |
| Flow rate | Volume of fluid per unit time | Capacity, Q, discharge |
| NPSH | Net Positive Suction Head — energy available (A) or required (R) at pump suction to prevent cavitation | |
| BEP | Best Efficiency Point — flow rate at which pump efficiency is maximum | |
| Shutoff head | Head at zero flow | Dead head |
| Runout | Maximum flow the pump can deliver | End of curve |
| Affinity laws | Relationships between speed, flow, head, and power for geometrically similar conditions | Fan laws, pump laws |
| System curve | Relationship between flow rate and total system resistance (static + friction) | System head curve |
| Specific speed | Dimensionless number classifying pump type by impeller geometry | Ns, Nss (suction specific speed) |

Expand as needed. This glossary appears in the application help system.

### 8.2 Unit standard

| Quantity | SI primary | SI alternatives | Imperial primary | Imperial alternatives |
|----------|-----------|-----------------|-----------------|----------------------|
| Flow rate | m³/h | L/s, m³/s | GPM (US) | GPM (UK), CFM |
| Head | m | kPa (as pressure) | ft | psi (as pressure) |
| Power | kW | W, HP (metric) | HP | BHP |
| Speed | RPM | rad/s | RPM | |
| Diameter | mm | m | inches | |
| Length | m | mm, km | ft | inches |
| Pressure | kPa | bar, Pa, atm | psi | inHg, ftH₂O |
| Temperature | °C | K | °F | °R |
| Viscosity | cSt | Pa·s, cP | SSU | SUS |
| Density | kg/m³ | | lb/ft³ | specific gravity |

The library must define which unit system it uses internally. The interface converts on display. Conversions are never approximate.

**Deliverable format:** Markdown document, committed as `docs/glossary-and-units.md`.

---

## Deliverable 9 — Risk register and open questions

### 9.1 Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-01 | Library accuracy not validated against standards | ? | High | Validate against ISO 9906 test data or published pump curves before building interface |
| R-02 | Desktop packaging increases development time 2-3x | Medium | High | Evaluate Tauri/Electron early with a proof-of-concept before committing |
| R-03 | Real-time chart interaction too slow with Python computation | Low | Medium | Profile library performance with benchmark inputs, consider caching or pre-computation |
| R-04 | Dual-target maintenance burden exceeds team capacity | Medium | High | Maximize shared code (same frontend for both), minimize platform-specific code |
| R-05 | Scope creep into full pump selection software | High | Medium | Lock MVP scope at Phase 0 gate, defer catalog/database features |
| R-06 | No pump database means limited utility for selection use case | Medium | Medium | Define minimum viable data entry workflow, plan database as Phase 2 |

### 9.2 Open questions

| ID | Question | Owner | Deadline | Resolution |
|----|----------|-------|----------|------------|
| OQ-01 | Does the library handle non-water fluids? | | | |
| OQ-02 | What curve fitting method is used? (polynomial order, least squares, spline) | | | |
| OQ-03 | Are there existing pump databases we can integrate? | | | |
| OQ-04 | Who is the primary target user for v1.0? | | | |
| OQ-05 | Is there budget for a code signing certificate (desktop installer)? | | | |
| OQ-06 | Do we need to support reading vendor-specific data formats? | | | |
| OQ-07 | Is multi-language support needed for v1.0? | | | |

**Deliverable format:** Living document in `docs/risks-and-questions.md`, updated throughout the project.

---

## Deliverable 10 — MVP scope definition

Before leaving Phase 0, the project owner must sign off on exactly what v1.0 includes.

### In scope (must ship):
- [ ] (filled from use case priority ranking)
- [ ] (filled from use case priority ranking)
- [ ] (filled from use case priority ranking)

### Deferred to v1.1 or later:
- [ ] (filled from use case priority ranking)
- [ ] (filled from use case priority ranking)

### Explicitly out of scope:
- [ ] (list what will NOT be built, to prevent scope creep)

### Definition of done for MVP:
- All "in scope" use cases work end-to-end on both desktop and web
- All concept documentation pages complete with flowcharts
- Library API documentation complete with examples
- User can save and load projects
- User can export charts and data
- Desktop installer works on Windows and macOS
- Web application deploys to [hosting target]
- 10 beta users have tested and provided feedback

**Deliverable format:** Markdown document, committed as `docs/mvp-scope.md`. Signed off at Phase 0 gate review.

---

## Phase 0 gate checklist

| # | Deliverable | Status | Reviewer |
|---|------------|--------|----------|
| 1 | Library audit report | | |
| 2 | User profile and use case registry | | |
| 3 | Technical concept documentation with flowcharts | | |
| 4 | Data requirements specification | | |
| 5 | Dual-target architecture decision record | | |
| 6 | Non-functional requirements | | |
| 7 | Interface requirements | | |
| 8 | Glossary and unit standard | | |
| 9 | Risk register and open questions | | |
| 10 | MVP scope definition | | |

**Gate rule: no design or implementation work begins until all deliverables are reviewed and the MVP scope is signed off.**