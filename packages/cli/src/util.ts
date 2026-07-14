import pc from 'picocolors';
import { HelmNotFoundError, HelmRenderError } from '@helmwise/core';

/**
 * Collect repeated `--set key=value` flags into a record. Passed to
 * commander's option collector.
 */
export function collectSet(
  value: string,
  previous: Record<string, string>,
): Record<string, string> {
  const eq = value.indexOf('=');
  if (eq === -1) {
    throw new Error(`Invalid --set "${value}" (expected key=value).`);
  }
  const key = value.slice(0, eq);
  const val = value.slice(eq + 1);
  return { ...previous, [key]: val };
}

/**
 * Collect repeated `--values file` flags into an array.
 */
export function collectValues(value: string, previous: string[]): string[] {
  return [...previous, value];
}

/**
 * Print a user-facing error and set a non-zero exit code. Helm-specific errors
 * get a cleaner message than a raw stack trace.
 */
export function reportError(err: unknown): void {
  if (err instanceof HelmNotFoundError || err instanceof HelmRenderError) {
    console.error(pc.red(err.message));
  } else if (err instanceof Error) {
    console.error(pc.red(err.message));
  } else {
    console.error(pc.red(String(err)));
  }
  process.exitCode = 1;
}
