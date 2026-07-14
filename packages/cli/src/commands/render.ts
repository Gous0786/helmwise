import type { Command } from 'commander';
import pc from 'picocolors';
import { render, resourceId } from '@helmwise/core';
import { collectSet, collectValues, reportError } from '../util.js';

interface RenderOptions {
  values: string[];
  set: Record<string, string>;
  json?: boolean;
}

/**
 * Register the `render` command: render a chart and list its Kubernetes
 * resources. This is the thinnest possible surface over the core render layer
 * and serves as the ground-truth check for every later command.
 */
export function registerRender(program: Command): void {
  program
    .command('render')
    .description('Render a chart and list its Kubernetes resources')
    .argument('<chart>', 'path to the Helm chart directory')
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
    .option('--json', 'output the rendered resources as JSON')
    .action(async (chart: string, options: RenderOptions) => {
      try {
        const resources = await render({
          chartPath: chart,
          valuesFiles: options.values,
          setValues: options.set,
        });

        if (options.json) {
          console.log(JSON.stringify(resources, null, 2));
          return;
        }

        if (resources.length === 0) {
          console.log(pc.yellow('No resources rendered.'));
          return;
        }

        console.log(
          pc.dim(
            `${resources.length} resource${resources.length === 1 ? '' : 's'}:`,
          ),
        );
        for (const r of resources) {
          console.log(`  ${pc.cyan(r.kind)} ${pc.bold(resourceId(r))}`);
        }
      } catch (err) {
        reportError(err);
      }
    });
}
