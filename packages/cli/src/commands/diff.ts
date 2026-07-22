import type { Command } from 'commander';
import pc from 'picocolors';
import { diffImpact, type FieldChange } from '@helmwise/core';
import { collectSet, collectValues, reportError } from '../util.js';

interface DiffOptions {
  from: string[];
  to: string[];
  set: Record<string, string>;
  exitCode?: boolean;
  json?: boolean;
}

/** Group changes by resource, preserving order within each resource. */
function groupByResource(changes: FieldChange[]): Map<string, FieldChange[]> {
  const grouped = new Map<string, FieldChange[]>();
  for (const c of changes) {
    const list = grouped.get(c.resource) ?? [];
    list.push(c);
    grouped.set(c.resource, list);
  }
  return grouped;
}

/** Colorize a change kind: added=green, removed=red, changed=yellow. */
function markKind(kind: FieldChange['kind']): string {
  if (kind === 'added') return pc.green('+ added  ');
  if (kind === 'removed') return pc.red('- removed');
  return pc.yellow('~ changed');
}

/**
 * Register the `diff` command: show which rendered resources and fields change
 * between two value sets — the blast radius of an override before you apply it.
 *
 * By default the baseline is the chart's own defaults and the comparison side
 * is those defaults plus any `--set` / `-f` overrides, answering "what does my
 * change do?". Use `--from` / `--to` to compare two explicit values-file sets.
 */
export function registerDiff(program: Command): void {
  program
    .command('diff')
    .description('Show which resources and fields change between two value sets')
    .argument('<chart>', 'path to the Helm chart directory')
    .option(
      '--from <file>',
      'baseline values file (repeatable; default: chart defaults)',
      collectValues,
      [],
    )
    .option(
      '--to <file>',
      'comparison values file (repeatable)',
      collectValues,
      [],
    )
    .option(
      '--set <key=value>',
      'inline override applied to the comparison side (repeatable)',
      collectSet,
      {},
    )
    .option('--exit-code', 'exit non-zero if any field changed (for CI)')
    .option('--json', 'output the diff as JSON')
    .action(async (chart: string, options: DiffOptions) => {
      try {
        const result = await diffImpact(
          chart,
          { valuesFiles: options.from },
          { valuesFiles: options.to, setValues: options.set },
        );

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else if (!result.changed) {
          console.log(pc.dim('No changes.'));
        } else {
          const grouped = groupByResource(result.changes);
          console.log(
            pc.dim(
              `${result.changes.length} field${result.changes.length === 1 ? '' : 's'} changed across ${grouped.size} resource${grouped.size === 1 ? '' : 's'}:`,
            ),
          );
          for (const [resource, changes] of grouped) {
            console.log(`  ${pc.bold(resource)}`);
            for (const c of changes) {
              const path = c.fieldPath === '' ? '(whole resource)' : c.fieldPath;
              console.log(`    ${markKind(c.kind)} ${path}`);
            }
          }
        }

        if (options.exitCode && result.changed) {
          process.exitCode = 1;
        }
      } catch (err) {
        reportError(err);
      }
    });
}
