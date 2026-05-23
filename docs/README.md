# PumpLab — Project documentation

## Folder structure

```
pumplab-docs/
├── README.md                          ← you are here
│
├── phase-0/
│   └── requirements.md                Phase 0 deliverable checklist & templates
│
├── phase-1/
│   ├── requirements.md                58 functional + non-functional requirements
│   ├── hld.md                         High-level design: MoSCoW, data flow, journeys
│   │
│   ├── sprints/
│   │   ├── sprint-0-foundation.md     Kill risks, packaging, first test, stack proof
│   │   ├── sprint-1-hot-path.md       Input → curves → tolerance → verdict
│   │   └── sprint-2-ship-it.md        MRT, reports, project save, desktop, deploy
│   │
│   └── guides/
│       └── development-workflow.md    How to run sprints with Claude toolchain
│
├── concepts/                          (populated from your existing concept docs)
│
└── adr/                               Architecture decision records
```

## How to use this

1. Read `phase-1/guides/development-workflow.md` first — it teaches you the sprint rhythm
2. Open the current sprint file from `phase-1/sprints/`
3. Work through tasks in order, checking them off as you go
4. At each sprint gate, verify all acceptance criteria before moving on
