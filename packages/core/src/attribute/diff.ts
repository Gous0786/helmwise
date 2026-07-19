import type { RenderedResource } from '../types.js';
import { resourceId } from '../helm/resources.js';

/**
 * A single field that differs between two renders, addressed by resource id and
 * a dotted/indexed path within that resource's manifest.
 */
export interface FieldChange {
  /** Stable resource id, e.g. `Deployment/helmwise-trivial`. */
  resource: string;
  /** Path to the field within the manifest, e.g. `spec.replicas`. */
  fieldPath: string;
  /** Kind of change. `added`/`removed` cover fields present in only one side. */
  kind: 'changed' | 'added' | 'removed';
}

/** Append a child segment to a field path (arrays use `[i]`). */
function child(path: string, key: string | number): string {
  if (typeof key === 'number') return `${path}[${key}]`;
  return path === '' ? key : `${path}.${key}`;
}

/**
 * Recursively compare two parsed manifest values, recording every leaf-level
 * difference. Objects and arrays are walked; scalars are compared by value.
 */
function diffValue(a: unknown, b: unknown, path: string, out: LeafDiff[]): void {
  if (a === b) return;

  const aIsObj = a !== null && typeof a === 'object';
  const bIsObj = b !== null && typeof b === 'object';

  // One side scalar / missing, the other a container, or both scalars differ:
  // treat as a single change at this path rather than descending.
  if (!aIsObj || !bIsObj || Array.isArray(a) !== Array.isArray(b)) {
    if (a === undefined) out.push({ path, kind: 'added' });
    else if (b === undefined) out.push({ path, kind: 'removed' });
    else out.push({ path, kind: 'changed' });
    return;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      diffValue(a[i], b[i], child(path, i), out);
    }
    return;
  }

  const keys = new Set([
    ...Object.keys(a as Record<string, unknown>),
    ...Object.keys(b as Record<string, unknown>),
  ]);
  for (const key of keys) {
    diffValue(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
      child(path, key),
      out,
    );
  }
}

interface LeafDiff {
  path: string;
  kind: 'changed' | 'added' | 'removed';
}

/**
 * Structurally diff two rendered manifest sets and return every field that
 * changed, keyed by resource. Resources are matched by {@link resourceId}, so
 * ordering differences between the two renders do not produce false changes.
 *
 * A resource present in only one set contributes an `added`/`removed` change at
 * its root path (`''`).
 *
 * @returns All field-level changes, in a stable order (by resource, then path).
 */
export function diffResources(
  before: RenderedResource[],
  after: RenderedResource[],
): FieldChange[] {
  const beforeById = new Map(before.map((r) => [resourceId(r), r]));
  const afterById = new Map(after.map((r) => [resourceId(r), r]));

  const changes: FieldChange[] = [];
  const ids = new Set([...beforeById.keys(), ...afterById.keys()]);

  for (const id of [...ids].sort()) {
    const a = beforeById.get(id);
    const b = afterById.get(id);

    if (a && !b) {
      changes.push({ resource: id, fieldPath: '', kind: 'removed' });
      continue;
    }
    if (!a && b) {
      changes.push({ resource: id, fieldPath: '', kind: 'added' });
      continue;
    }

    const leafDiffs: LeafDiff[] = [];
    diffValue(a!.doc, b!.doc, '', leafDiffs);
    for (const d of leafDiffs) {
      changes.push({ resource: id, fieldPath: d.path, kind: d.kind });
    }
  }

  return changes;
}
