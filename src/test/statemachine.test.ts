import { describe, expect, it } from 'vitest';
import { validateMachine } from '../generators/statemachine/validate';
import { generateStateMachine, stateConst } from '../generators/statemachine/codegen';
import { toSimulatorState } from '../generators/statemachine/toSimulator';
import { defaultMachine, type SmMachine } from '../generators/statemachine/types';
import { simulate } from '../engine/simulator';
import { encodeState, decodeState } from '../lib/serialize';

describe('validateMachine', () => {
  it('accepts the default door machine', () => {
    expect(validateMachine(defaultMachine())).toHaveLength(0);
  });

  it('flags structural errors', () => {
    const m: SmMachine = {
      className: 'X',
      initialStateId: 'missing',
      variables: [
        { name: 'a', type: 'int', initial: '0' },
        { name: 'a', type: 'int', initial: '0' },
        { name: '2bad', type: 'int', initial: '0' },
      ],
      states: [
        { id: 's1', name: 'One', x: 0, y: 0, authority: 'anyone', assignments: [{ variable: 'ghost', value: '1' }] },
        { id: 's2', name: 'One', x: 0, y: 0, authority: 'anyone', assignments: [] },
        { id: 's3', name: 'bad name', x: 0, y: 0, authority: 'anyone', assignments: [] },
      ],
      transitions: [
        { id: 't1', name: 'Go', from: 's1', to: 'nowhere', condition: '' },
        { id: 't2', name: 'Go', from: 's1', to: 's2', condition: '' },
        { id: 't3', name: 'Go', from: 's1', to: 's3', condition: '' },
      ],
    };
    const codes = validateMachine(m).map((i) => i.code);
    expect(codes).toContain('no-initial');
    expect(codes).toContain('duplicate-state-name');
    expect(codes).toContain('invalid-state-name');
    expect(codes).toContain('unknown-variable');
    expect(codes).toContain('duplicate-variable');
    expect(codes).toContain('invalid-variable-name');
    expect(codes).toContain('dangling-transition');
    expect(codes).toContain('duplicate-trigger');
  });

  it('warns about unreachable states', () => {
    const m = defaultMachine();
    m.states.push({ id: 's-lost', name: 'Lost', x: 0, y: 0, authority: 'anyone', assignments: [] });
    expect(validateMachine(m).map((i) => i.code)).toContain('unreachable-state');
  });
});

describe('generateStateMachine', () => {
  const code = generateStateMachine(defaultMachine());

  it('does not crash on an empty machine (all states deleted)', () => {
    const empty = defaultMachine();
    empty.states = [];
    empty.transitions = [];
    empty.initialStateId = '';
    expect(() => generateStateMachine(empty)).not.toThrow();
    expect(generateStateMachine(empty)).toContain('no states yet');
    expect(() => toSimulatorState(empty)).not.toThrow();
  });

  it('produces a structurally sound class with state constants', () => {
    expect(code).toContain('public class DoorStateMachine : UdonSharpBehaviour');
    expect((code.match(/{/g) ?? []).length).toBe((code.match(/}/g) ?? []).length);
    expect(code).toContain('public const int STATE_CLOSED = 0;');
    expect(code).toContain('[UdonSynced] private int _state = STATE_CLOSED;');
    expect(code).toContain('[UdonSynced] private bool doorOpen = false;');
    expect(code).toContain('[UdonBehaviourSyncMode(BehaviourSyncMode.Manual)]');
  });

  it('emits the network guards in the right order', () => {
    const open = code.slice(code.indexOf('public void Open()'), code.indexOf('public void FinishOpening()'));
    expect(open).toContain('if (_transitioning) return;');
    expect(open).toContain(`if (_state == ${stateConst('Closed')})`);
    // ownership grab + RS live in DoTransition
    const doT = code.slice(code.indexOf('private void DoTransition'));
    expect(doT).toContain('Networking.SetOwner(Networking.LocalPlayer, gameObject);');
    expect(doT.indexOf('_state = to;')).toBeGreaterThan(doT.indexOf('SetOwner'));
    expect(doT.indexOf('RequestSerialization();')).toBeGreaterThan(doT.indexOf('_state = to;'));
  });

  it('guards per source-state authority', () => {
    const m = defaultMachine();
    m.states[0].authority = 'master';
    m.states[2].authority = 'owner';
    const c = generateStateMachine(m);
    expect(c).toContain('if (!Networking.LocalPlayer.isMaster) return;');
    expect(c).toContain('if (!Networking.IsOwner(Networking.LocalPlayer, gameObject)) return; // owner only');
  });

  it('inserts conditions and enter assignments', () => {
    const m = defaultMachine();
    m.transitions[0].condition = 'doorOpen == false';
    const c = generateStateMachine(m);
    expect(c).toContain('if (!(doorOpen == false)) return;');
    expect(c).toContain('doorOpen = true;');
    expect(c).toContain('doorOpen = false;');
  });

  it('handles late joiners and remote updates', () => {
    expect(code).toContain('public override void OnDeserialization()');
    expect(code).toContain('public override void OnPlayerJoined(VRCPlayerApi player)');
    expect(code).toContain('private void OnEnterClosed()');
    expect(code).toContain('private void OnEnterOpening()');
  });

  it('groups same-name triggers from different states into one method', () => {
    const m = defaultMachine();
    m.transitions.push({ id: 't5', name: 'Open', from: 's-closing', to: 's-opening', condition: '' });
    const c = generateStateMachine(m);
    expect((c.match(/public void Open\(\)/g) ?? []).length).toBe(1);
    const open = c.slice(c.indexOf('public void Open()'), c.indexOf('public void FinishOpening()'));
    expect(open).toContain(`if (_state == ${stateConst('Closed')})`);
    expect(open).toContain(`if (_state == ${stateConst('Closing')})`);
  });
});

describe('toSimulatorState (interop)', () => {
  const share = toSimulatorState(defaultMachine());

  it('produces a simulator config in the existing shape', () => {
    expect(share.scenarioId).toBe('custom');
    expect(share.config.variables[0]).toMatchObject({ name: 'currentState', type: 'int', sync: 'manual' });
    expect(share.config.variables.map((v) => v.name)).toContain('doorOpen');
    expect(share.config.ownership).toBe('perObject');
    expect(share.config.behavior.setOwnerBeforeWrite).toBe(true);
    expect(share.config.behavior.customEvents).toContain('Open');
  });

  it('maps an all-master machine to master-authoritative', () => {
    const m = defaultMachine();
    m.states.forEach((s) => (s.authority = 'master'));
    expect(toSimulatorState(m).config.ownership).toBe('master');
  });

  it('builds a scenario that walks transitions and adds a late joiner', () => {
    const writes = share.scenario.actions.filter((a) => a.type === 'write');
    expect(writes.length).toBe(3);
    expect(writes[0]).toMatchObject({ variable: 'currentState', value: '1' }); // Closed -> Opening
    expect(share.scenario.actions.some((a) => a.type === 'join' && a.client === 2)).toBe(true);
  });

  it('runs cleanly in the engine and converges', () => {
    const result = simulate(share.config, share.scenario);
    expect(result.timeline).toHaveLength(share.scenario.ticks);
    const last = result.timeline[result.timeline.length - 1];
    for (const cell of last.filter((c) => c.present)) {
      expect(cell.values.currentState).toBe('3'); // ended on Closing (3rd hop)
    }
    expect(result.issues.map((i) => i.code)).not.toContain('final-desync');
  });

  it('avoids name collisions with a machine variable named currentState', () => {
    const m = defaultMachine();
    m.variables.push({ name: 'currentState', type: 'int', initial: '0' });
    const s = toSimulatorState(m);
    expect(s.config.variables[0].name).toBe('_currentState');
  });

  it('round-trips through the simulator URL codec', async () => {
    const encoded = await encodeState(share);
    const decoded = await decodeState<typeof share>(encoded);
    expect(decoded).toEqual(share);
  });
});
