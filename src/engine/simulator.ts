/**
 * Deterministic tick-based simulation of VRChat/Udon network sync.
 *
 * Model (simplified but faithful to the common failure modes):
 * - One synced object with one owner. Only the owner's writes replicate.
 * - Manual sync: owner must call RequestSerialization; sends are rate-limited
 *   (min RATE_COOLDOWN ticks between sends).
 * - Continuous sync: owner auto-serializes dirty state every CONTINUOUS_INTERVAL ticks.
 * - The network keeps the last serialized snapshot; late joiners receive it on join.
 *   Anything written but never serialized is invisible to them.
 * - Messages travel with a per-recipient latency of 1..2 ticks (seeded RNG).
 */
import { createRng } from './rng';
import type {
  ClientTick,
  Divergence,
  LogEntry,
  Scenario,
  ScenarioAction,
  SimConfig,
  SimResult,
} from './types';
import { deriveIssues } from './diagnostics';

export const RATE_COOLDOWN = 2;
export const CONTINUOUS_INTERVAL = 3;

/** Raw facts collected while simulating; diagnostics turns these into issues. */
export interface Evidence {
  lateJoins: { client: number; tick: number }[];
  nonOwnerWrites: { client: number; tick: number; variable: string }[];
  concurrentWrites: { tick: number; variable: string; clients: number[] }[];
  droppedSerializations: number;
  rsByNonOwner: { client: number; tick: number }[];
  lostOnLeave: { client: number; tick: number; variables: string[] }[];
  transferDuringWrite: { from: number; to: number; tick: number }[];
  ignoredDeliveries: number;
  manualSendCount: number;
  manualDirtyEver: boolean;
  deniedOwnership: { client: number; tick: number }[];
}

interface Message {
  arriveTick: number;
  to: number;
  payload: Record<string, string>;
  cause: 'manual' | 'continuous' | 'join';
  /** Send order; same-tick arrivals apply oldest first so newer data wins. */
  seq: number;
}

const ACTION_ORDER: Record<ScenarioAction['type'], number> = {
  join: 0,
  leave: 1,
  takeOwnership: 2,
  write: 3,
  requestSerialization: 4,
  custom: 5,
};

export function simulate(config: SimConfig, scenario: Scenario): SimResult {
  const rng = createRng(config.seed);
  const n = config.clientCount;
  const vars = config.variables;
  const manualVars = vars.filter((v) => v.sync === 'manual');
  const continuousVars = vars.filter((v) => v.sync === 'continuous');

  const present = new Set<number>(scenario.initialPresent.filter((c) => c < n));
  if (present.size === 0) present.add(0);
  let master = Math.min(...present);
  let owner = master;

  const initials = (): Record<string, string> =>
    Object.fromEntries(vars.map((v) => [v.name, v.initial]));

  const perceived: Record<string, string>[] = Array.from({ length: n }, initials);
  /** Snapshot held by the network layer; what late joiners receive. */
  let lastSerialized: Record<string, string> = initials();

  let dirtyManual = false;
  let dirtyContinuous = false;
  let lastManualSendTick = -Infinity;

  const inflight: Message[] = [];
  let seqCounter = 0;
  const log: LogEntry[] = [];
  const timeline: ClientTick[][] = [];
  const divergences: Divergence[] = [];

  const evidence: Evidence = {
    lateJoins: [],
    nonOwnerWrites: [],
    concurrentWrites: [],
    droppedSerializations: 0,
    rsByNonOwner: [],
    lostOnLeave: [],
    transferDuringWrite: [],
    ignoredDeliveries: 0,
    manualSendCount: 0,
    manualDirtyEver: false,
    deniedOwnership: [],
  };

  let eventsThisTick: string[][] = [];
  const fire = (client: number, label: string) => {
    if (client >= 0 && client < n) eventsThisTick[client].push(label);
  };
  const fireAll = (label: string) => {
    for (const c of present) fire(c, label);
  };

  const send = (
    tick: number,
    cause: 'manual' | 'continuous',
    payloadVars: { name: string }[],
  ) => {
    const payload: Record<string, string> = {};
    for (const v of payloadVars) payload[v.name] = perceived[owner][v.name];
    Object.assign(lastSerialized, payload);
    for (const c of present) {
      if (c === owner) continue;
      inflight.push({
        arriveTick: tick + 1 + rng.int(2),
        to: c,
        payload: { ...payload },
        cause,
        seq: seqCounter++,
      });
    }
    log.push({
      tick,
      client: owner,
      kind: 'serialize',
      detail: `${cause}: ${payloadVars.map((v) => v.name).join(', ') || '(empty)'}`,
    });
    fire(owner, cause === 'manual' ? 'Serialize' : 'Serialize~');
  };

  const trySendManual = (tick: number): boolean => {
    if (tick - lastManualSendTick < RATE_COOLDOWN) {
      evidence.droppedSerializations++;
      log.push({ tick, client: owner, kind: 'dropped', detail: 'rate limit' });
      fire(owner, 'RS✕');
      return false;
    }
    lastManualSendTick = tick;
    evidence.manualSendCount++;
    dirtyManual = false;
    send(tick, 'manual', manualVars);
    return true;
  };

  const transferOwnership = (to: number, tick: number, reason: string) => {
    const from = owner;
    if (dirtyManual) {
      evidence.transferDuringWrite.push({ from, to, tick });
      dirtyManual = false; // unserialized state on the old owner is lost
    }
    owner = to;
    log.push({ tick, client: to, kind: 'ownership', detail: `${reason} (${from} -> ${to})` });
    fireAll('OnOwnershipTransferred');
    if (config.behavior.handleOwnershipTransferred && manualVars.length > 0) {
      trySendManual(tick);
    }
    if (continuousVars.length > 0) dirtyContinuous = true;
  };

  const totalTicks = scenario.ticks;
  for (let t = 0; t < totalTicks; t++) {
    eventsThisTick = Array.from({ length: n }, () => []);

    // 1. Deliver in-flight messages, oldest send first (newer data wins).
    const arrivals = inflight
      .filter((m) => m.arriveTick <= t)
      .sort((a, b) => a.seq - b.seq);
    for (const m of arrivals) {
      inflight.splice(inflight.indexOf(m), 1);
      if (!present.has(m.to)) continue;
      if (config.behavior.applyOnDeserialization) {
        Object.assign(perceived[m.to], m.payload);
        fire(m.to, 'OnDeserialization');
      } else {
        evidence.ignoredDeliveries++;
        fire(m.to, 'OnDeserialization✕');
      }
      log.push({ tick: t, client: m.to, kind: 'receive', detail: m.cause });
    }

    // 2. Scenario actions for this tick.
    const actions = scenario.actions
      .filter((a) => a.tick === t && a.client < n)
      .sort((a, b) => ACTION_ORDER[a.type] - ACTION_ORDER[b.type]);

    const writesByVar = new Map<string, Set<number>>();

    for (const a of actions) {
      switch (a.type) {
        case 'join': {
          if (present.has(a.client)) break;
          present.add(a.client);
          perceived[a.client] = initials();
          if (a.client < master) master = Math.min(...present);
          if (t > 0) evidence.lateJoins.push({ client: a.client, tick: t });
          log.push({ tick: t, client: a.client, kind: 'join', detail: '' });
          fireAll('OnPlayerJoined');
          // Serialize-on-join runs first so the join snapshot below is fresh.
          if (config.behavior.serializeOnPlayerJoined && manualVars.length > 0) {
            trySendManual(t);
          }
          // Network hands the last serialized snapshot to the newcomer.
          inflight.push({
            arriveTick: t + 1 + rng.int(2),
            to: a.client,
            payload: { ...lastSerialized },
            cause: 'join',
            seq: seqCounter++,
          });
          break;
        }
        case 'leave': {
          if (!present.has(a.client)) break;
          present.delete(a.client);
          if (present.size === 0) break;
          log.push({ tick: t, client: a.client, kind: 'leave', detail: '' });
          fireAll('OnPlayerLeft');
          const wasMaster = a.client === master;
          if (wasMaster) master = Math.min(...present);
          if (a.client === owner) {
            if (dirtyManual) {
              evidence.lostOnLeave.push({
                client: a.client,
                tick: t,
                variables: manualVars.map((v) => v.name),
              });
              dirtyManual = false;
            }
            // VRChat hands the object to the (new) master.
            const heir = master;
            const from = owner;
            owner = heir;
            log.push({ tick: t, client: heir, kind: 'ownership', detail: `owner left (${from} -> ${heir})` });
            fireAll('OnOwnershipTransferred');
            if (config.behavior.handleOwnershipTransferred && manualVars.length > 0) {
              trySendManual(t);
            }
            if (continuousVars.length > 0) dirtyContinuous = true;
          }
          break;
        }
        case 'takeOwnership': {
          if (!present.has(a.client) || a.client === owner) break;
          if (config.ownership === 'master' && a.client !== master) {
            evidence.deniedOwnership.push({ client: a.client, tick: t });
            log.push({ tick: t, client: a.client, kind: 'ownership-denied', detail: 'master authoritative' });
            fire(a.client, 'SetOwner✕');
            break;
          }
          transferOwnership(a.client, t, 'SetOwner');
          break;
        }
        case 'write': {
          if (!present.has(a.client) || !a.variable) break;
          const v = vars.find((x) => x.name === a.variable);
          if (!v) break;
          const value = a.value ?? '?';
          if (!writesByVar.has(v.name)) writesByVar.set(v.name, new Set());
          writesByVar.get(v.name)!.add(a.client);

          let writer = a.client;
          if (writer !== owner) {
            const canGrab = config.ownership !== 'master' || writer === master;
            if (config.behavior.setOwnerBeforeWrite && canGrab) {
              transferOwnership(writer, t, 'SetOwner before write');
            } else {
              // Local-only write: it will never replicate.
              perceived[writer][v.name] = value;
              evidence.nonOwnerWrites.push({ client: writer, tick: t, variable: v.name });
              log.push({ tick: t, client: writer, kind: 'write-local', detail: `${v.name}=${value}` });
              fire(writer, `W ${v.name}=${value} (local)`);
              break;
            }
          }
          perceived[writer][v.name] = value;
          if (v.sync === 'manual') {
            dirtyManual = true;
            evidence.manualDirtyEver = true;
          } else {
            dirtyContinuous = true;
          }
          log.push({ tick: t, client: writer, kind: 'write', detail: `${v.name}=${value}` });
          fire(writer, `W ${v.name}=${value}`);
          break;
        }
        case 'requestSerialization': {
          if (!present.has(a.client)) break;
          fire(a.client, 'RequestSerialization');
          if (a.client !== owner) {
            evidence.rsByNonOwner.push({ client: a.client, tick: t });
            log.push({ tick: t, client: a.client, kind: 'rs-noop', detail: 'non-owner' });
            break;
          }
          trySendManual(t);
          break;
        }
        case 'custom': {
          if (!present.has(a.client)) break;
          const name = a.event || 'CustomEvent';
          log.push({ tick: t, client: a.client, kind: 'custom', detail: name });
          fireAll(name);
          break;
        }
      }
    }

    for (const [variable, clients] of writesByVar) {
      if (clients.size > 1) {
        evidence.concurrentWrites.push({ tick: t, variable, clients: [...clients].sort() });
      }
    }

    // 3. Continuous auto-serialization.
    if (dirtyContinuous && continuousVars.length > 0 && t % CONTINUOUS_INTERVAL === 0) {
      dirtyContinuous = false;
      send(t, 'continuous', continuousVars);
    }

    // 4. Snapshot + divergence detection.
    const row: ClientTick[] = [];
    for (let c = 0; c < n; c++) {
      row.push({
        present: present.has(c),
        isOwner: c === owner && present.has(c),
        isMaster: c === master && present.has(c),
        values: { ...perceived[c] },
        events: eventsThisTick[c],
      });
    }
    timeline.push(row);

    for (const v of vars) {
      const seen = new Map<string, number[]>();
      for (const c of present) {
        const val = perceived[c][v.name];
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val)!.push(c);
      }
      if (seen.size > 1) {
        const values: Record<number, string> = {};
        for (const c of present) values[c] = perceived[c][v.name];
        divergences.push({ tick: t, variable: v.name, values });
      }
    }
  }

  const issues = deriveIssues(config, scenario, evidence, divergences, timeline, owner);
  return { ticks: totalTicks, clientCount: n, timeline, divergences, issues, log };
}
