import { describe, expect, it } from 'vitest';
import { buildTemplateArgs, DEFAULT_RELEASE_NAME } from './render.js';

describe('buildTemplateArgs', () => {
  it('uses the default release name and chart path', () => {
    const args = buildTemplateArgs({ chartPath: './chart' });
    expect(args).toEqual(['template', DEFAULT_RELEASE_NAME, './chart']);
  });

  it('respects an explicit release name', () => {
    const args = buildTemplateArgs({ chartPath: './chart', releaseName: 'prod' });
    expect(args.slice(0, 3)).toEqual(['template', 'prod', './chart']);
  });

  it('appends --values for each values file', () => {
    const args = buildTemplateArgs({
      chartPath: './chart',
      valuesFiles: ['a.yaml', 'b.yaml'],
    });
    expect(args).toContain('--values');
    expect(args.filter((a) => a === '--values')).toHaveLength(2);
    expect(args).toContain('a.yaml');
    expect(args).toContain('b.yaml');
  });

  it('appends --set for each override and escapes commas', () => {
    const args = buildTemplateArgs({
      chartPath: './chart',
      setValues: { replicaCount: '3', 'image.tag': 'a,b' },
    });
    expect(args).toContain('replicaCount=3');
    expect(args).toContain('image.tag=a\\,b');
  });
});
