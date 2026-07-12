import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  sourcemap: true,
  clean: true,
  target: 'node18',
  // Bundle the workspace core into the CLI output so the published bin is
  // self-contained; leave third-party deps external.
  noExternal: ['@helmwise/core'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
