import type { Command } from 'commander';
import pc from 'picocolors';
import { flattenChartValues, type LeafValue } from '@helmwise/core';
import { reportError } from '../util.js';

interface ValuesOptions {
  json?: boolean;
}

/** Render a leaf's default compactly for the human-readable table. */
function formatDefault(leaf: LeafValue): string {
  if (leaf.type === 'string') return `"${String(leaf.default)}"`;
  if (leaf.type === 'null') return 'null';
  if (leaf.type === 'array') return '[]';
  if (leaf.type === 'object') return '{}';
  return String(leaf.default);
}

/**
 * Register the `values` command: list every leaf value in a chart's
 * `values.yaml` as a dotted path with its inferred type and default. These
 * leaves are the units the Phase 3 attribution engine will perturb.
 */
export function registerValues(program: Command): void {
  program
    .command('values')
    .description('List every leaf value as a dotted path with type and default')
    .argument('<chart>', 'path to the Helm chart directory')
    .option('--json', 'output the leaf values as JSON')
    .action((chart: string, options: ValuesOptions) => {
      try {
        const leaves = flattenChartValues(chart);

        if (options.json) {
          console.log(JSON.stringify(leaves, null, 2));
          return;
        }

        if (leaves.length === 0) {
          console.log(pc.yellow('No values found (chart has no values.yaml).'));
          return;
        }

        const pathWidth = Math.max(...leaves.map((l) => l.path.length));
        const typeWidth = Math.max(...leaves.map((l) => l.type.length));

        console.log(
          pc.dim(`${leaves.length} value${leaves.length === 1 ? '' : 's'}:`),
        );
        for (const leaf of leaves) {
          console.log(
            `  ${pc.cyan(leaf.path.padEnd(pathWidth))}  ` +
              `${pc.dim(leaf.type.padEnd(typeWidth))}  ` +
              pc.bold(formatDefault(leaf)),
          );
        }
      } catch (err) {
        reportError(err);
      }
    });
}
