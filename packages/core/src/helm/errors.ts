// Kept as distinct error classes (rather than one generic HelmError) so
// callers can show tailored messages — an install hint when Helm is missing
// versus the chart's own error output when rendering fails.

/** Thrown when the `helm` binary cannot be located. */
export class HelmNotFoundError extends Error {
  constructor(searched: string[]) {
    super(
      'Could not find the `helm` binary. helmwise renders charts by shelling ' +
        'out to Helm, so it must be installed and on your PATH.\n' +
        'Install it from https://helm.sh/docs/intro/install/\n' +
        `Searched: ${searched.join(', ')}`,
    );
    this.name = 'HelmNotFoundError';
  }
}

/** Thrown when `helm template` exits non-zero (e.g. a chart or values error). */
export class HelmRenderError extends Error {
  /** Exit code returned by the helm process, if any. */
  readonly exitCode: number | null;
  /** Captured stderr from helm, which usually explains the failure. */
  readonly stderr: string;

  constructor(exitCode: number | null, stderr: string) {
    super(
      `helm template failed${exitCode !== null ? ` (exit ${exitCode})` : ''}:\n${stderr.trim()}`,
    );
    this.name = 'HelmRenderError';
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}
