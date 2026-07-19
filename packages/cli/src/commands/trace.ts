import type { Command } from 'commander';
import pc from 'picocolors';
import { traceValue, type FieldRef } from '@helmwise/core';
import { collectSet, collectValues, reportError } from '../util.js';

interface TraceOptions {
  values: string[];
  set: Record<string, string>;
  json?: boolean;
}

/** Group attributed fields by their resource, preserving field order. */
function groupByResource(fields: FieldRef[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const f of fields) {
    const list = grouped.get(f.resource) ?? [];
    list.push(f.fieldPath);
    grouped.set(f.resource, list);
  }
  return grouped;
}

/**
 * Register the `trace` command: show exactly which rendered resources and
 * fields a single value flows into. This is the deterministic core surfaced —
 * the attribution is grounded in real Helm output via perturbation.
 */
export function registerTrace(program: Command): void {
  program
    .command('trace')
    .description('Show which resources and fields a single value flows into')
    .argument('<chart>', 'path to the Helm chart directory')
    .argument('<value.path>', 'dotted value path, e.g. image.tag')
    .option(
      '-f, --values <file>',
      'values file to layer on defaults (repeatable)',
      collectValues,
      [],
    )
    .option(
      '--set <key=value>',
      'inline value override (repeatable)',
      collectSet,
      {},
    )
    .option('--json', 'output the trace result as JSON')
    .action(async (chart: string, valuePath: string, options: TraceOptions) => {
      try {
        const result = await traceValue(chart, valuePath, {
          valuesFiles: options.values,
          setValues: options.set,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        const header = `${pc.cyan(result.path)} ${pc.dim(`(${result.leaf.type})`)}`;

        if (result.dead) {
          console.log(header);
          console.log(
            pc.yellow(
              '  ⚠ dead value — perturbing it changed no rendered output. ' +
                'No template appears to use it.',
            ),
          );
          return;
        }

        const grouped = groupByResource(result.fields);
        console.log(
          `${header} ${pc.dim(`→ ${grouped.size} resource${grouped.size === 1 ? '' : 's'}, ${result.fields.length} field${result.fields.length === 1 ? '' : 's'}`)}`,
        );
        for (const [resource, fieldPaths] of grouped) {
          console.log(`  ${pc.bold(resource)}`);
          for (const fp of fieldPaths) {
            console.log(`    ${pc.green(fp === '' ? '(whole resource)' : fp)}`);
          }
        }
      } catch (err) {
        reportError(err);
      }
    });
}
