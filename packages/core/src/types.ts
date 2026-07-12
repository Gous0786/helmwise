/**
 * Core data contracts shared across the helmwise engine and both surfaces
 * (CLI and VS Code extension).
 *
 * Everything here is a plain, JSON-serializable shape. That is deliberate:
 * the {@link Analysis} object produced by the engine must survive being
 * written to a cache file and sent across the extension process boundary
 * without any behavior attached. Keep these types free of classes, methods,
 * and non-serializable values.
 *
 * @packageDocumentation
 */

/**
 * The inferred kind of a leaf value, used to drive type-aware perturbation
 * (Phase 3) and schema generation (Phase 5).
 */
export type ValueType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object';

/**
 * A single "leaf" in `values.yaml` — the atomic unit of attribution.
 *
 * A leaf is a scalar (or an empty container) reachable by a dotted/indexed
 * path such as `image.tag`, `resources.limits.cpu`, or
 * `ingress.hosts[0].host`. Perturbing one leaf and re-rendering is how the
 * engine attributes rendered fields back to their source value.
 */
export interface LeafValue {
  /** Dotted/indexed path from the root of `values.yaml`, e.g. `image.tag`. */
  path: string;
  /** Inferred type of the default value. */
  type: ValueType;
  /** The default value as declared in `values.yaml`. */
  default: unknown;
}

/**
 * A single Kubernetes resource produced by `helm template`, normalized for
 * indexing and diffing.
 */
export interface RenderedResource {
  /** Kubernetes kind, e.g. `Deployment`. */
  kind: string;
  /** `metadata.name` of the resource. */
  name: string;
  /** `metadata.namespace`, if present. */
  namespace?: string;
  /** The full parsed manifest document. */
  doc: unknown;
}

/**
 * A single rendered field, addressed by resource + JSON-path-like field path,
 * e.g. `Deployment/foo` at `spec.template.spec.containers[0].image`.
 */
export interface FieldRef {
  /** Stable resource identifier, e.g. `Deployment/foo`. */
  resource: string;
  /** Path to the field within that resource's manifest. */
  fieldPath: string;
}

/**
 * The bidirectional value↔resource attribution map (the deterministic core's
 * primary output).
 */
export interface AttributionMap {
  /** For each value path, the rendered fields it flows into. */
  valueToFields: Record<string, FieldRef[]>;
  /** For each `resource#fieldPath` key, the value paths that feed it. */
  fieldToValues: Record<string, string[]>;
}

/**
 * A grounded, AI-generated explanation of a single value. Present only when an
 * LLM provider key is available; the deterministic core never populates this.
 */
export interface Explanation {
  /** What the value is for, in plain language. */
  purpose: string;
  /** What changing it does. */
  effect: string;
  /** Safe range / accepted values, if known. */
  safeRange?: string;
  /** Other values this one depends on or interacts with. */
  dependencies?: string[];
}

/**
 * The single, serializable result object produced by the engine and consumed
 * by every surface. Both the CLI and the extension render *this* — they never
 * re-derive analysis — which is what keeps the two surfaces consistent.
 */
export interface Analysis {
  chart: {
    name: string;
    version?: string;
    path: string;
  };
  /** Every leaf value discovered in `values.yaml`. */
  values: LeafValue[];
  /** Every resource produced by rendering the chart with default values. */
  resources: RenderedResource[];
  /** The deterministic value↔resource attribution map. */
  map: AttributionMap;
  /** AI explanations keyed by value path. Absent when no LLM key is present. */
  explanations?: Record<string, Explanation>;
  /** Non-fatal issues: skipped values, helm stderr, etc. Never silently dropped. */
  warnings: string[];
}
