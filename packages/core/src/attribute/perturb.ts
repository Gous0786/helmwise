import type { LeafValue } from '../types.js';

/**
 * A sentinel string unlikely to collide with any real default. Used when
 * perturbing string values so the change is unambiguous in the diff.
 */
export const STRING_SENTINEL = '__helmwise_perturbed__';

/**
 * Compute a perturbed value for a single leaf — a value guaranteed to differ
 * from its default so that any resulting change in the rendered manifests can
 * be attributed to this leaf.
 *
 * The result is returned as a string in the form Helm's `--set` expects, along
 * with the flag style to use. Type-aware:
 * - string  → a fixed sentinel token
 * - number  → default + 1 (or 1 if non-finite)
 * - boolean → the negation of the default
 * - null    → the sentinel token (gives the field a value where it had none)
 * - empty array/object → a sentinel entry, via `--set-string` where needed
 *
 * @returns The `--set` value string, or `null` if the leaf cannot be
 *   meaningfully perturbed (should not happen for real leaves).
 */
export function perturbValue(leaf: LeafValue): string | null {
  switch (leaf.type) {
    case 'string':
      // If the default already equals the sentinel (astronomically unlikely),
      // use a second distinct token so the value still changes.
      return leaf.default === STRING_SENTINEL
        ? `${STRING_SENTINEL}_alt`
        : STRING_SENTINEL;

    case 'number': {
      const n = typeof leaf.default === 'number' ? leaf.default : NaN;
      return Number.isFinite(n) ? String(n + 1) : '1';
    }

    case 'boolean':
      return leaf.default === true ? 'false' : 'true';

    case 'null':
      return STRING_SENTINEL;

    // Empty containers: give them a value so any conditional templating that
    // keys off "is this set?" flips. Represented as a scalar sentinel; helm
    // will set the path to a string, which is enough to perturb output.
    case 'array':
    case 'object':
      return STRING_SENTINEL;

    default:
      return null;
  }
}

/**
 * Whether a perturbed leaf must be applied with `--set-string` rather than
 * `--set`. Strings and null/container sentinels are forced to string so Helm
 * does not coerce a sentinel like `123` into a number.
 */
export function needsSetString(leaf: LeafValue): boolean {
  return (
    leaf.type === 'string' ||
    leaf.type === 'null' ||
    leaf.type === 'array' ||
    leaf.type === 'object'
  );
}
