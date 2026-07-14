import { describe, expect, it } from 'vitest';
import { parseResources, resourceId } from './resources.js';

const SAMPLE = `---
# Source: trivial/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: demo-trivial
spec:
  ports:
    - port: 80
---
# Source: trivial/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-trivial
  namespace: apps
spec:
  replicas: 1
---
# a comment-only / empty document
---
`;

describe('parseResources', () => {
  it('extracts each resource with kind and name', () => {
    const resources = parseResources(SAMPLE);
    expect(resources).toHaveLength(2);
    expect(resources[0]).toMatchObject({ kind: 'Service', name: 'demo-trivial' });
    expect(resources[1]).toMatchObject({
      kind: 'Deployment',
      name: 'demo-trivial',
      namespace: 'apps',
    });
  });

  it('skips empty and kind-less documents', () => {
    expect(parseResources('---\n---\n# just a comment\n')).toHaveLength(0);
  });
});

describe('resourceId', () => {
  it('formats Kind/name without namespace', () => {
    expect(resourceId({ kind: 'Service', name: 'x', doc: {} })).toBe('Service/x');
  });

  it('includes namespace when present', () => {
    expect(
      resourceId({ kind: 'Deployment', name: 'x', namespace: 'ns', doc: {} }),
    ).toBe('Deployment/ns/x');
  });
});
