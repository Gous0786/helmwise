import type { Command } from 'commander';
import pc from 'picocolors';
import { registerRender } from './render.js';
import { registerValues } from './values.js';
import { registerTrace } from './trace.js';
import { registerDiff } from './diff.js';

/**
 * Registers the helmwise subcommands on the root program.
 *
 * Commands are implemented one build phase at a time. Implemented commands
 * live in their own module under this folder; the rest are documented stubs
 * that print which phase will deliver them.
 */
export function registerCommands(program: Command): void {
  const stub =
    (name: string, phase: number) =>
    (): void => {
      console.log(
        pc.yellow(
          `helmwise ${name}: not implemented yet — arrives in Phase ${phase}.`,
        ),
      );
      process.exitCode = 2;
    };

  // Phase 1
  registerRender(program);

  // Phase 2
  registerValues(program);

  // Phase 3
  registerTrace(program);

  // Phase 4
  registerDiff(program);

  program
    .command('analyze')
    .description('Full value→resource coverage analysis of a chart')
    .argument('<chart>', 'path to the Helm chart directory')
    .action(stub('analyze', 5));

  program
    .command('schema')
    .description('Generate a values.schema.json for the chart')
    .argument('<chart>', 'path to the Helm chart directory')
    .action(stub('schema', 5));

  program
    .command('explain')
    .description('AI explanation of a value, grounded in the attribution map')
    .argument('<chart>', 'path to the Helm chart directory')
    .argument('[value.path]', 'dotted value path; omit to explain all values')
    .action(stub('explain', 6));

  program
    .command('docs')
    .description('Generate human-readable values documentation (Markdown)')
    .argument('<chart>', 'path to the Helm chart directory')
    .action(stub('docs', 6));
}
