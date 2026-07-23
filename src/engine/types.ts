/** Core domain types for the Udon sync simulator. No React, no DOM. */

export type VarType = 'bool' | 'int' | 'float' | 'string' | 'Vector3' | 'array';
export type SyncMode = 'manual' | 'continuous';

export interface SyncedVariable {
  name: string;
  type: VarType;
  sync: SyncMode;
  /** Initial value, kept as string; interpreted per type for display only. */
  initial: string;
}

export type OwnershipModel = 'master' | 'perObject' | 'anyone';

/** Which handlers / patterns the simulated UdonSharp script implements. */
export interface ScriptBehavior {
  /** Owner calls RequestSerialization inside OnPlayerJoined. */
  serializeOnPlayerJoined: boolean;
  /** Script implements OnDeserialization and applies received state. */
  applyOnDeserialization: boolean;
  /** Script handles OnOwnershipTransferred (re-serializes as new owner). */
  handleOwnershipTransferred: boolean;
  /** Script calls Networking.SetOwner before writing synced variables. */
  setOwnerBeforeWrite: boolean;
  /** Custom network event names the script sends/receives (display only). */
  customEvents: string[];
}

export interface SimConfig {
  variables: SyncedVariable[];
  ownership: OwnershipModel;
  behavior: ScriptBehavior;
  /** Number of virtual clients, 2..8. Client ids are 0-based. */
  clientCount: number;
  seed: number;
}

export type ActionType =
  | 'join'
  | 'leave'
  | 'write'
  | 'requestSerialization'
  | 'takeOwnership'
  | 'custom';

export interface ScenarioAction {
  tick: number;
  client: number;
  type: ActionType;
  variable?: string;
  value?: string;
  event?: string;
}

export interface Scenario {
  /** Predefined scenario id, or 'custom'. */
  id: string;
  /** Clients present at tick 0 (client ids). */
  initialPresent: number[];
  actions: ScenarioAction[];
  ticks: number;
}

/** One client's perceived world at one tick. */
export interface ClientTick {
  present: boolean;
  isOwner: boolean;
  isMaster: boolean;
  /** Perceived value per variable name. */
  values: Record<string, string>;
  /** Event labels fired on this client this tick (e.g. "OnDeserialization"). */
  events: string[];
}

export interface Divergence {
  tick: number;
  variable: string;
  /** client id -> perceived value (only present clients). */
  values: Record<number, string>;
}

export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Issues are emitted as codes; the UI translates code -> cause/fix strings.
 * `params` feeds interpolation ({var}, {client}, {count}...).
 */
export interface Issue {
  code: IssueCode;
  severity: IssueSeverity;
  params: Record<string, string>;
}

export type IssueCode =
  | 'late-joiner-missed-state'
  | 'missing-ondeserialization'
  | 'write-without-ownership'
  | 'write-without-ownership-master'
  | 'concurrent-write'
  | 'serialization-rate-limited'
  | 'request-serialization-non-owner'
  | 'state-lost-on-leave'
  | 'ownership-transfer-during-write'
  | 'final-desync'
  | 'no-serialization-manual';

export interface LogEntry {
  tick: number;
  /** -1 means "network / instance" (no specific client). */
  client: number;
  kind: string;
  detail: string;
}

export interface SimResult {
  ticks: number;
  clientCount: number;
  /** timeline[tick][clientId] */
  timeline: ClientTick[][];
  divergences: Divergence[];
  issues: Issue[];
  log: LogEntry[];
}
