# Architecture

> Living document. Expanded as each phase lands.

## Principle: deterministic core, AI on top

The one idea everything follows from: **the ground truth is always real Helm
output.** helmwise never guesses chart behavior from raw YAML. It renders the
chart with `helm template`, derives everything from the real manifests, and
only then lets an LLM *narrate* what was already verified.

This is what separates helmwise from a generic "chat with your YAML" tool:
accuracy is anchored in Helm's own output.

## Packages and data flow

```
                 ┌─────────────────────────────────────────────┐
                 │              @helmwise/core                  │
                 │                                              │
  helm binary ◄──┤  helm/      render → RenderedResource[]      │
                 │  values/    flatten values.yaml → LeafValue[]│
                 │  attribute/ perturb + diff → AttributionMap  │  (deterministic)
                 │  diff/      impact diffing                   │
                 │  ai/        explain / docs / schema          │  (AI, optional)
                 │  analysis.ts  ──►  Analysis  (serializable)  │
                 └───────────────┬─────────────────┬────────────┘
                                 │                 │
                    ┌────────────▼───┐    ┌────────▼──────────────┐
                    │  packages/cli  │    │  packages/vscode      │
                    │  renders       │    │  renders the SAME     │
                    │  Analysis      │    │  Analysis object      │
                    └────────────────┘    └───────────────────────┘
```

Data flows one direction. The engine produces a single serializable
[`Analysis`](../packages/core/src/types.ts) object; **both surfaces are
renderers of that same object.** Neither re-derives analysis, so they can never
disagree — the acceptance test for the extension is that its numbers match the
CLI's for the same chart.

## The `Analysis` contract

The central data structure. See
[`packages/core/src/types.ts`](../packages/core/src/types.ts) for the
authoritative definition. It is deliberately plain JSON so it can be cached to
disk and cross the extension process boundary unchanged.

Key fields:

- `values: LeafValue[]` — the atomic units of attribution.
- `resources: RenderedResource[]` — what Helm rendered from defaults.
- `map: AttributionMap` — the bidirectional value↔resource map (deterministic).
- `explanations?` — AI output; **absent** when no LLM key is present.
- `warnings[]` — skipped values, helm stderr, etc. Never silently dropped.

## Why perturbation for attribution

Static template parsing (following `.Values.x` through Go templates, helpers,
`tpl`, ranges) is brittle. Instead the engine treats Helm as a black box:

1. Render a baseline from default values.
2. For each leaf value, re-render with that one value perturbed.
3. Structurally diff against the baseline; every changed field is attributed to
   that value.

Because Helm is deterministic, any output change *must* be caused by the value
we changed — so the mapping is grounded, and it captures values that reach
output through helpers and subcharts for free (we look at output, not
templates). The cost is N+1 renders per chart, which is parallelized and cached
by `(chart digest, value set)`.

## AI layer

Built on the [Vercel AI SDK](https://sdk.vercel.ai/) for one vendor-agnostic
API across Anthropic / Google / OpenAI / others. Provider is auto-detected from
whichever key is in the environment. Prompts are constructed *from the verified
attribution map*, so explanations stay tied to real behavior rather than
hallucinating from YAML.

## Comment style

Modeled on how Zod, the TypeScript compiler, and Vite document their own
source (verified against real files, not just style guides):

- **Document the contract, not every line.** A TSDoc comment (`/** */`) goes
  on exported functions/types and on anything whose behavior isn't obvious
  from its name and signature. Trivial passthroughs and self-explanatory
  fields don't need one.
- **Prose over tags.** Explain behavior in 1–3 sentences first. Add
  `@returns`/`@throws` only when the contract genuinely isn't obvious from the
  type signature — never `@param` that just repeats the parameter's name and
  type.
- **Imperative summary line** — "Render a chart…", "Resolve the `helm`
  executable…", not "Renders…"/"This function renders…".
- **`@packageDocumentation`** only on a package's true entry point (e.g.
  `packages/core/src/index.ts`), never on internal modules.
- **`//` explains *why*, never *what*.** If a comment just restates the code
  in words, delete it. Use it for non-obvious rationale, workarounds, or
  invariants a reader could otherwise miss.
