/** World localization tool — domain types. No React, no DOM. */

export interface LocRow {
  key: string;
  /** language code -> text (missing cell = empty string) */
  values: Record<string, string>;
}

export interface LocTable {
  /** Language codes, column order. */
  languages: string[];
  /** Reference language (lengths are compared against it). */
  reference: string;
  rows: LocRow[];
}

export function defaultTable(): LocTable {
  return {
    languages: ['en', 'fr'],
    reference: 'en',
    rows: [
      { key: 'welcome.title', values: { en: 'Welcome!', fr: 'Bienvenue !' } },
      {
        key: 'welcome.subtitle',
        values: { en: 'Grab a drink and explore.', fr: 'Prenez un verre et explorez.' },
      },
      { key: 'door.locked', values: { en: 'Locked', fr: 'Verrouillé' } },
    ],
  };
}

export type LocIssueCode = 'empty-key' | 'duplicate-key' | 'orphan' | 'missing' | 'overflow';

export interface LocIssue {
  code: LocIssueCode;
  severity: 'error' | 'warning' | 'info';
  params: Record<string, string>;
}

/**
 * Overflow heuristic: text much longer than the reference version.
 * Both a ratio and an absolute delta are required, so short labels where a
 * few extra characters are normal (Locked -> Verrouillé) are not flagged.
 */
export const OVERFLOW_RATIO = 1.5;
export const OVERFLOW_MIN_REF_LENGTH = 4;
export const OVERFLOW_MIN_DELTA = 8;
