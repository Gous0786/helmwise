import type { FieldRef, LeafValue } from '../types.js';
import { render } from '../helm/index.js';
import type { RenderInput } from '../helm/index.js';
import { flattenChartValues } from '../values/flatten.js';
import { diffResources, type FieldChange } from './diff.js';
import { needsSetString, perturbValue } from './perturb.js';

/**
 * The result of tracing a single value: the fields it flows into, plus enough
 * context for a caller to render it or flag a dead value.
 */
export interface TraceResult {
  /** The value path that was traced. */
  path: string;
  /** The leaf's inferred type and default. */
  leaf: LeafValue;
  /** Rendered fields attributed to this value, grouped nowhere (flat list). */
  fields: FieldRef[];
  /**
   * True when perturbing the value changed nothing in the rendered output —
   * i.e. no template references it. Such values are candidates for removal.
   */
  dead: boolean;
}

/** Convert a {@link FieldChange} into the public {@link FieldRef} shape. */
function toFieldRef(change: FieldChange): FieldRef {
  return { resource: change.resource, fieldPath: change.fieldPath };
}

/**
 * Trace a single value to the rendered Kubernetes fields it affects.
 *
 * Renders the chart once at baseline, then re-renders with the target value
 * perturbed, and diffs the two. Because Helm is deterministic, any field that
 * changed must have been caused by the perturbed value — so the attribution is
 * grounded in real output, not guessed from templates. This also captures
 * values that reach output through helpers and subcharts, since only the
 * rendered result is compared.
 *
 * @param chartPath - Path to the chart directory.
 * @param valuePath - Dotted/indexed leaf path, e.g. `image.tag`.
 * @param baseInput - Optional base render inputs (extra values files / sets)
 *   applied to both the baseline and perturbed renders.
 * @throws if the value path is not a known leaf in the chart's `values.yaml`.
 */
export async function traceValue(
  chartPath: string,
  valuePath: string,
  baseInput: Omit<RenderInput, 'chartPath'> = {},
): Promise<TraceResult> {
  const leaves = flattenChartValues(chartPath);
  const leaf = leaves.find((l) => l.path === valuePath);
  if (!leaf) {
    throw new Error(
      `Value "${valuePath}" is not a leaf in this chart's values.yaml. ` +
        `Run \`helmwise values ${chartPath}\` to see available paths.`,
    );
  }

  const perturbed = perturbValue(leaf);
  if (perturbed === null) {
    throw new Error(`Cannot perturb value "${valuePath}" (type ${leaf.type}).`);
  }

  const baseline = await render({ chartPath, ...baseInput });

  const perturbInput: RenderInput = { chartPath, ...baseInput };
  if (needsSetString(leaf)) {
    perturbInput.setStringValues = {
      ...baseInput.setStringValues,
      [valuePath]: perturbed,
    };
  } else {
    perturbInput.setValues = { ...baseInput.setValues, [valuePath]: perturbed };
  }
  const after = await render(perturbInput);

  const changes = diffResources(baseline, after);
  const fields = changes.map(toFieldRef);

  return { path: valuePath, leaf, fields, dead: fields.length === 0 };
}
