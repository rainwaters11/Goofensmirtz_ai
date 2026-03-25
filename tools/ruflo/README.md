# Ruflo — Multi-Agent Orchestration (Dev Workflow Tool)

> ⚠️ **Ruflo is a development workflow tool. It is NOT part of the production runtime.**
> It runs only on developer machines and CI environments. It must never be imported by `apps/` or `packages/`.

---

## What is Ruflo?

Ruflo is a multi-agent orchestration system for managing complex development workflows. In Pet POV AI it is used to:

- Coordinate spec-driven development across pipeline stages
- Dispatch and monitor AI coding agents on well-scoped tasks
- Chain spec verification → implementation → review as an automated loop
- Keep agent runs isolated and auditable

---

## Directory Layout

```
tools/ruflo/
├── README.md            ← this file
├── workflows/           ← YAML workflow definitions for agent orchestration
│   ├── scaffold.yaml    ← Scaffold a new pipeline stage from a spec file
│   └── review.yaml      ← Run automated review of a completed stage
└── agents/              ← Agent role definitions (prompts + constraints)
    ├── implementer.md   ← Writes TypeScript code from a spec
    ├── reviewer.md      ← Reviews code against a spec
    └── tester.md        ← Writes and validates tests for an implementation
```

---

## How to Use Ruflo

### 1. Pick a spec

Specs live in `/specs/`. Each `.spec.md` file defines a pipeline stage — inputs, outputs, and acceptance criteria.

### 2. Run a workflow

```bash
# Example: scaffold the scene-extraction stage from its spec
ruflo run tools/ruflo/workflows/scaffold.yaml \
  --spec specs/video-processing.spec.md \
  --stage scene-extraction
```

### 3. Review an implementation

```bash
ruflo run tools/ruflo/workflows/review.yaml \
  --spec specs/narration-engine.spec.md \
  --target packages/ai/src/
```

---

## Workflow Definitions

Workflow YAML files describe the agent graph: which agents run, in what order, and how they hand off context.

```yaml
# Example: scaffold.yaml structure
name: scaffold-stage
steps:
  - agent: implementer
    input: "{{ spec }}"
    output: implementation
  - agent: tester
    input: "{{ implementation }}"
    output: tests
  - agent: reviewer
    input:
      spec: "{{ spec }}"
      implementation: "{{ implementation }}"
      tests: "{{ tests }}"
```

---

## Agent Role Files

Each `agents/*.md` file defines:
- The agent's goal
- Constraints (what it must NOT do)
- Output format requirements

These are passed as system prompts to the underlying LLM.

---

## Rules

- Ruflo workflows must never modify production database state
- All agent outputs are written to `tmp/ruflo/` (gitignored) before review
- Ruflo must be run manually — it is never triggered automatically by the production pipeline
- Keep workflow definitions simple: prefer linear chains over complex graphs

---

## Installation

Ruflo is not published to npm. Clone and use locally:

```bash
# Install Ruflo (example — adjust to actual Ruflo distribution)
git clone https://github.com/ruflo/ruflo tools/ruflo/.ruflo-core
cd tools/ruflo/.ruflo-core && npm install

# Or use npx if a published package becomes available:
# npx ruflo run ...
```

> TODO: Pin to a specific Ruflo version once the project stabilises.
