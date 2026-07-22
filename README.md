# helmwise

**Make undocumented Helm charts understandable.** helmwise renders a chart with
real Helm, traces every value in `values.yaml` to the exact Kubernetes
resources and fields it affects, and then explains and documents them.

> **Status:** early development. The project is being built in small, phased
> steps — see [the build plan](#roadmap). Most commands below are stubs today.

## Why

Most Helm charts ship with little or no documentation. A `values.yaml` can
expose hundreds of knobs with no explanation of what each does, which resource
it touches, or what breaks if you change it. Understanding one means manually
cross-referencing `values.yaml` against Go-templated manifests, `_helpers.tpl`,
and subcharts while re-running `helm template` over and over.

helmwise turns that opaque chart into a documented, validatable one.

## How it works — deterministic core, AI on top

The guiding principle: **the ground truth is always real Helm output, never a
guess from raw YAML.**

1. **Render.** helmwise shells out to `helm template`, so every analysis is
   grounded in the manifests Helm actually produces.
2. **Attribute (deterministic).** It re-renders the chart while perturbing one
   value at a time and diffs the output, attributing each changed field back to
   the value that caused it. Because Helm is deterministic (same values in →
   same manifests out), any output change is caused by the value we changed.
   This catches values that reach output *through* helpers and subcharts — not
   just direct references.
3. **Explain (AI, optional).** An LLM explains the **already-verified** map in
   plain language. It never invents chart behavior; it narrates what the
   deterministic step proved. Works with any provider via the
   [Vercel AI SDK](https://sdk.vercel.ai/), auto-detecting whichever API key is
   in your environment. The deterministic core works fully offline with **no
   key at all**.
4. **Generate & diff.** Produce the missing `values.md` docs and
   `values.schema.json`, and show the blast radius of an override before you
   apply it.

## Install / develop

Prerequisites:

- **Node.js** ≥ 18
- **pnpm** (via `corepack pnpm …`, bundled with Node)
- **Helm** — required from Phase 1 onward for rendering.
  [Install Helm](https://helm.sh/docs/intro/install/). _Not installed here yet;
  needed before running `render` and beyond._

```sh
corepack pnpm install
corepack pnpm build
node packages/cli/dist/index.js --help
```

## Usage (planned surface)

```sh
helmwise render   <chart>              # list rendered Kubernetes resources
helmwise values   <chart>              # list every leaf value + type
helmwise trace    <chart> <value.path> # which resources/fields a value touches
helmwise diff     <chart> --set k=v    # blast radius of an override
helmwise analyze  <chart>              # full value→resource coverage table
helmwise schema   <chart>              # generate values.schema.json
helmwise explain  <chart> [value.path] # AI explanation (needs an LLM key)
helmwise docs     <chart>              # generate values.md
```

## Project layout

```
packages/
  core/   @helmwise/core — the engine (no CLI/UI deps)
  cli/    helmwise        — CLI over the core
  vscode/ (Phase 7)       — VS Code extension, thin client over the core
fixtures/                 — sample charts for testing (see fixtures/README.md)
docs/                     — architecture & design notes
```

## Roadmap

Built in small phases, each ending in one runnable capability:

| Phase | Capability |
| --- | --- |
| 0 | Monorepo scaffold, CLI `--help` ✅ |
| 1 | `render` — list a chart's resources ✅ |
| 2 | `values` — flatten values into leaf paths ✅ |
| 3 | `trace` — value→resource attribution (the deterministic core) ✅ |
| 4 | `diff` — impact diffing ✅ |
| 5 | `analyze` + `schema` (no AI) |
| 6 | `explain` + `docs` (AI layer) |
| 7 | VS Code extension |

## License

**Not yet chosen.** This will be an open-source project; Apache-2.0 (the
CNCF/Helm ecosystem standard, with an explicit patent grant) is the likely
choice. Until a `LICENSE` file is added, all rights are reserved.
