import { describe, expect, it, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { traceValue } from './trace.js';
import { locateHelm } from '../helm/locate.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, '../../../../fixtures');

let helmAvailable = false;
beforeAll(async () => {
  try {
    await locateHelm();
    helmAvailable = true;
  } catch {
    helmAvailable = false;
  }
}, 60_000);

/** Set of `resource#fieldPath` keys for concise assertions. */
function keys(fields: { resource: string; fieldPath: string }[]): string[] {
  return fields.map((f) => `${f.resource}#${f.fieldPath}`).sort();
}

describe('traceValue (integration, requires helm)', () => {
  it('traces image.tag to exactly the container image field', async () => {
    if (!helmAvailable) return;
    const result = await traceValue(resolve(fixtures, 'trivial'), 'image.tag');
    expect(result.dead).toBe(false);
    expect(keys(result.fields)).toEqual([
      'Deployment/helmwise-trivial#spec.template.spec.containers[0].image',
    ]);
  });

  it('traces service.port to BOTH the Service and the Deployment', async () => {
    if (!helmAvailable) return;
    const result = await traceValue(resolve(fixtures, 'trivial'), 'service.port');
    const resources = new Set(result.fields.map((f) => f.resource));
    expect(resources.has('Deployment/helmwise-trivial')).toBe(true);
    expect(resources.has('Service/helmwise-trivial')).toBe(true);
  });

  it('flags unusedFlag as dead (touches nothing)', async () => {
    if (!helmAvailable) return;
    const result = await traceValue(resolve(fixtures, 'trivial'), 'unusedFlag');
    expect(result.dead).toBe(true);
    expect(result.fields).toHaveLength(0);
  });

  it('traces a value that reaches output through a helper', async () => {
    if (!helmAvailable) return;
    // `team` is only referenced inside the with-helpers.labels helper, never
    // directly in a manifest — perturbation still finds it.
    const result = await traceValue(
      resolve(fixtures, 'with-helpers'),
      'team',
    );
    expect(result.dead).toBe(false);
    expect(result.fields.length).toBeGreaterThan(0);
  });

  it('traces a subchart-scoped value into subchart resources', async () => {
    if (!helmAvailable) return;
    const result = await traceValue(
      resolve(fixtures, 'with-subchart'),
      'backend.replicas',
    );
    expect(result.dead).toBe(false);
    expect(
      result.fields.some((f) => f.resource === 'Deployment/helmwise-backend'),
    ).toBe(true);
  });

  it('throws on an unknown value path', async () => {
    if (!helmAvailable) return;
    await expect(
      traceValue(resolve(fixtures, 'trivial'), 'does.not.exist'),
    ).rejects.toThrow(/not a leaf/i);
  });
});
