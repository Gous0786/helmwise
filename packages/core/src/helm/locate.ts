import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { HelmNotFoundError } from './errors.js';

const execFileAsync = promisify(execFile);

/**
 * Candidate absolute locations to probe when `helm` is not on PATH. These
 * cover common Windows package-manager install paths where the installer
 * added helm to PATH only for *new* shells (so the current process may not
 * see it yet).
 */
function fallbackCandidates(): string[] {
  const home = homedir();
  const isWindows = process.platform === 'win32';
  if (!isWindows) return [];
  return [
    // winget
    join(
      home,
      'AppData',
      'Local',
      'Microsoft',
      'WinGet',
      'Packages',
      'Helm.Helm_Microsoft.Winget.Source_8wekyb3d8bbwe',
      'windows-amd64',
      'helm.exe',
    ),
    // scoop
    join(home, 'scoop', 'shims', 'helm.exe'),
    // chocolatey
    'C:\\ProgramData\\chocolatey\\bin\\helm.exe',
  ];
}

/** Cached resolved helm path, so we probe the filesystem at most once. */
let cached: string | undefined;

/**
 * Resolve the `helm` executable to invoke.
 *
 * Resolution order:
 * 1. The `HELMWISE_HELM_PATH` env var, if set (explicit override).
 * 2. `helm` on PATH (verified by running `helm version`).
 * 3. Known package-manager fallback locations (Windows).
 *
 * @returns An absolute path or bare command name usable with `execFile`.
 * @throws {@link HelmNotFoundError} if none work.
 */
export async function locateHelm(): Promise<string> {
  if (cached) return cached;

  const searched: string[] = [];
  const candidates: string[] = [];

  const override = process.env.HELMWISE_HELM_PATH;
  if (override) candidates.push(override);
  candidates.push('helm');
  candidates.push(...fallbackCandidates());

  for (const candidate of candidates) {
    searched.push(candidate);
    // For absolute paths, a fast existence check avoids spawning a doomed process.
    if (candidate.includes('/') || candidate.includes('\\')) {
      if (!existsSync(candidate)) continue;
    }
    try {
      await execFileAsync(candidate, ['version'], { timeout: 10_000 });
      cached = candidate;
      return candidate;
    } catch {
      // Not runnable — try the next candidate.
    }
  }

  throw new HelmNotFoundError(searched);
}

/** Reset the cached helm path. Intended for tests. */
export function resetHelmCache(): void {
  cached = undefined;
}
