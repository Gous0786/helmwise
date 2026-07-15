import { parse } from 'yaml';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LeafValue, ValueType } from '../types.js';

/**
 * Infer the {@link ValueType} of a parsed YAML value. Arrays and objects are
 * reported as `array`/`object`; the caller decides whether they are leaves
 * (empty) or containers to descend into (non-empty).
 */
function inferType(value: unknown): ValueType {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'object';
  }
}

/**
 * A value is a leaf — the atomic unit of attribution — when there is nothing
 * further to descend into: any scalar, or an empty array/object. A non-empty
 * array or object is a container whose children are the real leaves.
 */
function isLeaf(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return true;
}

/** Append a child key to a dotted path (arrays use `[i]` index notation). */
function childPath(parent: string, key: string | number): string {
  if (typeof key === 'number') return `${parent}[${key}]`;
  return parent === '' ? key : `${parent}.${key}`;
}

function walk(value: unknown, path: string, out: LeafValue[]): void {
  if (isLeaf(value)) {
    out.push({ path, type: inferType(value), default: value ?? null });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, childPath(path, i), out));
    return;
  }
  // Non-empty object.
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    walk(child, childPath(path, key), out);
  }
}

/**
 * Flatten a parsed `values.yaml` object into a list of leaf values, each with
 * a dotted/indexed path (`image.tag`, `ingress.hosts[0].host`), its inferred
 * type, and its default. This defines the unit of attribution: in Phase 3 each
 * leaf is perturbed one at a time to discover which rendered fields it affects.
 *
 * Subchart-scoped keys are treated as ordinary paths (`backend.image.tag`), so
 * subchart values are first-class.
 *
 * @returns Leaf values in document order.
 */
export function flattenValues(values: unknown): LeafValue[] {
  const out: LeafValue[] = [];
  if (values === null || values === undefined) return out;
  walk(values, '', out);
  return out;
}

/**
 * Read a chart's `values.yaml` and flatten it. Returns an empty list if the
 * chart has no `values.yaml`.
 *
 * @throws if `values.yaml` exists but is not valid YAML.
 */
export function flattenChartValues(chartPath: string): LeafValue[] {
  let raw: string;
  try {
    raw = readFileSync(join(chartPath, 'values.yaml'), 'utf8');
  } catch {
    return [];
  }
  return flattenValues(parse(raw));
}
