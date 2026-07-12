import type { Command } from 'commander';
import pc from 'picocolors';

/**
 * Registers the helmwise subcommands on the root program.
 *
 * During Phase 0 every command is a documented stub that prints which build
 * phase implements it. Each phase replaces its stub with a real command
 * module under this folder (one file per command).
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

  program
    .command('render')
    .description('Render a chart and list its Kubernetes resources')
    .argument('<chart>', 'path to the Helm chart directory')
    .action(stub('render', 1));

  program
    .command('values')
    .description('List every leaf value as a dotted path with type and default')
    .argument('<chart>', 'path to the Helm chart directory')
    .action(stub('values', 2));

  program
    .command('trace')
    .description('Show which resources and fields a single value flows into')
    .argument('<chart>', 'path to the Helm chart directory')
    .argument('<value.path>', 'dotted value path, e.g. image.tag')
    .action(stub('trace', 3));

  program
    .command('diff')
    .description('Show which resources and fields change between two value sets')
    .argument('<chart>', 'path to the Helm chart directory')
    .action(stub('diff', 4));

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
