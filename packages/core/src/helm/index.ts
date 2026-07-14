import type { RenderedResource } from '../types.js';
import { renderRaw, type RenderInput } from './render.js';
import { parseResources } from './resources.js';

export { renderRaw, buildTemplateArgs, DEFAULT_RELEASE_NAME } from './render.js';
export type { RenderInput } from './render.js';
export { parseResources, resourceId } from './resources.js';
export { locateHelm, resetHelmCache } from './locate.js';
export { HelmNotFoundError, HelmRenderError } from './errors.js';

/**
 * Render a chart and return its parsed Kubernetes resources.
 *
 * Convenience over {@link renderRaw} + {@link parseResources}: the two things
 * a caller almost always wants together.
 */
export async function render(input: RenderInput): Promise<RenderedResource[]> {
  const raw = await renderRaw(input);
  return parseResources(raw);
}
