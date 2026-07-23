import { describe, expect, it } from 'vitest';
import { ID_RE, SEMVER_RE, parseRepoUrl, validateVpm } from '../generators/vpm/validate';
import {
  buildArchive,
  deriveUrls,
  generateListing,
  generatePackageJson,
  generateReadme,
  generateWorkflow,
  vpmDependencies,
} from '../generators/vpm/generate';
import { defaultVpmConfig, type VpmConfig } from '../generators/vpm/types';

const config = (over: Partial<VpmConfig> = {}): VpmConfig => ({
  ...defaultVpmConfig(),
  displayName: 'Synced Door',
  id: 'com.frankk.synceddoor',
  version: '1.2.0',
  description: 'A synced door system.',
  authorName: 'Frankk Darko',
  repoUrl: 'https://github.com/FrankkDarko/SyncedDoor',
  ...over,
});

describe('validators', () => {
  it('accepts valid ids and rejects malformed ones', () => {
    expect(ID_RE.test('com.frankk.synceddoor')).toBe(true);
    expect(ID_RE.test('io.github.frankk-darko.door2')).toBe(true);
    expect(ID_RE.test('com.frankk')).toBe(false); // 2 segments only
    expect(ID_RE.test('Com.Frankk.Door')).toBe(false); // uppercase
    expect(ID_RE.test('com..door')).toBe(false);
    expect(ID_RE.test('com.frankk.')).toBe(false);
  });

  it('validates semver including prerelease and build', () => {
    expect(SEMVER_RE.test('1.0.0')).toBe(true);
    expect(SEMVER_RE.test('0.1.9-beta.1')).toBe(true);
    expect(SEMVER_RE.test('2.0.0+build.5')).toBe(true);
    expect(SEMVER_RE.test('1.0')).toBe(false);
    expect(SEMVER_RE.test('v1.0.0')).toBe(false);
    expect(SEMVER_RE.test('1.01.0')).toBe(false);
  });

  it('parses GitHub repo URLs', () => {
    expect(parseRepoUrl('https://github.com/Owner/Repo')).toEqual({ owner: 'Owner', repo: 'Repo' });
    expect(parseRepoUrl('https://github.com/Owner/Repo.git')).toEqual({ owner: 'Owner', repo: 'Repo' });
    expect(parseRepoUrl('https://gitlab.com/o/r')).toBeNull();
    expect(parseRepoUrl('github.com/o/r')).toBeNull();
  });

  it('checks dependency coherence', () => {
    const codes = (c: VpmConfig) => validateVpm(c, [{ path: 'a.cs' }]).map((i) => i.code);
    expect(codes(config({ deps: { worlds: false, avatars: false, udonsharp: false } }))).toContain('no-sdk');
    expect(codes(config({ deps: { worlds: true, avatars: true, udonsharp: false } }))).toContain('both-sdks');
    expect(codes(config({ deps: { worlds: false, avatars: true, udonsharp: true } }))).toContain(
      'udonsharp-needs-worlds',
    );
    expect(codes(config())).toHaveLength(0);
  });

  it('flags an empty tree as info only', () => {
    const issues = validateVpm(config(), []);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: 'empty-tree', severity: 'info' });
  });
});

describe('generation', () => {
  const c = config();

  it('derives listing, zip and vcc URLs', () => {
    const urls = deriveUrls(c)!;
    expect(urls.listingUrl).toBe('https://frankkdarko.github.io/SyncedDoor/index.json');
    expect(urls.zipUrl).toBe(
      'https://github.com/FrankkDarko/SyncedDoor/releases/download/v1.2.0/com.frankk.synceddoor-1.2.0.zip',
    );
    expect(urls.vccLink).toContain('vcc://vpm/addRepo?url=');
  });

  it('maps dependencies, with UdonSharp raising the Worlds floor', () => {
    expect(vpmDependencies(c)).toEqual({ 'com.vrchat.worlds': '>=3.7.0' });
    const noUdon = config({ deps: { worlds: true, avatars: false, udonsharp: false } });
    expect(vpmDependencies(noUdon)).toEqual({ 'com.vrchat.worlds': '>=3.7.0' });
    const both = config({ deps: { worlds: true, avatars: true, udonsharp: false } });
    expect(vpmDependencies(both)['com.vrchat.avatars']).toBe('>=3.7.0');
  });

  it('emits a valid VPM package.json without a url field', () => {
    const pkg = JSON.parse(generatePackageJson(c));
    expect(pkg.name).toBe('com.frankk.synceddoor');
    expect(pkg.displayName).toBe('Synced Door');
    expect(pkg.version).toBe('1.2.0');
    expect(pkg.author).toEqual({ name: 'Frankk Darko' });
    expect(pkg.vpmDependencies['com.vrchat.worlds']).toBe('>=3.7.0');
    expect(pkg.url).toBeUndefined();
  });

  it('emits a listing embedding the versioned manifest with its zip url', () => {
    const listing = JSON.parse(generateListing(c));
    expect(listing.id).toBe('com.frankk.synceddoor.repository');
    expect(listing.url).toBe('https://frankkdarko.github.io/SyncedDoor/index.json');
    const entry = listing.packages['com.frankk.synceddoor'].versions['1.2.0'];
    expect(entry.url).toContain('/releases/download/v1.2.0/');
  });

  it('emits a workflow zipping the right folder and deploying the listing', () => {
    const yml = generateWorkflow(c);
    expect(yml).toContain('PACKAGE_ID: com.frankk.synceddoor');
    expect(yml).toContain("startsWith(github.ref, 'refs/tags/v')");
    expect(yml).toContain('softprops/action-gh-release@v2');
    expect(yml).toContain('peaceiris/actions-gh-pages@v4');
    expect(yml).toContain('publish_dir: ./Website');
    expect(yml).toContain('sha256sum');
  });

  it('emits a bilingual README with the listing URL and vcc link', () => {
    const md = generateReadme(c);
    expect(md).toContain('https://frankkdarko.github.io/SyncedDoor/index.json');
    expect(md).toContain('vcc://vpm/addRepo');
    expect(md).toContain('## Installation (English)');
    expect(md).toContain('## Installation (Français)');
    expect(md).toContain('includes UdonSharp');
  });

  it('builds an archive containing the four files plus the tree', () => {
    const zip = buildArchive(c, [
      { path: 'Runtime/Door.cs', data: new TextEncoder().encode('// code') },
      { path: 'package.json' }, // must be ignored (ours wins)
    ]);
    const text = new TextDecoder('latin1').decode(zip);
    expect(text).toContain('Packages/com.frankk.synceddoor/package.json');
    expect(text).toContain('Website/index.json');
    expect(text).toContain('.github/workflows/release.yml');
    expect(text).toContain('README.md');
    expect(text).toContain('Packages/com.frankk.synceddoor/Runtime/Door.cs');
    // the top-level package.json from the tree was skipped: only one occurrence pair
    const count = text.split('Packages/com.frankk.synceddoor/package.json').length - 1;
    expect(count).toBe(2); // local header + central directory, not a third from the tree
  });
});
