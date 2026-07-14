import { execFile } from 'node:child_process';
import { locateHelm } from './locate.js';
import { HelmRenderError } from './errors.js';

/**
 * Inputs to a single `helm template` invocation.
 */
export interface RenderInput {
  /** Filesystem path to the chart directory. */
  chartPath: string;
  /** Extra values files to layer on top of chart defaults (`helm -f`). */
  valuesFiles?: string[];
  /** Inline overrides applied as `--set key=value`. Later keys win. */
  setValues?: Record<string, string>;
  /** Release name passed to helm (affects `.Release.Name` in templates). */
  releaseName?: string;
}

/** Release name used when the caller does not specify one. */
export const DEFAULT_RELEASE_NAME = 'helmwise';

/**
 * Build the argument list for `helm template`. Exposed for testing so we can
 * assert the exact flags without spawning a process.
 */
export function buildTemplateArgs(input: RenderInput): string[] {
  const release = input.releaseName ?? DEFAULT_RELEASE_NAME;
  const args = ['template', release, input.chartPath];

  for (const file of input.valuesFiles ?? []) {
    args.push('--values', file);
  }
  for (const [key, value] of Object.entries(input.setValues ?? {})) {
    // Escape commas, which helm treats as --set list separators.
    const escaped = value.replace(/,/g, '\\,');
    args.push('--set', `${key}=${escaped}`);
  }
  return args;
}

/**
 * Render a chart with `helm template` and return the raw multi-document YAML
 * that Helm produces. This is the engine's ground truth: everything else is
 * derived from real Helm output, never guessed from the chart source.
 *
 * @returns The raw stdout from `helm template` (one YAML stream, docs split by
 *   `---`).
 * @throws {@link HelmNotFoundError} if helm is not installed.
 * @throws {@link HelmRenderError} if helm exits non-zero.
 */
export async function renderRaw(input: RenderInput): Promise<string> {
  const helm = await locateHelm();
  const args = buildTemplateArgs(input);

  return new Promise<string>((resolve, reject) => {
    execFile(
      helm,
      args,
      { maxBuffer: 64 * 1024 * 1024, timeout: 60_000 },
      (error, stdout, stderr) => {
        if (error) {
          const exitCode =
            typeof (error as { code?: unknown }).code === 'number'
              ? (error as { code: number }).code
              : null;
          reject(new HelmRenderError(exitCode, stderr || String(error)));
          return;
        }
        resolve(stdout);
      },
    );
  });
}
