import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import type { MessageKey } from '../i18n/types';
import { Panel } from '../components/ui/Panel';
import { DiscordCta } from '../components/DiscordCta';
import { SmCanvas, type SmSelection } from '../components/SmCanvas';
import { downloadFile } from '../lib/download';
import { useCopied } from '../lib/useCopied';
import { encodeState } from '../lib/serialize';
import { validateMachine } from '../generators/statemachine/validate';
import { generateStateMachine, sanitizeIdent } from '../generators/statemachine/codegen';
import { toSimulatorState } from '../generators/statemachine/toSimulator';
import {
  defaultMachine,
  type SmAuthority,
  type SmMachine,
  type SmState,
  type SmTransition,
  type SmVarType,
} from '../generators/statemachine/types';

const freshId = (prefix: string) => prefix + Math.random().toString(36).slice(2, 9);
const AUTHORITIES: SmAuthority[] = ['anyone', 'owner', 'master'];
const VAR_TYPES: SmVarType[] = ['bool', 'int', 'float', 'string'];

export function StateMachine() {
  const { t } = useI18n();
  const [machine, setMachine] = useState<SmMachine>(defaultMachine);
  const [selection, setSelection] = useState<SmSelection>(null);
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const { copied, copy } = useCopied();

  const issues = useMemo(() => validateMachine(machine), [machine]);
  const code = useMemo(() => generateStateMachine(machine), [machine]);

  const selectedState =
    selection?.kind === 'state' ? machine.states.find((s) => s.id === selection.id) ?? null : null;
  const selectedTransition =
    selection?.kind === 'transition'
      ? machine.transitions.find((tr) => tr.id === selection.id) ?? null
      : null;

  const patchState = (id: string, patch: Partial<SmState>) =>
    setMachine((m) => ({
      ...m,
      states: m.states.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));

  const patchTransition = (id: string, patch: Partial<SmTransition>) =>
    setMachine((m) => ({
      ...m,
      transitions: m.transitions.map((tr) => (tr.id === id ? { ...tr, ...patch } : tr)),
    }));

  const addState = () => {
    const id = freshId('s-');
    const n = machine.states.length;
    setMachine((m) => ({
      ...m,
      states: [
        ...m.states,
        {
          id,
          name: `State${n}`,
          x: 120 + (n % 4) * 180,
          y: 90 + Math.floor(n / 4) * 110,
          authority: 'anyone',
          assignments: [],
        },
      ],
      initialStateId: m.states.length === 0 ? id : m.initialStateId,
    }));
    setSelection({ kind: 'state', id });
  };

  const deleteSelection = () => {
    if (!selection) return;
    if (selection.kind === 'state') {
      setMachine((m) => ({
        ...m,
        states: m.states.filter((s) => s.id !== selection.id),
        transitions: m.transitions.filter((tr) => tr.from !== selection.id && tr.to !== selection.id),
        initialStateId:
          m.initialStateId === selection.id
            ? m.states.find((s) => s.id !== selection.id)?.id ?? ''
            : m.initialStateId,
      }));
    } else {
      setMachine((m) => ({ ...m, transitions: m.transitions.filter((tr) => tr.id !== selection.id) }));
    }
    setSelection(null);
  };

  // Delete key removes the selection (unless typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      deleteSelection();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  const onNodeClick = (id: string) => {
    if (!linkMode) return;
    if (linkSource === null) {
      setLinkSource(id);
      return;
    }
    const trId = freshId('t-');
    setMachine((m) => ({
      ...m,
      transitions: [
        ...m.transitions,
        { id: trId, name: `Trigger${m.transitions.length}`, from: linkSource, to: id, condition: '' },
      ],
    }));
    setLinkSource(null);
    setLinkMode(false);
    setSelection({ kind: 'transition', id: trId });
  };

  const openInSimulator = async () => {
    const share = toSimulatorState(machine);
    const s = await encodeState(share);
    window.location.hash = `#/simulator?s=${s}`;
  };

  const stateName = (id: string) => machine.states.find((s) => s.id === id)?.name ?? '?';

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('sm.title')}</h1>
        <p>{t('sm.subtitle')}</p>
      </div>

      <Panel idx="01" title={t('sm.canvas')}>
        <p style={{ color: 'var(--ink-muted)', fontSize: 12.5, marginTop: 0 }}>{t('sm.canvas.hint')}</p>
        <div className="toolbar" style={{ marginTop: 0 }}>
          <button type="button" className="btn small" onClick={addState}>
            + {t('sm.addState')}
          </button>
          <button
            type="button"
            className="btn small"
            aria-pressed={linkMode}
            onClick={() => {
              setLinkMode((v) => !v);
              setLinkSource(null);
            }}
          >
            → {t('sm.linkMode')}
          </button>
          {linkMode && (
            <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }} role="status">
              {linkSource === null ? t('sm.linkMode.pickSource') : t('sm.linkMode.pickTarget')}
            </span>
          )}
          <button type="button" className="btn small ghost" disabled={!selection} onClick={deleteSelection}>
            {t('sm.deleteSelected')}
          </button>
          <button
            type="button"
            className="btn primary"
            style={{ marginLeft: 'auto' }}
            onClick={() => void openInSimulator()}
          >
            {t('sm.test')} →
          </button>
        </div>
        <div className="sm-canvas-wrap">
          <SmCanvas
            machine={machine}
            selection={selection}
            linkSource={linkSource}
            linkMode={linkMode}
            onSelect={setSelection}
            onMoveState={(id, x, y) => patchState(id, { x, y })}
            onNodeClick={onNodeClick}
          />
        </div>
      </Panel>

      <div className="sim-grid">
        <div>
          <Panel idx="02" title={t('sm.machine')}>
            <div className="inline-controls" style={{ marginBottom: 12 }}>
              <label className="labelled" style={{ flex: 1 }}>
                {t('sm.className')}
                <input
                  className="field"
                  style={{ flex: 1 }}
                  value={machine.className}
                  onChange={(e) => setMachine((m) => ({ ...m, className: e.target.value }))}
                />
              </label>
            </div>
            <h3 className="pane-label">{t('sm.variables')}</h3>
            <table className="grid">
              <thead>
                <tr>
                  <th scope="col">{t('sim.var.name')}</th>
                  <th scope="col">{t('sim.var.type')}</th>
                  <th scope="col">{t('sim.var.initial')}</th>
                  <th scope="col">
                    <span className="visually-hidden">{t('common.remove')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {machine.variables.map((v, i) => (
                  <tr className="var-row" key={i}>
                    <td>
                      <input
                        className="field"
                        style={{ width: '100%' }}
                        aria-label={t('sim.var.name')}
                        value={v.name}
                        onChange={(e) =>
                          setMachine((m) => ({
                            ...m,
                            variables: m.variables.map((x, j) =>
                              j === i ? { ...x, name: e.target.value } : x,
                            ),
                          }))
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="field"
                        aria-label={t('sim.var.type')}
                        value={v.type}
                        onChange={(e) =>
                          setMachine((m) => ({
                            ...m,
                            variables: m.variables.map((x, j) =>
                              j === i ? { ...x, type: e.target.value as SmVarType } : x,
                            ),
                          }))
                        }
                      >
                        {VAR_TYPES.map((vt) => (
                          <option key={vt}>{vt}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="field"
                        style={{ width: '100%' }}
                        aria-label={t('sim.var.initial')}
                        value={v.initial}
                        onChange={(e) =>
                          setMachine((m) => ({
                            ...m,
                            variables: m.variables.map((x, j) =>
                              j === i ? { ...x, initial: e.target.value } : x,
                            ),
                          }))
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn small ghost"
                        aria-label={`${t('common.remove')} ${v.name}`}
                        onClick={() =>
                          setMachine((m) => ({
                            ...m,
                            variables: m.variables.filter((_, j) => j !== i),
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
                  setMachine((m) => ({
                    ...m,
                    variables: [...m.variables, { name: `var${m.variables.length}`, type: 'int', initial: '0' }],
                  }))
                }
              >
                + {t('sm.addVariable')}
              </button>
            </div>
          </Panel>

          <Panel idx="03" title={`${t('sm.states')} / ${t('sm.transitions')}`}>
            <div className="sm-lists">
              <div>
                <h3 className="pane-label">{t('sm.states')}</h3>
                <ul className="sm-list">
                  {machine.states.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className="sm-list-item"
                        aria-pressed={selection?.kind === 'state' && selection.id === s.id}
                        onClick={() => setSelection({ kind: 'state', id: s.id })}
                      >
                        {machine.initialStateId === s.id ? '▶ ' : ''}
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="pane-label">{t('sm.transitions')}</h3>
                <ul className="sm-list">
                  {machine.transitions.map((tr) => (
                    <li key={tr.id}>
                      <button
                        type="button"
                        className="sm-list-item"
                        aria-pressed={selection?.kind === 'transition' && selection.id === tr.id}
                        onClick={() => setSelection({ kind: 'transition', id: tr.id })}
                      >
                        {tr.name}: {stateName(tr.from)} → {stateName(tr.to)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {!selectedState && !selectedTransition && (
              <p style={{ color: 'var(--ink-muted)', fontSize: 12.5 }}>{t('sm.selected.none')}</p>
            )}

            {selectedState && (
              <div className="sm-editor">
                <div className="inline-controls">
                  <label className="labelled">
                    {t('sm.state.name')}
                    <input
                      className="field"
                      value={selectedState.name}
                      onChange={(e) => patchState(selectedState.id, { name: sanitizeIdent(e.target.value) || e.target.value })}
                    />
                  </label>
                  <label className="labelled">
                    {t('sm.state.authority')}
                    <select
                      className="field"
                      value={selectedState.authority}
                      onChange={(e) => patchState(selectedState.id, { authority: e.target.value as SmAuthority })}
                    >
                      {AUTHORITIES.map((a) => (
                        <option key={a} value={a}>
                          {t(`sm.authority.${a}` as MessageKey)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="check" style={{ padding: 0 }}>
                    <input
                      type="checkbox"
                      checked={machine.initialStateId === selectedState.id}
                      onChange={(e) =>
                        setMachine((m) => ({
                          ...m,
                          initialStateId: e.target.checked ? selectedState.id : m.initialStateId,
                        }))
                      }
                    />
                    <span>{t('sm.state.initial')}</span>
                  </label>
                </div>
                <h3 className="pane-label" style={{ marginTop: 10 }}>
                  {t('sm.state.assignments')}
                </h3>
                {selectedState.assignments.map((a, i) => (
                  <div className="inline-controls" key={i} style={{ marginBottom: 6 }}>
                    <select
                      className="field"
                      aria-label={t('sm.assign.variable')}
                      value={a.variable}
                      onChange={(e) =>
                        patchState(selectedState.id, {
                          assignments: selectedState.assignments.map((x, j) =>
                            j === i ? { ...x, variable: e.target.value } : x,
                          ),
                        })
                      }
                    >
                      {machine.variables.map((v) => (
                        <option key={v.name}>{v.name}</option>
                      ))}
                    </select>
                    <input
                      className="field"
                      style={{ flex: 1 }}
                      aria-label={t('sm.assign.value')}
                      placeholder={t('sm.assign.value')}
                      value={a.value}
                      onChange={(e) =>
                        patchState(selectedState.id, {
                          assignments: selectedState.assignments.map((x, j) =>
                            j === i ? { ...x, value: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      className="btn small ghost"
                      aria-label={t('common.remove')}
                      onClick={() =>
                        patchState(selectedState.id, {
                          assignments: selectedState.assignments.filter((_, j) => j !== i),
                        })
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn small"
                  disabled={machine.variables.length === 0}
                  onClick={() =>
                    patchState(selectedState.id, {
                      assignments: [
                        ...selectedState.assignments,
                        { variable: machine.variables[0]?.name ?? '', value: '' },
                      ],
                    })
                  }
                >
                  + {t('sm.addAssignment')}
                </button>
              </div>
            )}

            {selectedTransition && (
              <div className="sm-editor">
                <div className="inline-controls">
                  <label className="labelled">
                    {t('sm.transition.name')}
                    <input
                      className="field"
                      value={selectedTransition.name}
                      onChange={(e) => patchTransition(selectedTransition.id, { name: e.target.value })}
                    />
                  </label>
                  <label className="labelled">
                    {t('sm.transition.from')}
                    <select
                      className="field"
                      value={selectedTransition.from}
                      onChange={(e) => patchTransition(selectedTransition.id, { from: e.target.value })}
                    >
                      {machine.states.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="labelled">
                    {t('sm.transition.to')}
                    <select
                      className="field"
                      value={selectedTransition.to}
                      onChange={(e) => patchTransition(selectedTransition.id, { to: e.target.value })}
                    >
                      {machine.states.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="labelled" style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  {t('sm.transition.condition')}
                  <input
                    className="field"
                    style={{ flex: 1 }}
                    placeholder="doorOpen == false"
                    value={selectedTransition.condition}
                    onChange={(e) => patchTransition(selectedTransition.id, { condition: e.target.value })}
                  />
                </label>
              </div>
            )}
          </Panel>

          <Panel idx="04" title={t('sm.validation')}>
            {issues.length === 0 ? (
              <p className="ok-banner" role="status">
                ✓ {t('sm.validation.ok')}
              </p>
            ) : (
              issues.map((issue, i) => (
                <article className="issue" data-severity={issue.severity} key={i}>
                  <div className="issue-head">
                    <span className="sev">{t(`sim.severity.${issue.severity}` as MessageKey)}</span>
                    <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                      {t(`sm.issue.${issue.code}` as MessageKey, issue.params)}
                    </h3>
                  </div>
                </article>
              ))
            )}
          </Panel>
        </div>

        <div>
          <Panel idx="05" title={t('sm.code')}>
            <div className="toolbar" style={{ marginTop: 0 }}>
              <button type="button" className="btn small" onClick={() => void copy('code', code)}>
                {copied === 'code' ? t('common.copied') : t('pd.copyCode')}
              </button>
              <button
                type="button"
                className="btn small"
                onClick={() => downloadFile(`${sanitizeIdent(machine.className) || 'StateMachine'}.cs`, code, 'text/plain')}
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
