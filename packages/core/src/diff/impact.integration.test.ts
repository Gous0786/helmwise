import { describe, expect, it, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { diffImpact } from './impact.js';
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

describe('diffImpact (integration, requires helm)', () => {
  it('reports only the replicas field when overriding replicaCount', async () => {
    if (!helmAvailable) return;
    const result = await diffImpact(
      resolve(fixtures, 'trivial'),
      {},
      { setValues: { replicaCount: '5' } },
    );
    expect(result.changed).toBe(true);
    expect(result.changes).toEqual([
      {
        resource: 'Deployment/helmwise-trivial',
        fieldPath: 'spec.replicas',
        kind: 'changed',
      },
    ]);
  });

  it('reports no changes when both sides are identical', async () => {
    if (!helmAvailable) return;
    const result = await diffImpact(resolve(fixtures, 'trivial'), {}, {});
    expect(result.changed).toBe(false);
    expect(result.changes).toHaveLength(0);
  });

  it('captures the multi-resource blast radius of service.port', async () => {
    if (!helmAvailable) return;
    const result = await diffImpact(
      resolve(fixtures, 'trivial'),
      {},
      { setValues: { 'service.port': '9999' } },
    );
    const resources = new Set(result.changes.map((c) => c.resource));
    expect(resources.has('Deployment/helmwise-trivial')).toBe(true);
    expect(resources.has('Service/helmwise-trivial')).toBe(true);
  });

  it('diffs two explicit override sets against each other', async () => {
    if (!helmAvailable) return;
    const result = await diffImpact(
      resolve(fixtures, 'trivial'),
      { setValues: { replicaCount: '2' } },
      { setValues: { replicaCount: '7' } },
    );
    expect(result.changes).toEqual([
      {
        resource: 'Deployment/helmwise-trivial',
        fieldPath: 'spec.replicas',
        kind: 'changed',
      },
    ]);
  });
});
