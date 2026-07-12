# Test fixtures

Small Helm charts used to verify the helmwise engine throughout development.
Each one deliberately exercises a specific attribution scenario.

| Chart | Exercises |
| --- | --- |
| [`trivial/`](./trivial) | Baseline: direct `{{ .Values.x }}` references. `service.port` feeds **two** resources (Deployment + Service) — the multi-resource case. `unusedFlag` feeds **nothing** — the dead-value case (should be flagged ⚠). |
| [`with-helpers/`](./with-helpers) | Values reaching output **through** a named template in `_helpers.tpl` (e.g. `team` via `with-helpers.labels`). Perturbation catches these even though the manifests never reference the value directly. |
| [`with-subchart/`](./with-subchart) | Value propagation into a bundled subchart (`backend.*`) and a `global.*` value that reaches both parent and subchart. Confirms subchart-scoped paths are first-class. |

## Rendering by hand

Requires the `helm` binary (see the repo root README for install notes):

```sh
helm template demo ./fixtures/trivial
helm template demo ./fixtures/with-helpers
helm template demo ./fixtures/with-subchart
```

These are the exact commands the engine shells out to; running them by hand is
how we cross-check helmwise's attribution against Helm's real output.
