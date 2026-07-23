import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n, type Translate } from '../i18n';
import type { MessageKey } from '../i18n/types';
import { simulate } from '../engine/simulator';
import { buildScenario, SCENARIO_IDS, type ScenarioId } from '../engine/scenarios';
import { defaultConfig } from '../engine/defaults';
import { decodeState, encodeState } from '../lib/serialize';
import { replaceHashParams } from '../router';
import { DiscordCta } from '../components/DiscordCta';
import { downloadFile } from '../lib/download';
import { useCopied } from '../lib/useCopied';
import type {
  ActionType,
  Scenario,
  ScenarioAction,
  SimConfig,
  SimResult,
  SyncMode,
  SyncedVariable,
  VarType,
} from '../engine/types';

const VAR_TYPES: VarType[] = ['bool', 'int', 'float', 'string', 'Vector3', 'array'];
const ACTION_TYPES: ActionType[] = [
  'write',
  'requestSerialization',
  'takeOwnership',
  'join',
  'leave',
  'custom',
];

interface ShareState {
  config: SimConfig;
  scenarioId: ScenarioId | 'custom';
  scenario: Scenario;
}

function sanitizeShare(s: ShareState): ShareState {
  // Defensive: URLs are user input. Clamp what the engine relies on.
  const base = defaultConfig();
  const config: SimConfig = {
    ...base,
    ...s.config,
    clientCount: Math.min(8, Math.max(2, Number(s.config?.clientCount) || base.clientCount)),
    seed: Number(s.config?.seed) || base.seed,
    variables: Array.isArray(s.config?.variables) ? s.config.variables.slice(0, 12) : base.variables,
    behavior: { ...base.behavior, ...s.config?.behavior },
  };
  const scenario: Scenario = {
    id: s.scenario?.id ?? 'custom',
    initialPresent: Array.isArray(s.scenario?.initialPresent)
      ? s.scenario.initialPresent
      : [0, 1],
    actions: Array.isArray(s.scenario?.actions) ? s.scenario.actions.slice(0, 100) : [],
    ticks: Math.min(60, Math.max(4, Number(s.scenario?.ticks) || 12)),
  };
  return { config, scenarioId: s.scenarioId ?? 'custom', scenario };
}

export function Simulator({ params }: { params: URLSearchParams }) {
  const { t } = useI18n();
  const [config, setConfig] = useState<SimConfig>(defaultConfig);
  const [scenarioId, setScenarioId] = useState<ScenarioId | 'custom'>('lateJoiner');
  const [customScenario, setCustomScenario] = useState<Scenario | null>(null);
  const [notice, setNotice] = useState<MessageKey | null>(null);
  const { copied, copy } = useCopied();
  const loadedFromUrl = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Load shared state from #/simulator?s=... once.
  useEffect(() => {
    const s = params.get('s');
    if (!s || loadedFromUrl.current) return;
    loadedFromUrl.current = true;
    decodeState<ShareState>(s)
      .then((decoded) => {
        const clean = sanitizeShare(decoded);
        setConfig(clean.config);
        setScenarioId(clean.scenarioId);
        setCustomScenario(clean.scenarioId === 'custom' ? clean.scenario : null);
      })
      .catch(() => setNotice('sim.urlError'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scenario = useMemo<Scenario>(
    () => (scenarioId === 'custom' && customScenario ? customScenario : buildScenario(scenarioId === 'custom' ? 'lateJoiner' : scenarioId, config)),
    [scenarioId, customScenario, config],
  );

  const result = useMemo<SimResult>(() => simulate(config, scenario), [config, scenario]);

  // Keep the URL hash shareable (debounced, replaceState only).
  useEffect(() => {
    const handle = setTimeout(() => {
      void encodeState({ config, scenarioId, scenario }).then((s) =>
        replaceHashParams('simulator', { s }),
      );
    }, 300);
    return () => clearTimeout(handle);
  }, [config, scenarioId, scenario]);

  const editScenario = (mut: (s: Scenario) => Scenario) => {
    setCustomScenario(mut({ ...scenario, id: 'custom' }));
    setScenarioId('custom');
  };

  const updateVar = (i: number, patch: Partial<SyncedVariable>) =>
    setConfig((c) => ({
      ...c,
      variables: c.variables.map((v, j) => (j === i ? { ...v, ...patch } : v)),
    }));

  const share = async () => {
    const s = await encodeState({ config, scenarioId, scenario });
    replaceHashParams('simulator', { s });
    await copy('share', window.location.href);
  };

  const exportJson = () =>
    downloadFile(
      'vrcdevkit-simulation.json',
      JSON.stringify({ config, scenarioId, scenario }, null, 2),
      'application/json',
    );

  const importJson = async (file: File) => {
    try {
      const parsed = sanitizeShare(JSON.parse(await file.text()) as ShareState);
      setConfig(parsed.config);
      setScenarioId(parsed.scenarioId);
      setCustomScenario(parsed.scenarioId === 'custom' ? parsed.scenario : null);
      setNotice(null);
    } catch {
      setNotice('sim.importError');
    }
  };

  const varNames = config.variables.map((v) => v.name);

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('sim.title')}</h1>
        <p>{t('sim.subtitle')}</p>
      </div>

      {notice && (
        <p role="alert" className="issue" data-severity="warning">
          {t(notice)}
        </p>
      )}

      <div className="sim-grid">
        <div>
          {/* ---- variables ---- */}
          <section className="panel" aria-labelledby="sim-vars-title">
            <h2 className="panel-title" id="sim-vars-title">
              <span className="idx">01</span> {t('sim.variables')}
            </h2>
            <div className="panel-body">
              <table className="grid">
                <thead>
                  <tr>
                    <th scope="col">{t('sim.var.name')}</th>
                    <th scope="col">{t('sim.var.type')}</th>
                    <th scope="col">{t('sim.var.sync')}</th>
                    <th scope="col">{t('sim.var.initial')}</th>
                    <th scope="col">
                      <span className="visually-hidden">{t('common.remove')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {config.variables.map((v, i) => (
                    <tr className="var-row" key={i}>
                      <td>
                        <input
                          className="field"
                          aria-label={t('sim.var.name')}
                          value={v.name}
                          onChange={(e) => updateVar(i, { name: e.target.value })}
                        />
                      </td>
                      <td>
                        <select
                          className="field"
                          aria-label={t('sim.var.type')}
                          value={v.type}
                          onChange={(e) => updateVar(i, { type: e.target.value as VarType })}
                        >
                          {VAR_TYPES.map((vt) => (
                            <option key={vt}>{vt}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="field"
                          aria-label={t('sim.var.sync')}
                          value={v.sync}
                          onChange={(e) => updateVar(i, { sync: e.target.value as SyncMode })}
                        >
                          <option value="manual">{t('sim.sync.manual')}</option>
                          <option value="continuous">{t('sim.sync.continuous')}</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="field"
                          aria-label={t('sim.var.initial')}
                          value={v.initial}
                          onChange={(e) => updateVar(i, { initial: e.target.value })}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn small ghost"
                          aria-label={`${t('common.remove')} ${v.name}`}
                          onClick={() =>
                            setConfig((c) => ({
                              ...c,
                              variables: c.variables.filter((_, j) => j !== i),
                            }))
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
                    setConfig((c) => ({
                      ...c,
                      variables: [
                        ...c.variables,
                        {
                          name: `var${c.variables.length}`,
                          type: 'int',
                          sync: 'manual',
                          initial: '0',
                        },
                      ],
                    }))
                  }
                >
                  + {t('sim.addVariable')}
                </button>
              </div>
            </div>
          </section>

          {/* ---- ownership + behavior ---- */}
          <section className="panel" aria-labelledby="sim-own-title">
            <h2 className="panel-title" id="sim-own-title">
              <span className="idx">02</span> {t('sim.ownership')}
            </h2>
            <div className="panel-body">
              {(['master', 'perObject', 'anyone'] as const).map((m) => (
                <label className="check" key={m}>
                  <input
                    type="radio"
                    name="ownership"
                    checked={config.ownership === m}
                    onChange={() => setConfig((c) => ({ ...c, ownership: m }))}
                  />
                  <span>
                    <strong className="mono">{t(`sim.ownership.${m}` as MessageKey)}</strong>
                    <br />
                    <small style={{ color: 'var(--ink-muted)' }}>
                      {t(`sim.ownership.${m}.desc` as MessageKey)}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="sim-behavior-title">
            <h2 className="panel-title" id="sim-behavior-title">
              <span className="idx">03</span> {t('sim.behavior')}
            </h2>
            <div className="panel-body">
              {(
                [
                  'serializeOnPlayerJoined',
                  'applyOnDeserialization',
                  'handleOwnershipTransferred',
                  'setOwnerBeforeWrite',
                ] as const
              ).map((k) => (
                <label className="check" key={k}>
                  <input
                    type="checkbox"
                    checked={config.behavior[k]}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        behavior: { ...c.behavior, [k]: e.target.checked },
                      }))
                    }
                  />
                  <span className="mono" style={{ fontSize: 12.5 }}>
                    {t(`sim.behavior.${k}` as MessageKey)}
                  </span>
                </label>
              ))}
              <div className="inline-controls" style={{ marginTop: 12 }}>
                <label className="labelled" style={{ flex: 1 }}>
                  {t('sim.behavior.customEvents')}
                  <input
                    className="field"
                    style={{ flex: 1 }}
                    value={config.behavior.customEvents.join(', ')}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        behavior: {
                          ...c.behavior,
                          customEvents: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      }))
                    }
                  />
                </label>
              </div>
              <div className="inline-controls" style={{ marginTop: 12 }}>
                <label className="labelled">
                  {t('sim.clients')}
                  <input
                    type="range"
                    min={2}
                    max={8}
                    value={config.clientCount}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, clientCount: Number(e.target.value) }))
                    }
                  />
                  <output className="mono">{config.clientCount}</output>
                </label>
                <label className="labelled">
                  {t('sim.seed')}
                  <input
                    className="field"
                    style={{ width: 90 }}
                    inputMode="numeric"
                    value={config.seed}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, seed: Number(e.target.value) || 0 }))
                    }
                  />
                </label>
              </div>
            </div>
          </section>

          {/* ---- scenarios ---- */}
          <section className="panel" aria-labelledby="sim-scenarios-title">
            <h2 className="panel-title" id="sim-scenarios-title">
              <span className="idx">04</span> {t('sim.scenarios')}
            </h2>
            <div className="panel-body">
              <div className="scenario-list">
                {SCENARIO_IDS.map((id) => (
                  <button
                    type="button"
                    key={id}
                    className="scenario-btn"
                    aria-pressed={scenarioId === id}
                    onClick={() => {
                      setScenarioId(id);
                      setCustomScenario(null);
                    }}
                  >
                    <span className="name">{t(`sim.scenario.${id}` as MessageKey)}</span>
                    <span className="desc">{t(`sim.scenario.${id}.desc` as MessageKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ---- manual composition ---- */}
          <section className="panel" aria-labelledby="sim-actions-title">
            <h2 className="panel-title" id="sim-actions-title">
              <span className="idx">05</span> {t('sim.actions')}
            </h2>
            <div className="panel-body">
              <p style={{ color: 'var(--ink-muted)', fontSize: 12.5, marginTop: 0 }}>
                {t('sim.actions.hint')}
              </p>
              <table className="grid">
                <thead>
                  <tr>
                    <th scope="col">{t('sim.action.tick')}</th>
                    <th scope="col">{t('sim.action.client')}</th>
                    <th scope="col">{t('sim.action.type')}</th>
                    <th scope="col">{t('sim.action.variable')}</th>
                    <th scope="col">{t('sim.action.value')}</th>
                    <th scope="col">
                      <span className="visually-hidden">{t('common.remove')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.actions.map((a, i) => (
                    <ActionRow
                      key={i}
                      action={a}
                      varNames={varNames}
                      clientCount={config.clientCount}
                      t={t}
                      onChange={(patch) =>
                        editScenario((s) => ({
                          ...s,
                          actions: s.actions.map((x, j) => (j === i ? { ...x, ...patch } : x)),
                        }))
                      }
                      onRemove={() =>
                        editScenario((s) => ({
                          ...s,
                          actions: s.actions.filter((_, j) => j !== i),
                        }))
                      }
                    />
                  ))}
                </tbody>
              </table>
              <div className="toolbar">
                <button
                  type="button"
                  className="btn small"
                  onClick={() =>
                    editScenario((s) => ({
                      ...s,
                      actions: [
                        ...s.actions,
                        {
                          tick: Math.min(s.ticks - 1, (s.actions[s.actions.length - 1]?.tick ?? 0) + 1),
                          client: 0,
                          type: 'write',
                          variable: varNames[0],
                          value: '1',
                        },
                      ],
                    }))
                  }
                >
                  + {t('sim.addAction')}
                </button>
                <label className="labelled" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: 'var(--ink-muted)' }}>
                  {t('sim.ticks')}
                  <input
                    className="field"
                    style={{ width: 64 }}
                    inputMode="numeric"
                    value={scenario.ticks}
                    onChange={(e) =>
                      editScenario((s) => ({
                        ...s,
                        ticks: Math.min(60, Math.max(4, Number(e.target.value) || 12)),
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="toolbar">
            <button type="button" className="btn" onClick={() => void share()}>
              {copied === 'share' ? t('common.copied') : t('common.share')}
            </button>
            <button type="button" className="btn" onClick={exportJson}>
              {t('common.export')}
            </button>
            <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
              {t('common.import')}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importJson(f);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setConfig(defaultConfig());
                setScenarioId('lateJoiner');
                setCustomScenario(null);
                setNotice(null);
              }}
            >
              {t('common.reset')}
            </button>
          </div>
        </div>

        {/* ---- results ---- */}
        <div>
          <Results result={result} config={config} t={t} />
        </div>
      </div>
      <DiscordCta />
    </div>
  );
}

function ActionRow({
  action,
  varNames,
  clientCount,
  t,
  onChange,
  onRemove,
}: {
  action: ScenarioAction;
  varNames: string[];
  clientCount: number;
  t: Translate;
  onChange: (patch: Partial<ScenarioAction>) => void;
  onRemove: () => void;
}) {
  const needsVar = action.type === 'write';
  const needsValue = action.type === 'write';
  const needsEvent = action.type === 'custom';
  return (
    <tr className="var-row">
      <td style={{ width: 56 }}>
        <input
          className="field"
          style={{ width: 52 }}
          inputMode="numeric"
          aria-label={t('sim.action.tick')}
          value={action.tick}
          onChange={(e) => onChange({ tick: Math.max(0, Number(e.target.value) || 0) })}
        />
      </td>
      <td style={{ width: 64 }}>
        <select
          className="field"
          aria-label={t('sim.action.client')}
          value={action.client}
          onChange={(e) => onChange({ client: Number(e.target.value) })}
        >
          {Array.from({ length: clientCount }, (_, i) => (
            <option key={i} value={i}>
              C{i}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          className="field"
          aria-label={t('sim.action.type')}
          value={action.type}
          onChange={(e) => onChange({ type: e.target.value as ActionType })}
        >
          {ACTION_TYPES.map((at) => (
            <option key={at} value={at}>
              {t(`sim.action.${at}` as MessageKey)}
            </option>
          ))}
        </select>
      </td>
      <td>
        {needsVar ? (
          <select
            className="field"
            aria-label={t('sim.action.variable')}
            value={action.variable ?? varNames[0]}
            onChange={(e) => onChange({ variable: e.target.value })}
          >
            {varNames.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        ) : needsEvent ? (
          <input
            className="field"
            aria-label={t('sim.action.event')}
            placeholder={t('sim.action.event')}
            value={action.event ?? ''}
            onChange={(e) => onChange({ event: e.target.value })}
          />
        ) : (
          <span style={{ color: 'var(--ink-faint)' }}>—</span>
        )}
      </td>
      <td style={{ width: 70 }}>
        {needsValue ? (
          <input
            className="field"
            style={{ width: 64 }}
            aria-label={t('sim.action.value')}
            value={action.value ?? ''}
            onChange={(e) => onChange({ value: e.target.value })}
          />
        ) : (
          <span style={{ color: 'var(--ink-faint)' }}>—</span>
        )}
      </td>
      <td style={{ width: 34 }}>
        <button type="button" className="btn small ghost" aria-label={t('common.remove')} onClick={onRemove}>
          ✕
        </button>
      </td>
    </tr>
  );
}

function Results({ result, config, t }: { result: SimResult; config: SimConfig; t: Translate }) {
  // divergence lookup: tick -> variable -> owner value comparison
  const divergedAt = useMemo(() => {
    const map = new Map<number, Set<string>>();
    for (const d of result.divergences) {
      if (!map.has(d.tick)) map.set(d.tick, new Set());
      map.get(d.tick)!.add(d.variable);
    }
    return map;
  }, [result]);

  const ownerValueAt = useCallback(
    (tick: number, variable: string): string | undefined => {
      const row = result.timeline[tick];
      const ownerCell = row.find((c) => c.isOwner);
      return ownerCell?.values[variable];
    },
    [result],
  );

  return (
    <>
      <section className="panel" aria-labelledby="sim-timeline-title">
        <h2 className="panel-title" id="sim-timeline-title">
          <span className="idx">06</span> {t('sim.timeline')}
        </h2>
        <div className="panel-body">
          <div className="timeline-wrap" tabIndex={0}>
            <table className="timeline">
              <thead>
                <tr>
                  <th scope="col">tick</th>
                  {result.timeline.map((_, tk) => (
                    <th scope="col" key={tk}>
                      {tk}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: result.clientCount }, (_, c) => (
                  <tr key={c}>
                    <th scope="row">{t('sim.client', { n: c })}</th>
                    {result.timeline.map((row, tk) => {
                      const cell = row[c];
                      if (!cell.present) {
                        return (
                          <td key={tk} className="cell-absent">
                            —
                          </td>
                        );
                      }
                      const diverged = [...(divergedAt.get(tk) ?? [])].some(
                        (v) => cell.values[v] !== ownerValueAt(tk, v),
                      );
                      return (
                        <td key={tk} className={diverged ? 'cell-diverged' : undefined}>
                          {(cell.isOwner || cell.isMaster) && (
                            <span className="row-flags">
                              {cell.isOwner && <span className="flag-owner">OWN </span>}
                              {cell.isMaster && <span className="flag-master">MST</span>}
                            </span>
                          )}
                          {config.variables.map((v) => {
                            const diff = cell.values[v.name] !== ownerValueAt(tk, v.name);
                            return (
                              <span key={v.name} className={`val${diff ? ' diff' : ''}`} style={{ display: 'block' }}>
                                {v.name}={cell.values[v.name]}
                              </span>
                            );
                          })}
                          {cell.events.map((e, i) => (
                            <span key={i} className="evt" title={e}>
                              {e}
                            </span>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="legend">
            <span>
              <span className="flag-owner">OWN</span> {t('sim.legend.owner')}
            </span>
            <span>
              <span className="flag-master">MST</span> {t('sim.legend.master')}
            </span>
            <span>
              <span className="swatch" style={{ background: 'var(--diverge-bg)', borderColor: 'var(--diverge-line)' }} />
              {t('sim.legend.divergence')}
            </span>
            <span>
              <span className="swatch" style={{ background: 'var(--absent)' }} />
              {t('sim.legend.absent')}
            </span>
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="sim-issues-title">
        <h2 className="panel-title" id="sim-issues-title">
          <span className="idx">07</span> {t('sim.issues')}
        </h2>
        <div className="panel-body">
          {result.issues.length === 0 ? (
            <p className="ok-banner" role="status">
              ✓ {t('sim.issues.none')}
            </p>
          ) : (
            result.issues.map((issue, i) => (
              <article className="issue" data-severity={issue.severity} key={i}>
                <div className="issue-head">
                  <span className="sev">{t(`sim.severity.${issue.severity}` as MessageKey)}</span>
                  <h3>{t(`issue.${issue.code}.title` as MessageKey, issue.params)}</h3>
                </div>
                <dl>
                  <dt>{t('sim.cause')}</dt>
                  <dd>{t(`issue.${issue.code}.cause` as MessageKey, issue.params)}</dd>
                  <dt>{t('sim.fix')}</dt>
                  <dd className="fix">{t(`issue.${issue.code}.fix` as MessageKey, issue.params)}</dd>
                </dl>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
