/** Input validation for the VPM generator (pure functions). */
import type { RepoRef, TreeFile, VpmConfig, VpmIssue } from './types';

/** Reverse-domain id: at least 3 lowercase segments (com.author.package). */
export const ID_RE = /^[a-z0-9]+(\.[a-z0-9][a-z0-9-]*){2,}$/;

/** Full semver: major.minor.patch with optional prerelease/build. */
export const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export function parseRepoUrl(url: string): RepoRef | null {
  const m = url
    .trim()
    .match(/^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

export function validateVpm(config: VpmConfig, tree: TreeFile[]): VpmIssue[] {
  const issues: VpmIssue[] = [];

  if (config.displayName.trim() === '') {
    issues.push({ code: 'missing-name', severity: 'error', params: {} });
  }
  if (!ID_RE.test(config.id)) {
    issues.push({ code: 'invalid-id', severity: 'error', params: { id: config.id || '∅' } });
  }
  if (!SEMVER_RE.test(config.version)) {
    issues.push({
      code: 'invalid-version',
      severity: 'error',
      params: { version: config.version || '∅' },
    });
  }
  if (config.authorName.trim() === '') {
    issues.push({ code: 'missing-author', severity: 'error', params: {} });
  }
  if (parseRepoUrl(config.repoUrl) === null) {
    issues.push({
      code: 'invalid-repo-url',
      severity: 'error',
      params: { url: config.repoUrl || '∅' },
    });
  }

  const { worlds, avatars, udonsharp } = config.deps;
  if (!worlds && !avatars) {
    issues.push({ code: 'no-sdk', severity: 'warning', params: {} });
  }
  if (worlds && avatars) {
    issues.push({ code: 'both-sdks', severity: 'warning', params: {} });
  }
  if (udonsharp && !worlds) {
    issues.push({ code: 'udonsharp-needs-worlds', severity: 'error', params: {} });
  }

  if (tree.length === 0) {
    issues.push({ code: 'empty-tree', severity: 'info', params: {} });
  }

  const order = { error: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}
