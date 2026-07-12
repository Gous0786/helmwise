# @helmwise/core

The helmwise engine. Deterministic Helm analysis — rendering, value→resource
attribution, impact diffing — plus an optional AI explanation layer.

This package has **no CLI or UI dependencies**. It exposes a small set of
documented functions that return the single serializable [`Analysis`](./src/types.ts)
object, which both the CLI and the VS Code extension render. Keeping all
analysis logic here is what keeps the two surfaces consistent: neither
re-implements the engine.

## Public surface

The barrel [`src/index.ts`](./src/index.ts) is the only entry point consumers
should import from. It grows one phase at a time:

- `analyze(chartPath, options)` → `Analysis` — the top-level orchestrator (Phase 5).
- Types: `Analysis`, `LeafValue`, `RenderedResource`, `AttributionMap`, `Explanation`, …

## Design rules

- **Serializable output only.** The `Analysis` object must survive a cache
  round-trip and the extension process boundary. No classes or methods on
  returned data — see the note in [`src/types.ts`](./src/types.ts).
- **Deterministic first.** Rendering, attribution, diffing, and schema *types*
  require no API key. AI is strictly additive.
- **TSDoc on every export**, so the API is self-documenting for contributors.

## Scripts

```sh
pnpm --filter @helmwise/core build      # bundle with tsup
pnpm --filter @helmwise/core test       # vitest
pnpm --filter @helmwise/core typecheck  # tsc --noEmit
```
