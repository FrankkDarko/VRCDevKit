import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import type { MessageKey } from '../i18n/types';
import { parseCSharpFile } from '../parser/csharp';
import { generateMarkdown, markdownToPlainText } from '../parser/markdown';
import { markdownToHtml } from '../lib/markdownHtml';
import { DOC_LANGS, type DocLang } from '../i18n/docgen';
import type { ParseFileResult } from '../parser/types';
import { EXAMPLE_FILE_NAME, EXAMPLE_SOURCE } from '../lib/exampleScript';

interface LoadedFile {
  fileName: string;
  result: ParseFileResult;
}

export function DocGen({ params }: { params: URLSearchParams }) {
  const { t, lang } = useI18n();
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [pasted, setPasted] = useState('');
  const [pasteCount, setPasteCount] = useState(0);
  const [assetName, setAssetName] = useState('');
  const [docLang, setDocLang] = useState<DocLang>(() => (lang === 'fr' ? 'fr' : 'en'));
  const [dragover, setDragover] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const demoLoaded = useRef(false);

  // ?demo=1 preloads the example (used by the README screenshots and the docs link).
  // The ref guards against StrictMode's double effect invocation.
  useEffect(() => {
    if (params.get('demo') === '1' && !demoLoaded.current) {
      demoLoaded.current = true;
      addSource(EXAMPLE_FILE_NAME, EXAMPLE_SOURCE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSource = (fileName: string, source: string) => {
    const result = parseCSharpFile(fileName, source);
    setFiles((fs) => [...fs, { fileName, result }]);
  };

  const addFiles = async (list: FileList | File[]) => {
    const skipped: string[] = [];
    for (const f of Array.from(list)) {
      if (!f.name.toLowerCase().endsWith('.cs')) {
        skipped.push(f.name);
        continue;
      }
      addSource(f.name, await f.text());
    }
    setIgnored(skipped);
  };

  const results = useMemo(() => files.map((f) => f.result), [files]);
  const markdown = useMemo(
    () => (files.length === 0 ? '' : generateMarkdown(results, docLang, assetName)),
    [files.length, results, docLang, assetName],
  );
  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  const feedback = (id: string) => {
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    feedback(id);
  };

  const download = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'INSTALL.md';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('docgen.title')}</h1>
        <p>{t('docgen.subtitle')}</p>
      </div>

      <div className="docgen-grid">
        <div>
          {/* ---- input ---- */}
          <section className="panel" aria-labelledby="dg-input-title">
            <h2 className="panel-title" id="dg-input-title">
              <span className="idx">01</span> {t('docgen.files')}
            </h2>
            <div className="panel-body">
              <label
                className={`dropzone${dragover ? ' dragover' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragover(true);
                }}
                onDragLeave={() => setDragover(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragover(false);
                  void addFiles(e.dataTransfer.files);
                }}
              >
                {t('docgen.drop')} {t('docgen.drop.or')}{' '}
                <span className="btn small" role="presentation">
                  {t('docgen.browse')}
                </span>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".cs"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) void addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>

              {ignored.map((name) => (
                <p key={name} role="alert" style={{ color: 'var(--warning)', fontSize: 12.5 }}>
                  {t('docgen.notCs', { name })}
                </p>
              ))}

              {files.length === 0 ? (
                <p style={{ color: 'var(--ink-muted)', fontSize: 12.5 }}>{t('docgen.files.empty')}</p>
              ) : (
                <ul className="file-list">
                  {files.map((f, i) => (
                    <li key={i}>
                      <strong>{f.fileName}</strong>
                      <span className="meta">
                        {t('docgen.classCount', { n: f.result.classes.length })} ·{' '}
                        {t('docgen.fieldCount', {
                          n: f.result.classes.reduce((s, c) => s + c.fields.length, 0),
                        })}
                      </span>
                      <button
                        type="button"
                        className="btn small ghost"
                        aria-label={`${t('common.remove')} ${f.fileName}`}
                        onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                        style={{ marginLeft: 'auto' }}
                      >
                        ✕
                      </button>
                      {f.result.warnings.map((w, j) => (
                        <span className="warn" key={j} role="alert">
                          ⚠ {t(`docgen.warning.${w.code}` as MessageKey, { detail: w.detail ?? '?' })}
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
              )}

              <div className="toolbar">
                <button
                  type="button"
                  className="btn small"
                  onClick={() => addSource(EXAMPLE_FILE_NAME, EXAMPLE_SOURCE)}
                >
                  {t('common.loadExample')}
                </button>
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="dg-paste-title">
            <h2 className="panel-title" id="dg-paste-title">
              <span className="idx">02</span> {t('docgen.paste')}
            </h2>
            <div className="panel-body">
              <textarea
                className="field"
                rows={6}
                aria-label={t('docgen.paste')}
                placeholder={t('docgen.paste.placeholder')}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                spellCheck={false}
              />
              <div className="toolbar">
                <button
                  type="button"
                  className="btn small"
                  disabled={pasted.trim() === ''}
                  onClick={() => {
                    addSource(`Pasted-${pasteCount + 1}.cs`, pasted);
                    setPasteCount((n) => n + 1);
                    setPasted('');
                  }}
                >
                  + {t('docgen.paste.add')}
                </button>
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="dg-options-title">
            <h2 className="panel-title" id="dg-options-title">
              <span className="idx">03</span> {t('docgen.outputLang')}
            </h2>
            <div className="panel-body">
              <div className="inline-controls">
                <div role="radiogroup" aria-label={t('docgen.outputLang')} style={{ display: 'flex', gap: 12 }}>
                  {DOC_LANGS.map((dl) => (
                    <label className="check" key={dl} style={{ padding: 0 }}>
                      <input
                        type="radio"
                        name="doclang"
                        checked={docLang === dl}
                        onChange={() => setDocLang(dl)}
                      />
                      <span className="mono">{t(`docgen.outputLang.${dl}` as MessageKey)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="inline-controls" style={{ marginTop: 12 }}>
                <label className="labelled" style={{ flex: 1 }}>
                  {t('docgen.assetName')}
                  <input
                    className="field"
                    style={{ flex: 1 }}
                    placeholder={t('docgen.assetName.placeholder')}
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                  />
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* ---- output ---- */}
        <div>
          <section className="panel" aria-labelledby="dg-output-title">
            <h2 className="panel-title" id="dg-output-title">
              <span className="idx">04</span> {t('docgen.preview.md')} / {t('docgen.preview.html')}
            </h2>
            <div className="panel-body">
              {files.length === 0 ? (
                <p style={{ color: 'var(--ink-muted)' }}>{t('docgen.empty')}</p>
              ) : (
                <>
                  <div className="toolbar" style={{ marginTop: 0 }}>
                    <button type="button" className="btn small" onClick={() => void copyText('md', markdown)}>
                      {copied === 'md' ? t('common.copied') : t('docgen.copyMd')}
                    </button>
                    <button type="button" className="btn small" onClick={download}>
                      {t('docgen.downloadMd')}
                    </button>
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => void copyText('plain', markdownToPlainText(markdown))}
                    >
                      {copied === 'plain' ? t('common.copied') : t('docgen.copyPlain')}
                    </button>
                  </div>
                  <div className="preview-duo">
                    <div>
                      <h3 className="pane-label">{t('docgen.preview.md')}</h3>
                      <pre className="md-source mono" tabIndex={0}>
                        {markdown}
                      </pre>
                    </div>
                    <div>
                      <h3 className="pane-label">{t('docgen.preview.html')}</h3>
                      <div className="md-preview" dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
