import { useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import type { MessageKey } from '../i18n/types';
import { Panel } from '../components/ui/Panel';
import { DiscordCta } from '../components/DiscordCta';
import { downloadFile } from '../lib/download';
import { useCopied } from '../lib/useCopied';
import { markdownToHtml } from '../lib/markdownHtml';
import { parseCsv, toCsv } from '../generators/localization/csv';
import { detectIssues } from '../generators/localization/detect';
import {
  generateLocalizationScript,
  toRuntimeJson,
} from '../generators/localization/codegen';
import { defaultTable, type LocTable } from '../generators/localization/types';

function normalizeTable(raw: unknown): LocTable {
  const r = raw as Partial<LocTable>;
  if (!r || !Array.isArray(r.languages) || !Array.isArray(r.rows) || r.languages.length === 0) {
    throw new Error('not a localization table');
  }
  const languages = r.languages.map((l) => String(l)).filter(Boolean).slice(0, 12);
  return {
    languages,
    reference: languages.includes(String(r.reference)) ? String(r.reference) : languages[0],
    rows: r.rows.slice(0, 2000).map((row) => {
      const rr = row as Partial<LocTable['rows'][number]>;
      return {
        key: String(rr.key ?? ''),
        values: Object.fromEntries(
          languages.map((l) => [l, String((rr.values as Record<string, unknown>)?.[l] ?? '')]),
        ),
      };
    }),
  };
}

export function Localization() {
  const { t } = useI18n();
  const [table, setTable] = useState<LocTable>(defaultTable);
  const [newLang, setNewLang] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const { copied, copy } = useCopied();
  const csvInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);

  const issues = useMemo(() => detectIssues(table), [table]);
  const script = useMemo(() => generateLocalizationScript(table), [table]);
  const noteMd = t('loc.note.md');
  const noteHtml = useMemo(() => markdownToHtml(noteMd), [noteMd]);

  const patchCell = (rowIdx: number, lang: string, value: string) =>
    setTable((tb) => ({
      ...tb,
      rows: tb.rows.map((r, i) =>
        i === rowIdx ? { ...r, values: { ...r.values, [lang]: value } } : r,
      ),
    }));

  const addLanguage = () => {
    const code = newLang.trim().toLowerCase();
    if (code === '') return;
    if (table.languages.includes(code)) {
      setNotice(t('loc.langExists'));
      return;
    }
    setNotice(null);
    setNewLang('');
    setTable((tb) => ({
      ...tb,
      languages: [...tb.languages, code],
      rows: tb.rows.map((r) => ({ ...r, values: { ...r.values, [code]: '' } })),
    }));
  };

  const removeLanguage = (code: string) =>
    setTable((tb) => {
      if (tb.languages.length <= 1) return tb;
      const languages = tb.languages.filter((l) => l !== code);
      return {
        languages,
        reference: tb.reference === code ? languages[0] : tb.reference,
        rows: tb.rows.map((r) => {
          const values = { ...r.values };
          delete values[code];
          return { ...r, values };
        }),
      };
    });

  const importFile = async (file: File, kind: 'csv' | 'json') => {
    try {
      const text = await file.text();
      setTable(kind === 'csv' ? parseCsv(text) : normalizeTable(JSON.parse(text)));
      setNotice(null);
    } catch (e) {
      setNotice(t('loc.importError', { detail: e instanceof Error ? e.message : '?' }));
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('loc.title')}</h1>
        <p>{t('loc.subtitle')}</p>
      </div>

      {notice && (
        <p role="alert" className="issue" data-severity="warning">
          {notice}
        </p>
      )}

      <Panel idx="01" title={t('loc.languages')}>
        <div className="loc-langs">
          {table.languages.map((code) => (
            <span className="loc-lang" key={code}>
              <label className="check" style={{ padding: 0 }}>
                <input
                  type="radio"
                  name="reference"
                  checked={table.reference === code}
                  onChange={() => setTable((tb) => ({ ...tb, reference: code }))}
                  aria-label={`${t('loc.reference')} ${code}`}
                />
                <span className="mono">{code}</span>
              </label>
              {table.languages.length > 1 && (
                <button
                  type="button"
                  className="btn small ghost"
                  aria-label={`${t('common.remove')} ${code}`}
                  onClick={() => removeLanguage(code)}
                >
                  ✕
                </button>
              )}
            </span>
          ))}
          <span className="loc-lang">
            <input
              className="field"
              style={{ width: 110 }}
              placeholder={t('loc.langCode')}
              value={newLang}
              onChange={(e) => setNewLang(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addLanguage();
              }}
              aria-label={t('loc.langCode')}
            />
            <button type="button" className="btn small" onClick={addLanguage}>
              + {t('loc.addLanguage')}
            </button>
          </span>
          <small style={{ color: 'var(--ink-muted)' }}>
            ◉ = {t('loc.reference').toLowerCase()}
          </small>
        </div>
      </Panel>

      <Panel idx="02" title={t('loc.table')}>
        <div className="loc-wrap">
          <table className="grid loc-grid">
            <thead>
              <tr>
                <th scope="col">{t('loc.key')}</th>
                {table.languages.map((l) => (
                  <th scope="col" key={l} className="mono">
                    {l}
                    {l === table.reference ? ' ◉' : ''}
                  </th>
                ))}
                <th scope="col">
                  <span className="visually-hidden">{t('common.remove')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr className="var-row" key={i}>
                  <td>
                    <input
                      className="field mono"
                      style={{ width: '100%' }}
                      aria-label={t('loc.key')}
                      value={row.key}
                      onChange={(e) =>
                        setTable((tb) => ({
                          ...tb,
                          rows: tb.rows.map((r, j) =>
                            j === i ? { ...r, key: e.target.value } : r,
                          ),
                        }))
                      }
                    />
                  </td>
                  {table.languages.map((l) => (
                    <td key={l}>
                      <input
                        className="field"
                        style={{ width: '100%' }}
                        aria-label={`${row.key || t('loc.key')} — ${l}`}
                        value={row.values[l] ?? ''}
                        onChange={(e) => patchCell(i, l, e.target.value)}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      type="button"
                      className="btn small ghost"
                      aria-label={`${t('common.remove')} ${row.key}`}
                      onClick={() =>
                        setTable((tb) => ({ ...tb, rows: tb.rows.filter((_, j) => j !== i) }))
                      }
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="toolbar">
          <button
            type="button"
            className="btn small"
            onClick={() =>
              setTable((tb) => ({
                ...tb,
                rows: [
                  ...tb.rows,
                  {
                    key: '',
                    values: Object.fromEntries(tb.languages.map((l) => [l, ''])),
                  },
                ],
              }))
            }
          >
            + {t('loc.addRow')}
          </button>
          <button type="button" className="btn small" onClick={() => csvInput.current?.click()}>
            {t('loc.importCsv')}
          </button>
          <button
            type="button"
            className="btn small"
            onClick={() => downloadFile('translations.csv', toCsv(table), 'text/csv')}
          >
            {t('loc.exportCsv')}
          </button>
          <button type="button" className="btn small" onClick={() => jsonInput.current?.click()}>
            {t('common.import')}
          </button>
          <button
            type="button"
            className="btn small"
            onClick={() =>
              downloadFile('translations.json', JSON.stringify(table, null, 2), 'application/json')
            }
          >
            {t('common.export')}
          </button>
          <input
            ref={csvInput}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f, 'csv');
              e.target.value = '';
            }}
          />
          <input
            ref={jsonInput}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f, 'json');
              e.target.value = '';
            }}
          />
        </div>
      </Panel>

      <Panel idx="03" title={t('loc.issues')}>
        {issues.length === 0 ? (
          <p className="ok-banner" role="status">
            ✓ {t('loc.issues.none')}
          </p>
        ) : (
          issues.map((issue, i) => (
            <article className="issue" data-severity={issue.severity} key={i}>
              <div className="issue-head">
                <span className="sev">{t(`sim.severity.${issue.severity}` as MessageKey)}</span>
                <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                  {t(`loc.issue.${issue.code}` as MessageKey, issue.params)}
                </h3>
              </div>
            </article>
          ))
        )}
      </Panel>

      <Panel idx="04" title={t('loc.outputs')}>
        <div className="toolbar" style={{ marginTop: 0 }}>
          <button
            type="button"
            className="btn small"
            onClick={() =>
              downloadFile('LocalizedStrings.json', toRuntimeJson(table), 'application/json')
            }
          >
            {t('loc.downloadJson')}
          </button>
          <button type="button" className="btn small" onClick={() => void copy('script', script)}>
            {copied === 'script' ? t('common.copied') : t('loc.copyScript')}
          </button>
          <button
            type="button"
            className="btn small"
            onClick={() => downloadFile('WorldLocalization.cs', script, 'text/plain')}
          >
            {t('loc.downloadScript')}
          </button>
          <button
            type="button"
            className="btn small"
            onClick={() => downloadFile('LOCALIZATION.md', noteMd, 'text/markdown')}
          >
            {t('loc.downloadNote')}
          </button>
        </div>
        <div className="preview-duo">
          <div>
            <h3 className="pane-label">WorldLocalization.cs</h3>
            <pre className="md-source mono" tabIndex={0}>
              {script}
            </pre>
          </div>
          <div>
            <h3 className="pane-label">{t('loc.note')}</h3>
            <div className="md-preview" dangerouslySetInnerHTML={{ __html: noteHtml }} />
          </div>
        </div>
      </Panel>

      <DiscordCta />
    </div>
  );
}
