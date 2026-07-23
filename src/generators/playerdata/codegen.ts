/**
 * UdonSharp code generation for the PlayerData schema (pure functions).
 *
 * The generated class follows the VRChat Persistence API:
 * - values are cached locally and refreshed in OnPlayerRestored;
 * - getters return the default until data is restored (IsReady flag);
 * - `array` fields are persisted as JSON strings via VRCJson (PlayerData has
 *   no list type), exposed as DataList;
 * - a schema-version key drives the generated migration path.
 */
import type { MigrationPlan, MigrationStep, PdSchema, PdType, SchemaField } from './types';

/* ------------------------------------------------------------ naming */

export function sanitizeIdent(raw: string): string {
  let s = raw.replace(/[^A-Za-z0-9_]/g, '');
  if (s === '' || /^[0-9]/.test(s)) s = '_' + s;
  return s;
}

export const pascal = (key: string): string => {
  const s = sanitizeIdent(key);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const upperSnake = (key: string): string =>
  sanitizeIdent(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();

const constKey = (key: string) => `K_${upperSnake(key)}`;
const constDefault = (key: string) => `DEFAULT_${upperSnake(key)}`;
const cacheField = (key: string) => `_${sanitizeIdent(key)}`;

/* ------------------------------------------------------- type tables */

const CS_TYPE: Record<PdType, string> = {
  bool: 'bool',
  int: 'int',
  float: 'float',
  string: 'string',
  Vector3: 'Vector3',
  array: 'DataList',
};

/** PlayerData accessor suffix; arrays are persisted as JSON strings. */
const PD_SUFFIX: Record<PdType, string> = {
  bool: 'Bool',
  int: 'Int',
  float: 'Float',
  string: 'String',
  Vector3: 'Vector3',
  array: 'String',
};

export function defaultLiteral(type: PdType, raw: string): string {
  const v = raw.trim();
  switch (type) {
    case 'bool':
      return /^(true|1)$/i.test(v) ? 'true' : 'false';
    case 'int': {
      const n = parseInt(v, 10);
      return String(Number.isFinite(n) ? n : 0);
    }
    case 'float': {
      const n = parseFloat(v);
      return `${Number.isFinite(n) ? n : 0}f`;
    }
    case 'string':
      return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    case 'Vector3': {
      const parts = v.replace(/[()]/g, '').split(',').map((p) => parseFloat(p.trim()));
      const [x, y, z] = [0, 1, 2].map((i) => (Number.isFinite(parts[i]) ? parts[i] : 0));
      return `new Vector3(${x}f, ${y}f, ${z}f)`;
    }
    case 'array':
      return '"[]"';
  }
}

/* ------------------------------------------------------- generation */

const line = (indent: number, text = '') => (text === '' ? '' : '    '.repeat(indent) + text);

function fieldAccessors(f: SchemaField, className: string): string[] {
  const P = pascal(f.key);
  const K = constKey(f.key);
  const cache = cacheField(f.key);
  const out: string[] = [];

  if (f.type === 'array') {
    out.push(
      line(1, `/// <summary>Persisted as JSON via VRCJson. Empty list until data is restored.</summary>`),
      line(1, `public DataList Get${P}()`),
      line(1, `{`),
      line(2, `if (!_restored) return new DataList();`),
      line(2, `return ${cache};`),
      line(1, `}`),
      '',
      line(1, `public void Set${P}(DataList value)`),
      line(1, `{`),
      line(2, `if (!_restored)`),
      line(2, `{`),
      line(3, `Debug.LogWarning("[${className}] Set${P} ignored: player data not restored yet.");`),
      line(3, `return;`),
      line(2, `}`),
      line(2, `${cache} = value;`),
      line(2, `DataToken json;`),
      line(2, `if (VRCJson.TrySerializeToJson(new DataToken(value), JsonExportType.Minify, out json))`),
      line(2, `{`),
      line(3, `PlayerData.SetString(${K}, json.String);`),
      line(2, `}`),
      line(1, `}`),
    );
    return out;
  }

  const cs = CS_TYPE[f.type];
  out.push(
    line(1, `/// <summary>Returns the default value until data is restored (see IsReady).</summary>`),
    line(1, `public ${cs} Get${P}()`),
    line(1, `{`),
    line(2, `if (!_restored) return ${constDefault(f.key)};`),
    line(2, `return ${cache};`),
    line(1, `}`),
    '',
    line(1, `public void Set${P}(${cs} value)`),
    line(1, `{`),
    line(2, `if (!_restored)`),
    line(2, `{`),
    line(3, `Debug.LogWarning("[${className}] Set${P} ignored: player data not restored yet.");`),
    line(3, `return;`),
    line(2, `}`),
    line(2, `${cache} = value;`),
    line(2, `PlayerData.Set${PD_SUFFIX[f.type]}(${K}, value);`),
    line(1, `}`),
  );
  return out;
}

function loadStatement(f: SchemaField, idx: number): string[] {
  const K = constKey(f.key);
  const cache = cacheField(f.key);
  const tmp = `v${idx}`;
  if (f.type === 'array') {
    return [
      line(2, `string ${tmp};`),
      line(2, `${cache} = new DataList();`),
      line(2, `if (PlayerData.TryGetString(local, ${K}, out ${tmp}))`),
      line(2, `{`),
      line(3, `DataToken parsed;`),
      line(3, `if (VRCJson.TryDeserializeFromJson(${tmp}, out parsed) && parsed.TokenType == TokenType.DataList)`),
      line(3, `{`),
      line(4, `${cache} = parsed.DataList;`),
      line(3, `}`),
      line(2, `}`),
    ];
  }
  const cs = CS_TYPE[f.type];
  return [
    line(2, `${cs} ${tmp};`),
    line(
      2,
      `${cache} = PlayerData.TryGet${PD_SUFFIX[f.type]}(local, ${K}, out ${tmp}) ? ${tmp} : ${constDefault(f.key)};`,
    ),
  ];
}

function migrationStep(step: MigrationStep, plan: MigrationPlan, prefix: string, idx: number): string[] {
  const tmp = `m${idx}`;
  const oldKeyExpr = (key: string) =>
    plan.oldKeyPrefix === prefix ? `KEY_PREFIX + "${key}"` : `"${plan.oldKeyPrefix}${key}"`;

  switch (step.kind) {
    case 'add':
      return [line(2, `// added: ${step.key} (${step.type}) — absent for existing players, the default applies on load.`)];
    case 'remove':
      return [
        line(2, `// removed: ${step.key} (${step.type}) — PlayerData cannot delete keys; the old key`),
        line(2, `// simply stops being read and stays orphaned in the player's data.`),
      ];
    case 'rename': {
      const suffix = PD_SUFFIX[step.type];
      if (step.type === 'array') {
        return [
          line(2, `// renamed: ${step.from} -> ${step.to} (array as JSON string)`),
          line(2, `string ${tmp};`),
          line(2, `if (PlayerData.TryGetString(local, ${oldKeyExpr(step.from)}, out ${tmp}))`),
          line(2, `{`),
          line(3, `PlayerData.SetString(${constKey(step.to)}, ${tmp});`),
          line(2, `}`),
        ];
      }
      return [
        line(2, `// renamed: ${step.from} -> ${step.to} (${step.type})`),
        line(2, `${CS_TYPE[step.type]} ${tmp};`),
        line(2, `if (PlayerData.TryGet${suffix}(local, ${oldKeyExpr(step.from)}, out ${tmp}))`),
        line(2, `{`),
        line(3, `PlayerData.Set${suffix}(${constKey(step.to)}, ${tmp});`),
        line(2, `}`),
      ];
    }
    case 'retype':
    case 'rename-retype': {
      const from = step.kind === 'retype' ? step.key : step.from;
      const to = step.kind === 'retype' ? step.key : step.to;
      const head =
        step.kind === 'retype'
          ? `// type changed: ${to} (${step.fromType} -> ${step.toType})`
          : `// renamed + type changed: ${from} -> ${to} (${step.fromType} -> ${step.toType})`;
      if (step.conversion === 'none') {
        return [
          line(2, head),
          line(2, `// NO automatic conversion from ${step.fromType} to ${step.toType}:`),
          line(2, `// the previous value is abandoned and the new default applies on load.`),
        ];
      }
      const readSuffix = PD_SUFFIX[step.fromType];
      const newK = constKey(to);
      const lines = [
        line(2, head + (step.conversion === 'lossy' ? ' — lossy' : '')),
        line(2, `${CS_TYPE[step.fromType]} ${tmp};`),
        line(2, `if (PlayerData.TryGet${readSuffix}(local, ${oldKeyExpr(from)}, out ${tmp}))`),
        line(2, `{`),
      ];
      const pair = `${step.fromType}>${step.toType}`;
      switch (pair) {
        case 'int>float':
          lines.push(line(3, `PlayerData.SetFloat(${newK}, (float)${tmp});`));
          break;
        case 'float>int':
          lines.push(line(3, `PlayerData.SetInt(${newK}, (int)${tmp}); // truncated`));
          break;
        case 'int>string':
        case 'float>string':
        case 'bool>string':
          lines.push(line(3, `PlayerData.SetString(${newK}, ${tmp}.ToString());`));
          break;
        case 'bool>int':
          lines.push(line(3, `PlayerData.SetInt(${newK}, ${tmp} ? 1 : 0);`));
          break;
        case 'int>bool':
          lines.push(line(3, `PlayerData.SetBool(${newK}, ${tmp} != 0);`));
          break;
        case 'string>int': {
          lines.push(
            line(3, `int parsed${idx};`),
            line(3, `if (int.TryParse(${tmp}, out parsed${idx})) PlayerData.SetInt(${newK}, parsed${idx});`),
            line(3, `// unparsable values fall back to the default on load`),
          );
          break;
        }
        case 'string>float': {
          lines.push(
            line(3, `float parsed${idx};`),
            line(3, `if (float.TryParse(${tmp}, out parsed${idx})) PlayerData.SetFloat(${newK}, parsed${idx});`),
          );
          break;
        }
        case 'string>bool':
          lines.push(line(3, `PlayerData.SetBool(${newK}, ${tmp} == "True" || ${tmp} == "true" || ${tmp} == "1");`));
          break;
        default:
          lines.push(line(3, `// unsupported conversion ${pair}`));
      }
      lines.push(line(2, `}`));
      return lines;
    }
  }
}

export function generateCode(schema: PdSchema, plan: MigrationPlan | null): string {
  const cls = sanitizeIdent(schema.className) || 'PlayerSaveData';
  const hasArray = schema.fields.some((f) => f.type === 'array');
  const hasMigration = plan !== null && plan.steps.length > 0;
  const out: string[] = [];

  out.push(
    `/*`,
    ` * ${cls}.cs — generated by VRC DevKit (PlayerData schema generator)`,
    ` * Schema version ${schema.version}. Persisted keys use the prefix "${schema.keyPrefix}".`,
    ` * https://frankkdarko.github.io/VRCDevKit/#/playerdata`,
    ` */`,
    `using UdonSharp;`,
    `using UnityEngine;`,
    `using VRC.SDKBase;`,
    `using VRC.SDK3.Persistence;`,
  );
  if (hasArray) out.push(`using VRC.SDK3.Data;`);
  out.push(
    ``,
    `[UdonBehaviourSyncMode(BehaviourSyncMode.None)]`,
    `public class ${cls} : UdonSharpBehaviour`,
    `{`,
    line(1, `private const int SCHEMA_VERSION = ${schema.version};`),
    line(1, `private const string KEY_PREFIX = "${schema.keyPrefix}";`),
    line(1, `private const string KEY_SCHEMA_VERSION = KEY_PREFIX + "__schemaVersion";`),
    ``,
    line(1, `// ---- persisted keys`),
  );
  for (const f of schema.fields) {
    out.push(line(1, `private const string ${constKey(f.key)} = KEY_PREFIX + "${f.key}";`));
  }

  out.push(``, line(1, `// ---- defaults (applied when a key is absent or data not restored)`));
  for (const f of schema.fields) {
    if (f.type === 'array') continue; // arrays default to an empty DataList
    if (f.type === 'Vector3') {
      out.push(
        line(1, `private Vector3 ${constDefault(f.key)} { get { return ${defaultLiteral(f.type, f.default)}; } }`),
      );
    } else {
      out.push(
        line(1, `private const ${CS_TYPE[f.type]} ${constDefault(f.key)} = ${defaultLiteral(f.type, f.default)};`),
      );
    }
  }

  out.push(``, line(1, `// ---- local cache`), line(1, `private bool _restored;`));
  for (const f of schema.fields) {
    out.push(line(1, `private ${CS_TYPE[f.type]} ${cacheField(f.key)};`));
  }

  out.push(
    ``,
    line(1, `/// <summary>False until the local player's persisted data has been restored.</summary>`),
    line(1, `public bool IsReady { get { return _restored; } }`),
    ``,
    line(1, `public override void OnPlayerRestored(VRCPlayerApi player)`),
    line(1, `{`),
    line(2, `if (!player.isLocal) return;`),
    line(2, `VRCPlayerApi local = player;`),
  );
  if (hasMigration) out.push(line(2, `MigrateIfNeeded(local);`));
  else {
    out.push(line(2, `// stamp the schema version for future migrations`), line(2, `PlayerData.SetInt(KEY_SCHEMA_VERSION, SCHEMA_VERSION);`));
  }
  out.push(line(2, `LoadAll(local);`), line(2, `_restored = true;`), line(1, `}`), ``);

  out.push(line(1, `private void LoadAll(VRCPlayerApi local)`), line(1, `{`));
  schema.fields.forEach((f, i) => out.push(...loadStatement(f, i)));
  out.push(line(1, `}`), ``);

  if (hasMigration && plan) {
    out.push(
      line(1, `private void MigrateIfNeeded(VRCPlayerApi local)`),
      line(1, `{`),
      line(2, `int stored;`),
      line(2, `if (!PlayerData.TryGetInt(local, KEY_SCHEMA_VERSION, out stored)) stored = 0;`),
      line(2, `if (stored >= SCHEMA_VERSION) return;`),
      line(2, `if (stored == ${plan.fromVersion} || stored == 0)`),
      line(2, `{`),
      line(3, `MigrateFromV${plan.fromVersion}(local);`),
      line(2, `}`),
      line(2, `PlayerData.SetInt(KEY_SCHEMA_VERSION, SCHEMA_VERSION);`),
      line(1, `}`),
      ``,
      line(1, `private void MigrateFromV${plan.fromVersion}(VRCPlayerApi local)`),
      line(1, `{`),
    );
    plan.steps.forEach((step, i) => {
      out.push(...migrationStep(step, plan, schema.keyPrefix, i));
      if (i < plan.steps.length - 1) out.push(``);
    });
    out.push(line(1, `}`), ``);
  }

  out.push(line(1, `// ---- typed accessors`));
  schema.fields.forEach((f, i) => {
    out.push(...fieldAccessors(f, cls));
    if (i < schema.fields.length - 1) out.push(``);
  });

  out.push(`}`, ``);
  return out.join('\n');
}
