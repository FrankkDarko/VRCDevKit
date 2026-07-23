/**
 * Interop: convert a state machine into the sync simulator's exact share
 * format ({ config, scenarioId, scenario }) so "Test in the simulator" can
 * open #/simulator?s=... — the same codec and shape the simulator already
 * reads and writes. No second format.
 */
import type { Scenario, ScenarioAction, SimConfig, SyncedVariable } from '../../engine/types';
import type { SmMachine } from './types';

export interface SimulatorShareState {
  config: SimConfig;
  scenarioId: 'custom';
  scenario: Scenario;
}

export function toSimulatorState(m: SmMachine): SimulatorShareState {
  const stateIndex = new Map(m.states.map((s, i) => [s.id, i]));
  const initialIndex = stateIndex.get(m.initialStateId) ?? 0;

  // The synced state variable, named to avoid collisions with machine vars.
  let stateVar = 'currentState';
  while (m.variables.some((v) => v.name === stateVar)) stateVar = '_' + stateVar;

  const variables: SyncedVariable[] = [
    { name: stateVar, type: 'int', sync: 'manual', initial: String(initialIndex) },
    ...m.variables.map(
      (v): SyncedVariable => ({ name: v.name, type: v.type, sync: 'manual', initial: v.initial || '0' }),
    ),
  ];

  const allMaster = m.states.length > 0 && m.states.every((s) => s.authority === 'master');

  const config: SimConfig = {
    variables,
    ownership: allMaster ? 'master' : 'perObject',
    behavior: {
      // mirrors what the generated UdonSharp code actually does
      serializeOnPlayerJoined: true,
      applyOnDeserialization: true,
      handleOwnershipTransferred: false,
      setOwnerBeforeWrite: true,
      customEvents: [...new Set(m.transitions.map((t) => t.name))].slice(0, 8),
    },
    clientCount: 3,
    seed: 1337,
  };

  // Walk up to three transitions from the initial state to build a scenario
  // that actually exercises the machine, plus a late joiner mid-run.
  const actions: ScenarioAction[] = [];
  let cursor = m.initialStateId;
  let tick = 2;
  let lastRsTick = 0;
  for (let hop = 0; hop < 3; hop++) {
    const next = m.transitions.find(
      (t) => t.from === cursor && stateIndex.has(t.from) && stateIndex.has(t.to),
    );
    if (!next) break;
    const target = stateIndex.get(next.to)!;
    actions.push({ tick, client: 0, type: 'write', variable: stateVar, value: String(target) });
    lastRsTick = tick + 1;
    actions.push({ tick: lastRsTick, client: 0, type: 'requestSerialization' });
    cursor = next.to;
    tick += 3;
  }
  // Join outside the serialization cooldown window, so the on-join
  // serialization (mirroring the generated code) is not rate-limited.
  const joinTick = Math.max(6, lastRsTick + 2);
  actions.push({ tick: joinTick, client: 2, type: 'join' });

  const scenario: Scenario = {
    id: 'custom',
    initialPresent: [0, 1],
    actions: actions.sort((a, b) => a.tick - b.tick),
    ticks: Math.max(14, joinTick + 5, tick + 3),
  };

  return { config, scenarioId: 'custom', scenario };
}
