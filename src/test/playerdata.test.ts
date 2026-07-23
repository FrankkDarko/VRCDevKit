import { describe, expect, it } from 'vitest';
import { diffSchemas, validateSchema } from '../generators/playerdata/diff';
import { defaultLiteral, generateCode, pascal, sanitizeIdent } from '../generators/playerdata/codegen';
import { conversionKind, type PdSchema } from '../generators/playerdata/types';

const schema = (over: Partial<PdSchema> = {}): PdSchema => ({
  className: 'PlayerSaveData',
  keyPrefix: 'save_',
  version: 1,
  fields: [
    { id: 'a', key: 'score', type: 'int', default: '0' },
    { id: 'b', key: 'title', type: 'string', default: 'novice' },
    { id: 'c', key: 'spawn', type: 'Vector3', default: '(1, 2, 3.5)' },
    { id: 'd', key: 'inventory', type: 'array', default: '' },
    { id: 'e', key: 'muted', type: 'bool', default: 'true' },
  ],
  ...over,
});

describe('schema validation', () => {
  it('flags duplicates, invalid identifiers and empty schemas', () => {
    const bad = schema({
      fields: [
        { id: 'a', key: 'score', type: 'int', default: '0' },
        { id: 'b', key: 'score', type: 'float', default: '0' },
        { id: 'c', key: '2bad key', type: 'int', default: '0' },
      ],
    });
    const codes = validateSchema(bad).map((w) => w.code);
    expect(codes).toContain('duplicate-key');
    expect(codes).toContain('invalid-key');
    expect(validateSchema(schema({ fields: [] })).map((w) => w.code)).toContain('no-fields');
    expect(validateSchema(schema())).toHaveLength(0);
  });
});

describe('conversion matrix', () => {
  it('classifies conversions', () => {
    expect(conversionKind('int', 'float')).toBe('safe');
    expect(conversionKind('bool', 'string')).toBe('safe');
    expect(conversionKind('float', 'int')).toBe('lossy');
    expect(conversionKind('string', 'int')).toBe('lossy');
    expect(conversionKind('Vector3', 'string')).toBe('none');
    expect(conversionKind('int', 'array')).toBe('none');
    expect(conversionKind('Vector3', 'Vector3')).toBe('safe');
  });
});

describe('diffSchemas', () => {
  const v1 = schema();
  const v2 = schema({
    version: 2,
    fields: [
      { id: 'a', key: 'points', type: 'int', default: '0' }, // renamed
      { id: 'b', key: 'title', type: 'string', default: 'novice' }, // unchanged
      { id: 'c', key: 'spawn', type: 'string', default: '' }, // Vector3 -> string: none
      // 'd' removed
      { id: 'e', key: 'muted', type: 'int', default: '0' }, // bool -> int: safe
      { id: 'f', key: 'lastSeen', type: 'float', default: '0' }, // added
    ],
  });
  const plan = diffSchemas(v1, v2);
  const kinds = plan.steps.map((s) => s.kind).sort();

  it('detects add, remove, rename and retype by field identity', () => {
    expect(kinds).toEqual(['add', 'remove', 'rename', 'retype', 'retype'].sort());
    const rename = plan.steps.find((s) => s.kind === 'rename')!;
    expect(rename).toMatchObject({ from: 'score', to: 'points' });
    const remove = plan.steps.find((s) => s.kind === 'remove')!;
    expect(remove).toMatchObject({ key: 'inventory' });
  });

  it('emits warnings for non-migratable and removed keys', () => {
    const codes = plan.warnings.map((w) => w.code);
    expect(codes).toContain('non-migratable'); // spawn Vector3 -> string
    expect(codes).toContain('removed-key-persists');
    expect(codes).not.toContain('version-not-bumped');
  });

  it('warns when the version was not bumped', () => {
    const same = diffSchemas(v1, { ...v2, version: 1 });
    expect(same.warnings.map((w) => w.code)).toContain('version-not-bumped');
  });

  it('reports no steps for an untouched schema', () => {
    expect(diffSchemas(v1, v1).steps).toHaveLength(0);
  });
});

describe('identifier helpers', () => {
  it('sanitizes and cases keys', () => {
    expect(sanitizeIdent('best lap-time!')).toBe('bestlaptime');
    expect(sanitizeIdent('2fast')).toBe('_2fast');
    expect(pascal('bestLapTime')).toBe('BestLapTime');
  });

  it('formats default literals per type', () => {
    expect(defaultLiteral('bool', 'TRUE')).toBe('true');
    expect(defaultLiteral('int', 'abc')).toBe('0');
    expect(defaultLiteral('float', '1.5')).toBe('1.5f');
    expect(defaultLiteral('string', 'a "quoted" \\ back')).toBe('"a \\"quoted\\" \\\\ back"');
    expect(defaultLiteral('Vector3', '(1, 2, 3.5)')).toBe('new Vector3(1f, 2f, 3.5f)');
    expect(defaultLiteral('Vector3', '')).toBe('new Vector3(0f, 0f, 0f)');
  });
});

describe('generateCode', () => {
  const v1 = schema();
  const code = generateCode(v1, null);

  it('produces a structurally sound class', () => {
    expect(code).toContain('public class PlayerSaveData : UdonSharpBehaviour');
    expect((code.match(/{/g) ?? []).length).toBe((code.match(/}/g) ?? []).length);
    expect(code).toContain('using VRC.SDK3.Persistence;');
    expect(code).toContain('using VRC.SDK3.Data;'); // array field present
  });

  it('handles the not-yet-restored state and defaults', () => {
    expect(code).toContain('public bool IsReady');
    expect(code).toContain('public override void OnPlayerRestored(VRCPlayerApi player)');
    expect(code).toContain('if (!player.isLocal) return;');
    expect(code).toContain('if (!_restored) return DEFAULT_SCORE;');
    expect(code).toContain('private const int DEFAULT_SCORE = 0;');
    expect(code).toContain('private const bool DEFAULT_MUTED = true;');
    expect(code).toMatch(/DEFAULT_SPAWN \{ get \{ return new Vector3\(1f, 2f, 3\.5f\); \} \}/);
  });

  it('generates typed accessors including JSON-backed arrays', () => {
    expect(code).toContain('public int GetScore()');
    expect(code).toContain('public void SetScore(int value)');
    expect(code).toContain('PlayerData.SetInt(K_SCORE, value);');
    expect(code).toContain('public DataList GetInventory()');
    expect(code).toContain('VRCJson.TrySerializeToJson');
    expect(code).toContain('VRCJson.TryDeserializeFromJson');
    expect(code).toContain('PlayerData.SetVector3(K_SPAWN, value);');
  });

  it('stamps the schema version even without migration', () => {
    expect(code).toContain('PlayerData.SetInt(KEY_SCHEMA_VERSION, SCHEMA_VERSION);');
  });

  it('generates the migration path', () => {
    const v2 = schema({
      version: 2,
      fields: [
        { id: 'a', key: 'points', type: 'int', default: '0' },
        { id: 'b', key: 'title', type: 'int', default: '0' }, // string -> int (lossy)
        { id: 'c', key: 'spawn', type: 'string', default: '' }, // none
        { id: 'e', key: 'muted', type: 'bool', default: 'true' },
        { id: 'f', key: 'lastSeen', type: 'float', default: '0' },
      ],
    });
    const plan = diffSchemas(v1, v2);
    const migrated = generateCode(v2, plan);
    expect(migrated).toContain('private void MigrateIfNeeded(VRCPlayerApi local)');
    expect(migrated).toContain('private void MigrateFromV1(VRCPlayerApi local)');
    // rename copies the old key into the new one
    expect(migrated).toContain('PlayerData.TryGetInt(local, KEY_PREFIX + "score"');
    expect(migrated).toContain('PlayerData.SetInt(K_POINTS,');
    // lossy string -> int goes through TryParse
    expect(migrated).toContain('int.TryParse');
    // non-migratable Vector3 -> string documented, not converted
    expect(migrated).toContain('NO automatic conversion from Vector3 to string');
    // removed key documented as orphaned
    expect(migrated).toContain('PlayerData cannot delete keys');
    expect((migrated.match(/{/g) ?? []).length).toBe((migrated.match(/}/g) ?? []).length);
  });

  it('uses the old prefix verbatim when it differs', () => {
    const v2 = schema({
      version: 2,
      keyPrefix: 'pd_',
      fields: [{ id: 'a', key: 'points', type: 'int', default: '0' }],
    });
    const plan = diffSchemas(v1, v2);
    const migrated = generateCode(v2, plan);
    expect(migrated).toContain('"save_score"');
  });
});
