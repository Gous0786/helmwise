import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { flattenChartValues } from './flatten.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, '../../../../fixtures');

describe('flattenChartValues (reads fixture values.yaml)', () => {
  it('flattens the trivial chart, including the dead value', () => {
    const leaves = flattenChartValues(resolve(fixtures, 'trivial'));
    const byPath = Object.fromEntries(leaves.map((l) => [l.path, l]));
    expect(byPath['image.tag']).toMatchObject({ type: 'string', default: '1.27' });
    expect(byPath['service.port']).toMatchObject({ type: 'number', default: 80 });
    expect(byPath['unusedFlag']).toMatchObject({ type: 'boolean', default: false });
  });

  it('flattens subchart-scoped and global paths', () => {
    const leaves = flattenChartValues(resolve(fixtures, 'with-subchart'));
    const paths = leaves.map((l) => l.path);
    expect(paths).toContain('backend.image.tag');
    expect(paths).toContain('backend.replicas');
    expect(paths).toContain('global.environment');
    expect(paths).toContain('frontendReplicas');
  });

  it('returns an empty list for a chart directory without values.yaml', () => {
    expect(flattenChartValues(resolve(fixtures, 'trivial/templates'))).toEqual([]);
  });
});
