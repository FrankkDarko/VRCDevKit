/**
 * CSV codec for the localization table (pure functions).
 * Handles quoted fields, embedded delimiters/quotes/newlines, CRLF, and
 * sniffs `,` vs `;` (French spreadsheet exports) from the header row.
 */
import type { LocTable } from './types';

export function toCsv(table: LocTable, delimiter: ',' | ';' = ','): string {
  const esc = (s: string) =>
    s.includes('"') || s.includes(delimiter) || /[\n\r]/.test(s)
      ? '"' + s.replace(/"/g, '""') + '"'
      : s;
  const lines = [['key', ...table.languages].map(esc).join(delimiter)];
  for (const row of table.rows) {
    lines.push(
      [row.key, ...table.languages.map((l) => row.values[l] ?? '')].map(esc).join(delimiter),
    );
  }
  return lines.join('\r\n') + '\r\n';
}

/** Split raw CSV text into rows of fields, honoring quotes. */
function scan(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
      } else if (c === '"') {
        inQuotes = false;
        i++;
      } else {
        field += c;
        i++;
      }
    } else if (c === '"' && field === '') {
      inQuotes = true;
      i++;
    } else if (c === delimiter) {
      pushField();
      i++;
    } else if (c === '\r' && text[i + 1] === '\n') {
      pushRow();
      i += 2;
    } else if (c === '\n' || c === '\r') {
      pushRow();
      i++;
    } else {
      field += c;
      i++;
    }
  }
  if (field !== '' || row.length > 0) pushRow();
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

function sniffDelimiter(header: string): ',' | ';' {
  let commas = 0;
  let semis = 0;
  let inQuotes = false;
  for (const c of header) {
    if (c === '"') inQuotes = !inQuotes;
    else if (!inQuotes && c === ',') commas++;
    else if (!inQuotes && c === ';') semis++;
  }
  return semis > commas ? ';' : ',';
}

export function parseCsv(text: string): LocTable {
  const firstLine = text.slice(0, text.indexOf('\n') < 0 ? text.length : text.indexOf('\n'));
  const rows = scan(text, sniffDelimiter(firstLine));
  if (rows.length === 0) throw new Error('empty CSV');
  const header = rows[0].map((h) => h.trim());
  if (header.length < 2 || header[0].toLowerCase() !== 'key') {
    throw new Error('first column must be "key", then one column per language');
  }
  const languages = header.slice(1).filter((l) => l !== '');
  if (languages.length === 0) throw new Error('no language columns');
  return {
    languages,
    reference: languages[0],
    rows: rows.slice(1).map((r) => ({
      key: (r[0] ?? '').trim(),
      values: Object.fromEntries(languages.map((l, i) => [l, r[i + 1] ?? ''])),
    })),
  };
}
