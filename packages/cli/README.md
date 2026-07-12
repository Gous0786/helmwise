# helmwise (CLI)

The command-line interface for helmwise. A thin layer over
[`@helmwise/core`](../core): every command maps onto a core engine function and
renders the resulting `Analysis` object (or a slice of it). The CLI holds no
analysis logic of its own.

## Conventions

- **Human output by default**, `--json` on every command for scripting/CI. The
  `--json` shape is the contract the extension and pipelines consume.
- **One file per command** under [`src/commands/`](./src/commands).
- **Offline-first:** every command except `explain`/`docs` works with no LLM
  key. AI commands print the detected provider/model, or a friendly notice when
  no key is found.

## Develop

```sh
pnpm --filter helmwise build
node dist/index.js --help
```

See the [repo root README](../../README.md) for the full command surface and
roadmap.
