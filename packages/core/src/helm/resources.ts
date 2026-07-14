import { parseAllDocuments } from 'yaml';
import type { RenderedResource } from '../types.js';

/**
 * Shape we expect from a rendered Kubernetes manifest document. Everything is
 * optional because helm output can technically contain non-standard or partial
 * documents; the parser tolerates them.
 */
interface ManifestDoc {
  kind?: unknown;
  metadata?: { name?: unknown; namespace?: unknown } | null;
}

/**
 * A stable identifier for a rendered resource, used as a key when attributing
 * fields and diffing. Format: `Kind/name` or `Kind/namespace/name`.
 */
export function resourceId(resource: RenderedResource): string {
  return resource.namespace
    ? `${resource.kind}/${resource.namespace}/${resource.name}`
    : `${resource.kind}/${resource.name}`;
}

/**
 * Parse the raw multi-document YAML from {@link renderRaw} into normalized
 * {@link RenderedResource} objects.
 *
 * Empty documents (blank sections, comment-only chunks that Helm emits between
 * `---` separators) are skipped. Documents without a `kind` are skipped as
 * well, since they cannot be addressed as Kubernetes resources.
 *
 * @returns One entry per real Kubernetes resource, in render order.
 */
export function parseResources(raw: string): RenderedResource[] {
  const resources: RenderedResource[] = [];

  for (const parsed of parseAllDocuments(raw)) {
    const doc = parsed.toJSON() as ManifestDoc | null;
    if (doc == null || typeof doc !== 'object') continue;

    const kind = typeof doc.kind === 'string' ? doc.kind : undefined;
    if (!kind) continue;

    const name =
      doc.metadata && typeof doc.metadata.name === 'string'
        ? doc.metadata.name
        : '<unnamed>';
    const namespace =
      doc.metadata && typeof doc.metadata.namespace === 'string'
        ? doc.metadata.namespace
        : undefined;

    resources.push({ kind, name, namespace, doc });
  }

  return resources;
}
