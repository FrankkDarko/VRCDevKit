import { useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import type { MessageKey } from '../i18n/types';
import { Panel } from '../components/ui/Panel';
import { DiscordCta } from '../components/DiscordCta';
import { downloadFile } from '../lib/download';
import { useCopied } from '../lib/useCopied';
import { diffSchemas, validateSchema } from '../generators/playerdata/diff';
import { generateCode, sanitizeIdent } from '../generators/playerdata/codegen';
import {
  defaultSchema,
  PD_TYPES,
  type MigrationStep,
  type PdSchema,
  type PdType,
  type SchemaField,
  type SchemaWarning,
} from '../generators/playerdata/types';

const freshId = () => 'f' + Math.random().toString(36).slice(2, 10);

/** Defensive normalization of an imported schema JSON. */
function normalizeSchema(raw: unknown): PdSchema {
  const r = raw as Partial<PdSchema>;
  if (!r || !Array.isArray(r.fields)) throw new Error('not a schema');
  return {
    className: sanitizeIdent(String(r.className ?? 'PlayerSaveData')) || 'PlayerSaveData',
    keyPrefix: String(r.keyPrefix ?? 'save_'),
    version: Math.max(1, Math.floor(Number(r.version) || 1)),
    fields: r.fields.slice(0, 64).map((f): SchemaField => {
      const fr = f as Partial<SchemaField>;
      return {
        id: typeof fr.id === 'string' && fr.id !== '' ? fr.id : freshId(),
        key: String(fr.key ?? ''),
        type: PD_TYPES.includes(fr.type as PdType) ? (fr.type as PdType) : 'string',
        default: String(fr.default ?? ''),
      };
    }),
  };
}

const clone = (s: PdSchema): PdSchema => JSON.parse(JSON.stringify(s)) as PdSchema;

function stepText(step: MigrationStep, t: (k: MessageKey, p?: Record<string, string>) => string) {
  switch (step.kind) {
    case 'add':
      return t('pd.step.add', { key: step.key, type: step.type });
    case 'remove':
      return t('pd.step.remove', { key: step.key, type: step.type });
    case 'rename':
      return t('pd.step.rename', { from: step.from, to: step.to, type: step.type });
    case 'retype':
      return t('pd.step.retype', { key: step.key, from: step.fromType, to: step.toType });
    case 'rename-retype':
      return t('pd.step.rename-retype', {
        from: step.from,
        to: step.to,
        fromType: step.fromType,
        toType: step.toType,
      });
  }
}

export function PlayerData() {
  const { t } = useI18n();
  const [schema, setSchema] = useState<PdSchema>(defaultSchema);
  const [baseline, setBaseline] = useState<PdSchema | null>(null);
  const [notice, setNotice] = useState<MessageKey | null>(null);
  const { copied, copy } = useCopied();
  const importInput = useRef<HTMLInputElement>(null);
  const baselineInput = useRef<HTMLInputElement>(null);

  const validation = useMemo(() => validateSchema(schema), [schema]);
  const plan = useMemo(
    () => (baseline ? diffSchemas(baseline, schema) : null),
    [baseline, schema],
  );
  const code = useMemo(() => generateCode(schema, plan), [schema, plan]);
  const warnings: SchemaWarning[] = [...validation, ...(plan?.warnings ?? [])];

  const patchField = (i: number, patch: Partial<SchemaField>) =>
    setSchema((s) => ({
      ...s,
      fields: s.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)),
    }));

  const importFile = async (file: File, asBaseline: boolean) => {
    try {
      const imported = normalizeSchema(JSON.parse(await file.text()));
      setNotice(null);
      if (asBaseline) {
        setBaseline(imported);
        const next = clone(imported);
        next.version = imported.version + 1;
        setSchema(next);
      } else {
        setSchema(imported);
      }
    } catch {
      setNotice('pd.importError');
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('pd.title')}</h1>
        <p>{t('pd.subtitle')}</p>
      </div>

      {notice && (
        <p role="alert" className="issue" data-severity="warning">
          {t(notice)}
        </p>
      )}

      <div className="sim-grid">
        <div>
          <Panel idx="01" title={t('pd.schema')}>
            <div className="inline-controls" style={{ marginBottom: 12 }}>
              <label className="labelled">
                {t('pd.className')}
                <input
                  className="field"
                  value={schema.className}
                  onChange={(e) => setSchema((s) => ({ ...s, className: e.target.value }))}
                />
              </label>
              <label className="labelled">
                {t('pd.keyPrefix')}
                <input
                  className="field"
                  style={{ width: 90 }}
                  value={schema.keyPrefix}
                  onChange={(e) => setSchema((s) => ({ ...s, keyPrefix: e.target.value }))}
                />
              </label>
              <label className="labelled">
                {t('pd.version')}
                <input
                  className="field"
                  style={{ width: 64 }}
                  inputMode="numeric"
                  value={schema.version}
                  onChange={(e) =>
                    setSchema((s) => ({
                      ...s,
                      version: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                    }))
                  }
                />
              </label>
            </div>
            <table className="grid">
              <thead>
                <tr>
                  <th scope="col">{t('pd.field.key')}</th>
                  <th scope="col">{t('pd.field.type')}</th>
                  <th scope="col">{t('pd.field.default')}</th>
                  <th scope="col">
                    <span className="visually-hidden">{t('common.remove')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {schema.fields.map((f, i) => (
                  <tr className="var-row" key={f.id}>
                    <td>
                      <input
                        className="field"
                        style={{ width: '100%' }}
                        aria-label={t('pd.field.key')}
                        value={f.key}
                        onChange={(e) => patchField(i, { key: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="field"
                        aria-label={t('pd.field.type')}
                        value={f.type}
                        onChange={(e) => patchField(i, { type: e.target.value as PdType })}
                      >
                        {PD_TYPES.map((pt) => (
                          <option key={pt}>{pt}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="field"
                        style={{ width: '100%' }}
                        aria-label={t('pd.field.default')}
                        value={f.default}
                        disabled={f.type === 'array'}
                        onChange={(e) => patchField(i, { default: e.target.value })}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn small ghost"
                        aria-label={`${t('common.remove')} ${f.key}`}
                        onClick={() =>
                          setSchema((s) => ({ ...s, fields: s.fields.filter((_, j) => j !== i) }))
                        }
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="toolbar">
              <button
                type="button"
                className="btn small"
                onClick={() =>
                  setSchema((s) => ({
                    ...s,
                    fields: [
                      ...s.fields,
                      { id: freshId(), key: `key${s.fields.length}`, type: 'int', default: '0' },
                    ],
                  }))
                }
              >
                + {t('pd.addField')}
              </button>
              <button
                type="button"
                className="btn small"
                onClick={() =>
                  downloadFile(
                    `${sanitizeIdent(schema.className) || 'schema'}.schema.json`,
                    JSON.stringify(schema, null, 2),
                    'application/json',
                  )
                }
              >
                {t('common.export')}
              </button>
              <button type="button" className="btn small" onClick={() => importInput.current?.click()}>
                {t('common.import')}
              </button>
              <input
                ref={importInput}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importFile(f, false);
                  e.target.value = '';
                }}
              />
            </div>
          </Panel>

          <Panel idx="02" title={t('pd.migration')}>
            {baseline ? (
              <p className="pd-baseline" role="status">
                {t('pd.baseline.active', { v: String(baseline.version) })}
              </p>
            ) : (
              <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginTop: 0 }}>
                {t('pd.baseline.none')}
              </p>
            )}
            <div className="toolbar">
              <button type="button" className="btn small" onClick={() => baselineInput.current?.click()}>
                {t('pd.baseline.load')}
              </button>
              <input
                ref={baselineInput}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importFile(f, true);
                  e.target.value = '';
                }}
              />
              {!baseline && (
                <button
                  type="button"
                  className="btn small"
                  onClick={() => {
                    setBaseline(clone(schema));
                    setSchema((s) => ({ ...s, version: s.version + 1 }));
                  }}
                >
                  {t('pd.baseline.snapshot')}
                </button>
              )}
              {baseline && (
                <button type="button" className="btn small ghost" onClick={() => setBaseline(null)}>
                  {t('pd.baseline.clear')}
                </button>
              )}
            </div>
            {plan && (
              <>
                <h3 className="qt-fix-title">{t('pd.steps')}</h3>
                {plan.steps.length === 0 ? (
                  <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{t('pd.steps.none')}</p>
                ) : (
                  <ul className="pd-steps mono">
                    {plan.steps.map((step, i) => (
                      <li key={i} data-kind={step.kind}>
                        {stepText(step, t)}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Panel>
        </div>

        <div>
          <Panel idx="03" title={t('pd.code')}>
            {warnings.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {warnings.map((w, i) => (
                  <article className="issue" data-severity={w.severity} key={i}>
                    <div className="issue-head">
                      <span className="sev">{t(`sim.severity.${w.severity}` as MessageKey)}</span>
                      <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                        {t(`pd.warn.${w.code}` as MessageKey, w.params)}
                      </h3>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="toolbar" style={{ marginTop: 0 }}>
              <button type="button" className="btn small" onClick={() => void copy('code', code)}>
                {copied === 'code' ? t('common.copied') : t('pd.copyCode')}
              </button>
              <button
                type="button"
                className="btn small"
                onClick={() =>
                  downloadFile(`${sanitizeIdent(schema.className) || 'PlayerSaveData'}.cs`, code, 'text/plain')
                }
              >
                {t('pd.downloadCs')}
              </button>
            </div>
            <pre className="md-source mono" tabIndex={0}>
              {code}
            </pre>
          </Panel>
        </div>
      </div>
      <DiscordCta />
    </div>
  );
}
