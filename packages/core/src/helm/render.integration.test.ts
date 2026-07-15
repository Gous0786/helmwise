import { describe, expect, it, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { render } from './index.js';
import { locateHelm } from './locate.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, '../../../../fixtures');

// These tests shell out to a real `helm` binary. If helm is not installed,
// skip rather than fail — the pure unit tests still cover the logic.
let helmAvailable = false;
// Generous timeout: locateHelm probes several candidates, each running
// `helm version` with its own timeout, so the total can exceed vitest's
// default 10s hook budget when helm is absent or slow to resolve.
beforeAll(async () => {
  try {
    await locateHelm();
    helmAvailable = true;
  } catch {
    helmAvailable = false;
  }
}, 60_000);

describe('render (integration, requires helm)', () => {
  it('renders the trivial chart into a Deployment and a Service', async () => {
    if (!helmAvailable) return;
    const resources = await render({ chartPath: resolve(fixtures, 'trivial') });
    const kinds = resources.map((r) => r.kind).sort();
    expect(kinds).toEqual(['Deployment', 'Service']);
  });

  it('renders subchart resources from the parent chart', async () => {
    if (!helmAvailable) return;
    const resources = await render({
      chartPath: resolve(fixtures, 'with-subchart'),
    });
    const names = resources.map((r) => r.name);
    // The backend Deployment comes from the bundled subchart.
    expect(names).toContain('helmwise-backend');
    expect(names).toContain('helmwise-frontend');
  });

  it('applies --set overrides', async () => {
    if (!helmAvailable) return;
    const resources = await render({
      chartPath: resolve(fixtures, 'trivial'),
      setValues: { replicaCount: '5' },
    });
    const deploy = resources.find((r) => r.kind === 'Deployment');
    const replicas = (deploy?.doc as { spec?: { replicas?: number } })?.spec
      ?.replicas;
    expect(replicas).toBe(5);
  });
});
