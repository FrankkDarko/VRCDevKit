/** VPM package generator — domain types. No React, no DOM. */

export interface VpmConfig {
  /** Display name, e.g. "Synced Door System". */
  displayName: string;
  /** Reverse-domain package id, e.g. "com.frankk.synceddoor". */
  id: string;
  version: string;
  description: string;
  authorName: string;
  authorEmail: string;
  authorUrl: string;
  license: string;
  unity: string;
  /** GitHub repository URL, e.g. https://github.com/Owner/Repo */
  repoUrl: string;
  deps: {
    worlds: boolean;
    avatars: boolean;
    /** UdonSharp is bundled with Worlds SDK >= 3.4; raises the constraint. */
    udonsharp: boolean;
  };
}

/** One file of the asset folder, dropped (with content) or typed (path only). */
export interface TreeFile {
  path: string;
  /** Present when the user dropped real files. */
  data?: Uint8Array;
}

export function defaultVpmConfig(): VpmConfig {
  return {
    displayName: 'My VRChat Asset',
    id: 'com.example.myasset',
    version: '1.0.0',
    description: '',
    authorName: '',
    authorEmail: '',
    authorUrl: '',
    license: 'MIT',
    unity: '2022.3',
    repoUrl: '',
    deps: { worlds: true, avatars: false, udonsharp: true },
  };
}

export type VpmIssueCode =
  | 'invalid-id'
  | 'invalid-version'
  | 'missing-name'
  | 'missing-author'
  | 'invalid-repo-url'
  | 'both-sdks'
  | 'udonsharp-needs-worlds'
  | 'no-sdk'
  | 'empty-tree';

export interface VpmIssue {
  code: VpmIssueCode;
  severity: 'error' | 'warning' | 'info';
  params: Record<string, string>;
}

export interface RepoRef {
  owner: string;
  repo: string;
}

/** Derived URLs for a given config; null pieces when repoUrl is invalid. */
export interface DerivedUrls {
  listingUrl: string;
  zipName: string;
  zipUrl: string;
  vccLink: string;
}
