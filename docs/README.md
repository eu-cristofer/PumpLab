# PumpLab — Project Documentation

Welcome to the PumpLab project documentation. This directory contains architectural decisions, domain concepts, project requirements, and sprint plans.

## 📂 Folder Structure

The structure below reflects the actual organization of the `docs/` directory:

```text
docs/
├── README.md                      ← You are here
│
├── adr/                           Architecture Decision Records (ADRs)
│   └── 001-dual-target-architecture.md
│
├── concepts/                      Domain knowledge and engineering principles
│   ├── 01-pump-performance-curves.md
│   ├── 02-system-resistance-curves.md
│   └── ... (8 concepts total)
│
├── phase0/                        Initial discovery, scoping, and library audit
│   ├── phase0_requirements.md     Phase 0 deliverable checklist & templates
│   ├── mvp-scope.md               Minimum Viable Product scope definition
│   └── ... 
│
└── phase1/                        Implementation phase documentation
    ├── development-workflow.md    How to run sprints and development guidelines
    ├── guides/
    │   └── phase1_requirements.md 58 functional + non-functional requirements
    └── sprints/
        ├── sprint-0-foundation.md Kill risks, packaging, first test, stack proof
        ├── sprint-1-hot-path.md   Input → curves → tolerance → verdict
        └── sprint-2-ship-it.md    MRT, reports, project save, desktop, deploy
```

## 🚀 How to use this

1. **New to the project domain?** 
   Start with the [`concepts/`](./concepts/) directory to learn the fundamental engineering concepts behind PumpLab.
2. **Looking to contribute?** 
   Read [`phase1/development-workflow.md`](./phase1/development-workflow.md) first — it establishes the sprint rhythm and development practices.
3. **Working on a sprint?** 
   Open the current sprint file from [`phase1/sprints/`](./phase1/sprints/). Work through tasks in order, checking them off as you go. At each sprint gate, verify all acceptance criteria before moving on.
4. **Wondering why a technical decision was made?**
   Check the [`adr/`](./adr/) (Architecture Decision Records) folder for the historical context of major design choices.
