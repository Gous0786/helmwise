import { describe, expect, it } from 'vitest';
import type { LeafValue } from '../types.js';
import { needsSetString, perturbValue, STRING_SENTINEL } from './perturb.js';

const leaf = (type: LeafValue['type'], def: unknown): LeafValue => ({
  path: 'x',
  type,
  default: def,
});

describe('perturbValue', () => {
  it('replaces strings with the sentinel', () => {
    expect(perturbValue(leaf('string', 'nginx'))).toBe(STRING_SENTINEL);
  });

  it('uses an alternate token if the default is already the sentinel', () => {
    expect(perturbValue(leaf('string', STRING_SENTINEL))).not.toBe(
      STRING_SENTINEL,
    );
  });

  it('increments numbers to a distinct value', () => {
    expect(perturbValue(leaf('number', 80))).toBe('81');
    expect(perturbValue(leaf('number', 0))).toBe('1');
  });

  it('flips booleans', () => {
    expect(perturbValue(leaf('boolean', false))).toBe('true');
    expect(perturbValue(leaf('boolean', true))).toBe('false');
  });

  it('gives null and empty containers a sentinel value', () => {
    expect(perturbValue(leaf('null', null))).toBe(STRING_SENTINEL);
    expect(perturbValue(leaf('array', []))).toBe(STRING_SENTINEL);
    expect(perturbValue(leaf('object', {}))).toBe(STRING_SENTINEL);
  });
});

describe('needsSetString', () => {
  it('forces string for string/null/container leaves', () => {
    expect(needsSetString(leaf('string', 'x'))).toBe(true);
    expect(needsSetString(leaf('null', null))).toBe(true);
    expect(needsSetString(leaf('array', []))).toBe(true);
    expect(needsSetString(leaf('object', {}))).toBe(true);
  });

  it('uses plain --set for numbers and booleans', () => {
    expect(needsSetString(leaf('number', 1))).toBe(false);
    expect(needsSetString(leaf('boolean', true))).toBe(false);
  });
});
