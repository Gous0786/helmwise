import { describe, expect, it } from 'vitest';
import type { RenderedResource } from '../types.js';
import { diffResources } from './diff.js';

function res(kind: string, name: string, doc: unknown): RenderedResource {
  return { kind, name, doc };
}

describe('diffResources', () => {
  it('reports a changed scalar field at its path', () => {
    const before = [res('Deployment', 'app', { spec: { replicas: 1 } })];
    const after = [res('Deployment', 'app', { spec: { replicas: 5 } })];
    expect(diffResources(before, after)).toEqual([
      { resource: 'Deployment/app', fieldPath: 'spec.replicas', kind: 'changed' },
    ]);
  });

  it('reports changes inside arrays with index paths', () => {
    const before = [
      res('Deployment', 'app', { spec: { containers: [{ image: 'a:1' }] } }),
    ];
    const after = [
      res('Deployment', 'app', { spec: { containers: [{ image: 'a:2' }] } }),
    ];
    expect(diffResources(before, after)).toEqual([
      {
        resource: 'Deployment/app',
        fieldPath: 'spec.containers[0].image',
        kind: 'changed',
      },
    ]);
  });

  it('returns nothing when the two sets are identical', () => {
    const r = [res('Service', 'svc', { spec: { port: 80 } })];
    expect(diffResources(r, structuredClone(r))).toEqual([]);
  });

  it('matches resources by id regardless of order', () => {
    const a = res('Service', 'svc', { p: 1 });
    const b = res('Deployment', 'app', { r: 1 });
    // Same resources, reversed order, no field changes.
    expect(diffResources([a, b], [b, a])).toEqual([]);
  });

  it('flags added and removed resources at the root path', () => {
    const before = [res('Service', 'svc', {})];
    const after = [res('Service', 'svc', {}), res('ConfigMap', 'cm', {})];
    expect(diffResources(before, after)).toEqual([
      { resource: 'ConfigMap/cm', fieldPath: '', kind: 'added' },
    ]);
    expect(diffResources(after, before)).toEqual([
      { resource: 'ConfigMap/cm', fieldPath: '', kind: 'removed' },
    ]);
  });

  it('detects added and removed fields within a resource', () => {
    const before = [res('Deployment', 'app', { spec: { replicas: 1 } })];
    const after = [
      res('Deployment', 'app', { spec: { replicas: 1, paused: true } }),
    ];
    expect(diffResources(before, after)).toEqual([
      { resource: 'Deployment/app', fieldPath: 'spec.paused', kind: 'added' },
    ]);
  });
});
