import { describe, expect, it } from 'vitest';
import { VERSION, analyze } from './index.js';

describe('@helmwise/core public surface', () => {
  it('exposes a VERSION string', () => {
    expect(typeof VERSION).toBe('string');
  });

  it('analyze() is present but not yet implemented (Phase 5)', async () => {
    await expect(analyze('./nonexistent')).rejects.toThrow(/not implemented/i);
  });
});
