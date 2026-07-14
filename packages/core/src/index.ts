/**
 * `@helmwise/core` — the helmwise engine.
 *
 * Deterministic Helm analysis (rendering, value→resource attribution, impact
 * diffing) with an optional AI explanation layer on top. This package has no
 * CLI or UI dependencies: it exposes a small set of documented functions that
 * return the single serializable {@link Analysis} object, which both the CLI
 * and the VS Code extension render.
 *
 * The public surface grows one phase at a time; this barrel is the only
 * entry point consumers should import from.
 *
 * @packageDocumentation
 */

export const VERSION = '0.0.0';

export type {
  Analysis,
  AttributionMap,
  Explanation,
  FieldRef,
  LeafValue,
  RenderedResource,
  ValueType,
} from './types.js';

export { analyze } from './analysis.js';
export type { AnalyzeOptions } from './analysis.js';

// Helm layer (Phase 1): rendering + resource parsing.
export {
  render,
  renderRaw,
  parseResources,
  resourceId,
  locateHelm,
  buildTemplateArgs,
  DEFAULT_RELEASE_NAME,
  HelmNotFoundError,
  HelmRenderError,
} from './helm/index.js';
export type { RenderInput } from './helm/index.js';
