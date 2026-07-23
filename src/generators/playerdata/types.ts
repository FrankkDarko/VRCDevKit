/** PlayerData schema generator — domain types. No React, no DOM. */

export type PdType = 'bool' | 'int' | 'float' | 'string' | 'Vector3' | 'array';

export const PD_TYPES: PdType[] = ['bool', 'int', 'float', 'string', 'Vector3', 'array'];

export interface SchemaField {
  /**
   * Stable identity, independent from the key name. When a schema is loaded
   * as a migration baseline, edits keep the id — which is how a rename is
   * distinguished from a remove + add without any heuristic.
   */
  id: string;
  key: string;
  type: PdType;
  /** Default value, kept as a string; interpreted per type at codegen. */
  default: string;
}

export interface PdSchema {
  className: string;
  /** Prefix applied to every PlayerData key to avoid collisions. */
  keyPrefix: string;
  version: number;
  fields: SchemaField[];
}

export function defaultSchema(): PdSchema {
  return {
    className: 'PlayerSaveData',
    keyPrefix: 'save_',
    version: 1,
    fields: [
      { id: 'f1', key: 'score', type: 'int', default: '0' },
      { id: 'f2', key: 'bestLapTime', type: 'float', default: '0' },
      { id: 'f3', key: 'title', type: 'string', default: '' },
    ],
  };
}

/** How a stored value can move from one type to another during migration. */
export type Conversion = 'safe' | 'lossy' | 'none';

export function conversionKind(from: PdType, to: PdType): Conversion {
  if (from === to) return 'safe';
  const safe: Record<string, true> = {
    'int>float': true,
    'int>string': true,
    'float>string': true,
    'bool>string': true,
    'bool>int': true,
  };
  const lossy: Record<string, true> = {
    'float>int': true,
    'string>int': true,
    'string>float': true,
    'string>bool': true,
    'int>bool': true,
  };
  const pair = `${from}>${to}`;
  if (safe[pair]) return 'safe';
  if (lossy[pair]) return 'lossy';
  return 'none';
}

export type MigrationStep =
  | { kind: 'add'; key: string; type: PdType; default: string }
  | { kind: 'remove'; key: string; type: PdType }
  | { kind: 'rename'; from: string; to: string; type: PdType }
  | { kind: 'retype'; key: string; fromType: PdType; toType: PdType; conversion: Conversion }
  | {
      kind: 'rename-retype';
      from: string;
      to: string;
      fromType: PdType;
      toType: PdType;
      conversion: Conversion;
    };

export type WarningCode =
  | 'lossy-conversion'
  | 'non-migratable'
  | 'removed-key-persists'
  | 'version-not-bumped'
  | 'duplicate-key'
  | 'invalid-key'
  | 'no-fields';

export interface SchemaWarning {
  code: WarningCode;
  severity: 'error' | 'warning' | 'info';
  params: Record<string, string>;
}

export interface MigrationPlan {
  fromVersion: number;
  toVersion: number;
  /** Prefix the baseline schema used — old keys are read with it. */
  oldKeyPrefix: string;
  steps: MigrationStep[];
  warnings: SchemaWarning[];
}
