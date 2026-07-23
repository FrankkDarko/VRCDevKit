import { useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import type { MessageKey } from '../i18n/types';
import { Panel } from '../components/ui/Panel';
import { DiscordCta } from '../components/DiscordCta';
import { downloadFile } from '../lib/download';
import { useCopied } from '../lib/useCopied';
import { validateVpm } from '../generators/vpm/validate';
import {
  buildArchive,
  deriveUrls,
  generateListing,
  generatePackageJson,
  generateReadme,
  generateWorkflow,
} from '../generators/vpm/generate';
import { defaultVpmConfig, type TreeFile, type VpmConfig } from '../generators/vpm/types';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 30 * 1024 * 1024;

const OUTPUT_FILES = ['package.json', 'index.json', 'release.yml', 'README.md'] as const;
type OutputFile = (typeof OUTPUT_FILES)[number];

/** Recursively collect files from a dropped directory entry. */
async function readEntry(entry: FileSystemEntry, prefix: string, out: File[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject),
    );
    Object.defineProperty(file, '_relPath', { value: prefix + entry.name });
    out.push(file);
  } else if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      if (batch.length === 0) break;
      for (const child of batch) await readEntry(child, prefix + entry.name + '/', out);
    }
  }
}

export function Vpm() {
  const { t } = useI18n();
  const [config, setConfig] = useState<VpmConfig>(defaultVpmConfig);
  const [tree, setTree] = useState<TreeFile[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [pastedPaths, setPastedPaths] = useState('');
  const [activeFile, setActiveFile] = useState<OutputFile>('package.json');
  const [dragover, setDragover] = useState(false);
  const { copied, copy } = useCopied();
  const folderInput = useRef<HTMLInputElement>(null);

  const issues = useMemo(() => validateVpm(config, tree), [config, tree]);
  const hasErrors = issues.some((i) => i.severity === 'error');
  const urls = useMemo(() => deriveUrls(config), [config]);

  const outputs = useMemo<Record<OutputFile, string>>(
    () => ({
      'package.json': generatePackageJson(config),
      'index.json': generateListing(config),
      'release.yml': generateWorkflow(config),
      'README.md': generateReadme(config),
    }),
    [config],
  );

  const addFiles = async (files: { path: string; file: File }[]) => {
    let total = tree.reduce((s, f) => s + (f.data?.length ?? 0), 0);
    let skippedCount = 0;
    const added: TreeFile[] = [];
    for (const { path, file } of files) {
      if (file.size > MAX_FILE_BYTES || total + file.size > MAX_TOTAL_BYTES) {
        skippedCount++;
        continue;
      }
      total += file.size;
      added.push({ path, data: new Uint8Array(await file.arrayBuffer()) });
    }
    setSkipped(skippedCount);
    setTree((prev) => [...prev, ...added]);
  };

  const patch = (p: Partial<VpmConfig>) => setConfig((c) => ({ ...c, ...p }));
  const totalKb = Math.round(tree.reduce((s, f) => s + (f.data?.length ?? 0), 0) / 1024);

  const field = (
    labelKey: MessageKey,
    value: string,
    onChange: (v: string) => void,
    opts: { placeholder?: string; width?: number | string } = {},
  ) => (
    <label className="labelled" style={{ flex: opts.width ? undefined : 1 }}>
      {t(labelKey)}
      <input
        className="field"
        style={{ width: opts.width ?? '100%', flex: opts.width ? undefined : 1 }}
        placeholder={opts.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('vpm.title')}</h1>
        <p>{t('vpm.subtitle')}</p>
      </div>

      <div className="sim-grid">
        <div>
          <Panel idx="01" title={t('vpm.package')}>
            <div className="vpm-form">
              <div className="inline-controls">
                {field('vpm.displayName', config.displayName, (v) => patch({ displayName: v }))}
                {field('vpm.version', config.version, (v) => patch({ version: v }), { width: 90 })}
              </div>
              <div className="inline-controls">
                {field('vpm.id', config.id, (v) => patch({ id: v }), {
                  placeholder: t('vpm.id.placeholder'),
                })}
              </div>
              <div className="inline-controls">
                {field('vpm.repoUrl', config.repoUrl, (v) => patch({ repoUrl: v }), {
                  placeholder: t('vpm.repoUrl.placeholder'),
                })}
              </div>
              <div className="inline-controls">
                {field('vpm.authorName', config.authorName, (v) => patch({ authorName: v }))}
                {field('vpm.authorEmail', config.authorEmail, (v) => patch({ authorEmail: v }))}
              </div>
              <div className="inline-controls">
                {field('vpm.authorUrl', config.authorUrl, (v) => patch({ authorUrl: v }))}
                {field('vpm.license', config.license, (v) => patch({ license: v }), { width: 70 })}
                {field('vpm.unity', config.unity, (v) => patch({ unity: v }), { width: 80 })}
              </div>
              <label className="labelled" style={{ alignItems: 'flex-start' }}>
                {t('vpm.description')}
                <textarea
                  className="field"
                  rows={2}
                  style={{ flex: 1 }}
                  value={config.description}
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </label>
              <fieldset className="vpm-deps">
                <legend className="pane-label">{t('vpm.deps')}</legend>
                {(['worlds', 'avatars', 'udonsharp'] as const).map((d) => (
                  <label className="check" key={d}>
                    <input
                      type="checkbox"
                      checked={config.deps[d]}
                      onChange={(e) =>
                        setConfig((c) => ({ ...c, deps: { ...c.deps, [d]: e.target.checked } }))
                      }
                    />
                    <span>{t(`vpm.deps.${d}` as MessageKey)}</span>
                  </label>
                ))}
              </fieldset>
            </div>
          </Panel>

          <Panel idx="02" title={t('vpm.tree')}>
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
                void (async () => {
                  const collected: File[] = [];
                  for (const item of Array.from(e.dataTransfer.items)) {
                    const entry = item.webkitGetAsEntry?.();
                    if (entry) await readEntry(entry, '', collected);
                  }
                  await addFiles(
                    collected.map((f) => ({
                      path: (f as File & { _relPath?: string })._relPath ?? f.name,
                      file: f,
                    })),
                  );
                })();
              }}
            >
              {t('vpm.tree.drop')}{' '}
              <span className="btn small" role="presentation">
                {t('vpm.tree.browse')}
              </span>
              <input
                ref={folderInput}
                type="file"
                multiple
                style={{ display: 'none' }}
                {...({ webkitdirectory: '' } as Record<string, string>)}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  void addFiles(
                    files.map((f) => ({
                      path: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
                      file: f,
                    })),
                  );
                  e.target.value = '';
                }}
              />
            </label>

            {tree.length > 0 && (
              <p className="mono" style={{ fontSize: 12.5 }}>
                {t('vpm.tree.count', { n: tree.length, size: totalKb })}
                <button
                  type="button"
                  className="btn small ghost"
                  style={{ marginLeft: 10 }}
                  onClick={() => {
                    setTree([]);
                    setSkipped(0);
                  }}
                >
                  {t('vpm.tree.clear')}
                </button>
              </p>
            )}
            {skipped > 0 && (
              <p role="alert" style={{ color: 'var(--warning)', fontSize: 12.5 }}>
                {t('vpm.tree.skipped', { n: skipped })}
              </p>
            )}
            {tree.length > 0 && (
              <ul className="vpm-tree mono">
                {tree.slice(0, 40).map((f, i) => (
                  <li key={i}>{f.path}</li>
                ))}
                {tree.length > 40 && <li>… (+{tree.length - 40})</li>}
              </ul>
            )}

            <label className="labelled" style={{ alignItems: 'flex-start', marginTop: 12 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>{t('vpm.tree.paste')}</span>
              <textarea
                className="field"
                rows={3}
                style={{ flex: 1, width: '100%' }}
                value={pastedPaths}
                onChange={(e) => setPastedPaths(e.target.value)}
                spellCheck={false}
              />
            </label>
            <div className="toolbar">
              <button
                type="button"
                className="btn small"
                disabled={pastedPaths.trim() === ''}
                onClick={() => {
                  const paths = pastedPaths
                    .split('\n')
                    .map((p) => p.trim())
                    .filter(Boolean);
                  setTree((prev) => [...prev, ...paths.map((path) => ({ path }))]);
                  setPastedPaths('');
                }}
              >
                + {t('vpm.tree.addPaths')}
              </button>
            </div>
          </Panel>

          <Panel idx="03" title={t('vpm.validation')}>
            {issues.length === 0 ? (
              <p className="ok-banner" role="status">
                ✓ {t('vpm.validation.ok')}
              </p>
            ) : (
              issues.map((issue, i) => (
                <article className="issue" data-severity={issue.severity} key={i}>
                  <div className="issue-head">
                    <span className="sev">{t(`sim.severity.${issue.severity}` as MessageKey)}</span>
                    <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                      {t(`vpm.issue.${issue.code}` as MessageKey, issue.params)}
                    </h3>
                  </div>
                </article>
              ))
            )}
          </Panel>
        </div>

        <div>
          <Panel idx="04" title={t('vpm.outputs')}>
            {urls && (
              <p className="pd-baseline mono" style={{ wordBreak: 'break-all' }}>
                {t('vpm.listingUrl')} : {urls.listingUrl}
              </p>
            )}
            <div className="toolbar" style={{ marginTop: 0 }}>
              <button
                type="button"
                className="btn primary"
                disabled={hasErrors}
                onClick={() =>
                  downloadFile(
                    `${config.id}-vpm-starter.zip`,
                    buildArchive(config, tree),
                    'application/zip',
                  )
                }
              >
                {t('vpm.downloadZip')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => void copy(activeFile, outputs[activeFile])}
              >
                {copied === activeFile ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <div className="preview-tabs" role="tablist">
              {OUTPUT_FILES.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={activeFile === f}
                  onClick={() => setActiveFile(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <pre className="md-source mono" tabIndex={0}>
              {outputs[activeFile]}
            </pre>
          </Panel>
        </div>
      </div>
      <DiscordCta />
    </div>
  );
}
