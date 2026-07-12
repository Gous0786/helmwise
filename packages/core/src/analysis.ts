import type { Analysis } from './types.js';

/**
 * Options controlling a full chart analysis.
 */
export interface AnalyzeOptions {
  /** Extra values files to layer on defaults (`helm -f`). */
  valuesFiles?: string[];
  /** Inline `--set key=value` overrides. */
  setValues?: Record<string, string>;
  /** Whether to run the (optional) AI explanation layer. Requires an LLM key. */
  explain?: boolean;
  /** Disable the on-disk render/attribution cache for this run. */
  noCache?: boolean;
}

/**
 * Run a full analysis of a Helm chart: render it, discover every leaf value,
 * attribute each rendered field back to its source value, and (optionally)
 * attach AI explanations.
 *
 * The deterministic portion always runs and requires no API key; the AI
 * portion runs only when {@link AnalyzeOptions.explain} is set and a provider
 * key is present in the environment.
 *
 * @param chartPath - Filesystem path to the chart directory.
 * @param options - See {@link AnalyzeOptions}.
 * @returns The single, serializable {@link Analysis} object.
 *
 * @remarks Not yet implemented — wired up in Phase 5. The signature exists now
 * so the public contract and module boundary are fixed from the start.
 */
export async function analyze(
  chartPath: string,
  options: AnalyzeOptions = {},
): Promise<Analysis> {
  void chartPath;
  void options;
  throw new Error('analyze() is not implemented yet (Phase 5).');
}
