/**
 * File generation for the VPM starter kit (pure functions):
 * package.json (VPM manifest), index.json (repo listing), the GitHub Actions
 * release workflow, the buyer-facing README, and the full starter archive.
 */
import { createZip, type ZipEntry } from '../../lib/zip';
import { parseRepoUrl } from './validate';
import type { DerivedUrls, TreeFile, VpmConfig } from './types';

const WORLDS_MIN = '3.7.0';
const WORLDS_MIN_UDONSHARP = '3.4.0';
const AVATARS_MIN = '3.7.0';

export function deriveUrls(config: VpmConfig): DerivedUrls | null {
  const ref = parseRepoUrl(config.repoUrl);
  if (!ref) return null;
  const listingUrl = `https://${ref.owner.toLowerCase()}.github.io/${ref.repo}/index.json`;
  const zipName = `${config.id}-${config.version}.zip`;
  return {
    listingUrl,
    zipName,
    zipUrl: `https://github.com/${ref.owner}/${ref.repo}/releases/download/v${config.version}/${zipName}`,
    vccLink: `vcc://vpm/addRepo?url=${encodeURIComponent(listingUrl)}`,
  };
}

export function vpmDependencies(config: VpmConfig): Record<string, string> {
  const deps: Record<string, string> = {};
  if (config.deps.worlds) {
    // UdonSharp ships inside the Worlds SDK since 3.4 — it only raises the floor.
    const min = config.deps.udonsharp ? maxVersion(WORLDS_MIN, WORLDS_MIN_UDONSHARP) : WORLDS_MIN;
    deps['com.vrchat.worlds'] = `>=${min}`;
  }
  if (config.deps.avatars) {
    deps['com.vrchat.avatars'] = `>=${AVATARS_MIN}`;
  }
  return deps;
}

function maxVersion(a: string, b: string): string {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0) ? a : b;
  }
  return a;
}

interface PackageManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  unity: string;
  license: string;
  author: { name: string; email?: string; url?: string };
  vpmDependencies: Record<string, string>;
  url?: string;
}

function manifest(config: VpmConfig, withUrl: boolean): PackageManifest {
  const urls = deriveUrls(config);
  const author: PackageManifest['author'] = { name: config.authorName };
  if (config.authorEmail.trim() !== '') author.email = config.authorEmail.trim();
  if (config.authorUrl.trim() !== '') author.url = config.authorUrl.trim();
  const m: PackageManifest = {
    name: config.id,
    displayName: config.displayName,
    version: config.version,
    description: config.description,
    unity: config.unity,
    license: config.license,
    author,
    vpmDependencies: vpmDependencies(config),
  };
  if (withUrl && urls) m.url = urls.zipUrl;
  return m;
}

/** The package.json placed inside Packages/<id>/ (no download url there). */
export function generatePackageJson(config: VpmConfig): string {
  return JSON.stringify(manifest(config, false), null, 2) + '\n';
}

/** The VPM repository listing served on GitHub Pages. */
export function generateListing(config: VpmConfig): string {
  const urls = deriveUrls(config);
  const listing = {
    name: `${config.authorName || config.displayName} VPM Repository`,
    id: `${config.id}.repository`,
    url: urls?.listingUrl ?? '',
    author: config.authorName,
    packages: {
      [config.id]: {
        versions: {
          [config.version]: manifest(config, true),
        },
      },
    },
  };
  return JSON.stringify(listing, null, 2) + '\n';
}

export function generateWorkflow(config: VpmConfig): string {
  return `name: Release & VPM listing

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  PACKAGE_ID: ${config.id}

permissions:
  contents: write

jobs:
  # Tag v* -> zip the package folder and attach it to the GitHub release.
  release:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Zip package
        run: |
          VERSION="\${GITHUB_REF_NAME#v}"
          cd "Packages/\${PACKAGE_ID}"
          zip -r "\${GITHUB_WORKSPACE}/\${PACKAGE_ID}-\${VERSION}.zip" .
          cd "\${GITHUB_WORKSPACE}"
          sha256sum "\${PACKAGE_ID}-\${VERSION}.zip" > "\${PACKAGE_ID}-\${VERSION}.zip.sha256"

      - name: Create release with zip
        uses: softprops/action-gh-release@v2
        with:
          files: |
            \${{ env.PACKAGE_ID }}-*.zip
            \${{ env.PACKAGE_ID }}-*.zip.sha256
          generate_release_notes: true

  # Push on main -> publish Website/ (index.json listing) to GitHub Pages.
  listing:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy listing to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./Website
          force_orphan: true
`;
}

export function generateReadme(config: VpmConfig): string {
  const urls = deriveUrls(config);
  const listingUrl = urls?.listingUrl ?? 'https://<owner>.github.io/<repo>/index.json';
  const vccLink = urls?.vccLink ?? 'vcc://vpm/addRepo?url=...';
  const deps = [
    config.deps.worlds ? `- VRChat SDK — Worlds (>= ${config.deps.udonsharp ? WORLDS_MIN_UDONSHARP : WORLDS_MIN}${config.deps.udonsharp ? ', includes UdonSharp' : ''})` : null,
    config.deps.avatars ? `- VRChat SDK — Avatars (>= ${AVATARS_MIN})` : null,
  ].filter(Boolean);

  return `# ${config.displayName}

${config.description || ''}

## Installation (English)

1. Install the [VRChat Creator Companion](https://vcc.docs.vrchat.com/) (VCC).
2. Add this repository to the VCC — either click
   [Add to VCC](${vccLink}) or, in the VCC, go to
   **Settings → Packages → Add Repository** and paste:

   \`\`\`
   ${listingUrl}
   \`\`\`

3. Open your project in the VCC, click **Manage Project**, find
   **${config.displayName}** in the list and press **+**.

### Requirements

${deps.join('\n') || '- (none)'}

### Troubleshooting

- The package does not appear: make sure the repository was added (step 2)
  and refresh the package list.
- Version conflict: update the VRChat SDK from the VCC before installing.

## Installation (Français)

1. Installez le [VRChat Creator Companion](https://vcc.docs.vrchat.com/) (VCC).
2. Ajoutez ce dépôt au VCC — cliquez sur
   [Ajouter au VCC](${vccLink}) ou, dans le VCC,
   **Settings → Packages → Add Repository** et collez :

   \`\`\`
   ${listingUrl}
   \`\`\`

3. Ouvrez votre projet dans le VCC, cliquez sur **Manage Project**, trouvez
   **${config.displayName}** dans la liste et appuyez sur **+**.

### Prérequis

${deps.join('\n') || '- (aucun)'}

### Dépannage

- Le package n'apparaît pas : vérifiez que le dépôt a bien été ajouté (étape 2)
  et rafraîchissez la liste des packages.
- Conflit de version : mettez à jour le SDK VRChat depuis le VCC avant l'installation.

---

*Generated with VRC DevKit — https://frankkdarko.github.io/VRCDevKit/#/vpm*
`;
}

/** Assemble the full starter archive. */
export function buildArchive(config: VpmConfig, tree: TreeFile[]): Uint8Array {
  const pkgRoot = `Packages/${config.id}/`;
  const entries: ZipEntry[] = [
    { name: `${pkgRoot}package.json`, data: generatePackageJson(config) },
    { name: 'Website/index.json', data: generateListing(config) },
    { name: '.github/workflows/release.yml', data: generateWorkflow(config) },
    { name: 'README.md', data: generateReadme(config) },
  ];
  for (const file of tree) {
    const clean = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
    if (clean === '' || clean.endsWith('/')) continue;
    if (clean === 'package.json') continue; // ours wins at the package root
    entries.push({ name: pkgRoot + clean, data: file.data ?? '' });
  }
  return createZip(entries);
}
