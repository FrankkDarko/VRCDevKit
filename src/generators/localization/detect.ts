/** Automatic issue detection on the localization table (pure functions). */
import {
  OVERFLOW_MIN_DELTA,
  OVERFLOW_MIN_REF_LENGTH,
  OVERFLOW_RATIO,
  type LocIssue,
  type LocTable,
} from './types';

export function detectIssues(table: LocTable): LocIssue[] {
  const issues: LocIssue[] = [];
  const seen = new Map<string, number>();

  table.rows.forEach((row, index) => {
    if (row.key.trim() === '') {
      issues.push({ code: 'empty-key', severity: 'error', params: { row: String(index + 1) } });
      return;
    }
    seen.set(row.key, (seen.get(row.key) ?? 0) + 1);

    const ref = (row.values[table.reference] ?? '').trim();
    if (ref === '') {
      // key exists but has no reference text — translations are orphaned
      issues.push({ code: 'orphan', severity: 'warning', params: { key: row.key } });
    }

    const missing = table.languages.filter(
      (l) => l !== table.reference && (row.values[l] ?? '').trim() === '',
    );
    if (missing.length > 0) {
      issues.push({
        code: 'missing',
        severity: 'warning',
        params: { key: row.key, langs: missing.join(', ') },
      });
    }

    if (ref.length >= OVERFLOW_MIN_REF_LENGTH) {
      for (const lang of table.languages) {
        if (lang === table.reference) continue;
        const text = (row.values[lang] ?? '').trim();
        if (
          text.length > ref.length * OVERFLOW_RATIO &&
          text.length - ref.length > OVERFLOW_MIN_DELTA
        ) {
          issues.push({
            code: 'overflow',
            severity: 'info',
            params: {
              key: row.key,
              lang,
              len: String(text.length),
              refLen: String(ref.length),
            },
          });
        }
      }
    }
  });

  for (const [key, count] of seen) {
    if (count > 1) {
      issues.push({ code: 'duplicate-key', severity: 'error', params: { key } });
    }
  }

  const order = { error: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}
