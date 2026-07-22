import { render } from '../helm/index.js';
import type { RenderInput } from '../helm/index.js';
import { diffResources, type FieldChange } from '../attribute/diff.js';

/** Render inputs for one side of an impact diff (chart path supplied separately). */
export type SideInput = Omit<RenderInput, 'chartPath'>;

/**
 * The result of diffing two value sets: the flat list of field changes plus a
 * convenience flag for callers that only care whether anything changed.
 */
export interface ImpactResult {
  /** Every field that differs between the two renders. */
  changes: FieldChange[];
  /** True when at least one field changed. Drives `--exit-code` in the CLI. */
  changed: boolean;
}

/**
 * Render a chart under two different value sets and report exactly which
 * rendered fields differ — the blast radius of a change.
 *
 * The `from` side defaults to the chart's own defaults (no overrides), so the
 * common case — "what does my override do?" — is just a populated `to`. Both
 * sides go through the same {@link diffResources} primitive used by tracing,
 * so the comparison is grounded in real Helm output.
 *
 * @param chartPath - Path to the chart directory.
 * @param from - Render inputs for the baseline side (defaults to chart defaults).
 * @param to - Render inputs for the comparison side.
 */
export async function diffImpact(
  chartPath: string,
  from: SideInput,
  to: SideInput,
): Promise<ImpactResult> {
  const [before, after] = await Promise.all([
    render({ chartPath, ...from }),
    render({ chartPath, ...to }),
  ]);

  const changes = diffResources(before, after);
  return { changes, changed: changes.length > 0 };
}
