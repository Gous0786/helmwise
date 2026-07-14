// `helmwise` CLI entry point. Thin command layer over @helmwise/core: every
// command maps onto a core engine function and renders the resulting
// Analysis object (or a slice of it). The CLI holds no analysis logic of its
// own — that lives in the core so the VS Code extension can reuse it
// verbatim.
import { Command } from 'commander';
import { VERSION as CORE_VERSION } from '@helmwise/core';
import { registerCommands } from './commands/index.js';

const program = new Command();

program
  .name('helmwise')
  .description(
    'Make undocumented Helm charts understandable: trace every value to the\n' +
      'Kubernetes resources it affects, then explain and document them.',
  )
  .version(CORE_VERSION, '-v, --version', 'print the helmwise version')
  .showHelpAfterError();

registerCommands(program);

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
