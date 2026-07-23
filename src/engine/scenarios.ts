/** Predefined, replayable scenarios. Each is built against the current config. */
import type { Scenario, ScenarioAction, SimConfig } from './types';

export type ScenarioId =
  | 'lateJoiner'
  | 'masterLeave'
  | 'ownershipSteal'
  | 'concurrentWrite'
  | 'serializationBurst'
  | 'instanceOwnerLeave';

export const SCENARIO_IDS: ScenarioId[] = [
  'lateJoiner',
  'masterLeave',
  'ownershipSteal',
  'concurrentWrite',
  'serializationBurst',
  'instanceOwnerLeave',
];

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export function buildScenario(id: ScenarioId, config: SimConfig): Scenario {
  const n = config.clientCount;
  const all = range(n);
  const v = config.variables[0]?.name ?? 'value';

  switch (id) {
    case 'lateJoiner': {
      // Owner writes, then someone joins. Whether the newcomer converges
      // depends entirely on the sync mode and the script's behavior flags.
      const joiner = n - 1;
      const actions: ScenarioAction[] = [
        { tick: 2, client: 0, type: 'write', variable: v, value: '42' },
        { tick: 5, client: joiner, type: 'join' },
      ];
      return { id, initialPresent: all.slice(0, n - 1), actions, ticks: 14 };
    }
    case 'masterLeave': {
      const actions: ScenarioAction[] = [
        { tick: 2, client: 0, type: 'write', variable: v, value: '1' },
        { tick: 3, client: 0, type: 'requestSerialization' },
        { tick: 4, client: 0, type: 'write', variable: v, value: '2' }, // dirty…
        { tick: 5, client: 0, type: 'leave' }, // …and gone
        { tick: 8, client: 1, type: 'write', variable: v, value: '3' },
        { tick: 9, client: 1, type: 'requestSerialization' },
      ];
      return { id, initialPresent: all, actions, ticks: 15 };
    }
    case 'ownershipSteal': {
      const actions: ScenarioAction[] = [
        { tick: 2, client: 0, type: 'write', variable: v, value: 'A' },
        { tick: 3, client: 1, type: 'takeOwnership' }, // steals mid-write
        { tick: 4, client: 1, type: 'write', variable: v, value: 'B' },
        { tick: 5, client: 1, type: 'requestSerialization' },
      ];
      return { id, initialPresent: all, actions, ticks: 12 };
    }
    case 'concurrentWrite': {
      const actions: ScenarioAction[] = [
        { tick: 3, client: 0, type: 'write', variable: v, value: 'A' },
        { tick: 3, client: 1, type: 'write', variable: v, value: 'B' },
        { tick: 4, client: 0, type: 'requestSerialization' },
      ];
      return { id, initialPresent: all, actions, ticks: 11 };
    }
    case 'serializationBurst': {
      const actions: ScenarioAction[] = [
        { tick: 2, client: 0, type: 'write', variable: v, value: '1' },
        { tick: 2, client: 0, type: 'requestSerialization' },
        { tick: 2, client: 0, type: 'requestSerialization' },
        { tick: 3, client: 0, type: 'write', variable: v, value: '2' },
        { tick: 3, client: 0, type: 'requestSerialization' },
        { tick: 3, client: 0, type: 'requestSerialization' },
        { tick: 4, client: 0, type: 'write', variable: v, value: '3' },
        { tick: 4, client: 0, type: 'requestSerialization' },
      ];
      return { id, initialPresent: all, actions, ticks: 11 };
    }
    case 'instanceOwnerLeave': {
      const actions: ScenarioAction[] = [
        { tick: 3, client: 0, type: 'leave' }, // instance owner & master leaves early
        { tick: 5, client: 1, type: 'write', variable: v, value: '7' },
        { tick: 6, client: 1, type: 'requestSerialization' },
      ];
      return { id, initialPresent: all, actions, ticks: 13 };
    }
  }
}
