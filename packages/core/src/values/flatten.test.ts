import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { flattenValues } from './flatten.js';

/** Parse inline YAML then flatten — mirrors how flattenChartValues works. */
function flat(yaml: string) {
  return flattenValues(parse(yaml));
}

describe('flattenValues', () => {
  it('flattens nested maps into dotted paths with type and default', () => {
    const leaves = flat(`
replicaCount: 1
image:
  repository: nginx
  tag: '1.27'
enabled: true
`);
    expect(leaves).toEqual([
      { path: 'replicaCount', type: 'number', default: 1 },
      { path: 'image.repository', type: 'string', default: 'nginx' },
      { path: 'image.tag', type: 'string', default: '1.27' },
      { path: 'enabled', type: 'boolean', default: true },
    ]);
  });

  it('indexes into arrays with [i] notation', () => {
    const leaves = flat(`
ingress:
  hosts:
    - host: a.example.com
      path: /a
    - host: b.example.com
      path: /b
`);
    expect(leaves.map((l) => l.path)).toEqual([
      'ingress.hosts[0].host',
      'ingress.hosts[0].path',
      'ingress.hosts[1].host',
      'ingress.hosts[1].path',
    ]);
  });

  it('handles arrays of scalars', () => {
    const leaves = flat(`
args:
  - --verbose
  - --port=8080
`);
    expect(leaves).toEqual([
      { path: 'args[0]', type: 'string', default: '--verbose' },
      { path: 'args[1]', type: 'string', default: '--port=8080' },
    ]);
  });

  it('treats empty containers as leaves (nothing to descend into)', () => {
    const leaves = flat(`
nodeSelector: {}
tolerations: []
`);
    expect(leaves).toEqual([
      { path: 'nodeSelector', type: 'object', default: {} },
      { path: 'tolerations', type: 'array', default: [] },
    ]);
  });

  it('normalizes null / empty values to a null leaf', () => {
    const leaves = flat(`
existingSecret:
tag: null
`);
    expect(leaves).toEqual([
      { path: 'existingSecret', type: 'null', default: null },
      { path: 'tag', type: 'null', default: null },
    ]);
  });

  it('treats subchart-scoped keys as ordinary paths', () => {
    const leaves = flat(`
backend:
  image:
    tag: '2.1'
  replicas: 3
`);
    expect(leaves.map((l) => l.path)).toEqual([
      'backend.image.tag',
      'backend.replicas',
    ]);
  });

  it('returns an empty list for null/empty input', () => {
    expect(flattenValues(null)).toEqual([]);
    expect(flattenValues(undefined)).toEqual([]);
    expect(flat('')).toEqual([]);
  });
});
