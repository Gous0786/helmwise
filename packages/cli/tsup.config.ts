import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  sourcemap: true,
  clean: true,
  target: 'node18',
  // Keep dependencies external (including @helmwise/core) so Node resolves them
  // as real ESM packages at runtime. Bundling them in would inline packages
  // like `yaml` whose CJS builds use dynamic require(), which breaks in an ESM
  // bundle. @helmwise/core is a normal dependency and ships alongside the CLI.
  banner: {
    js: '#!/usr/bin/env node',
  },
});
