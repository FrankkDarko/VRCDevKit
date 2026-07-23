/** Schema validation and migration-plan computation (pure functions). */
import {
  conversionKind,
  type MigrationPlan,
  type MigrationStep,
  type PdSchema,
  type SchemaWarning,
} from './types';

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Structural validation of a schema on its own (no baseline needed). */
export function validateSchema(schema: PdSchema): SchemaWarning[] {
  const warnings: SchemaWarning[] = [];
  if (schema.fields.length === 0) {
    warnings.push({ code: 'no-fields', severity: 'error', params: {} });
  }
  const seen = new Map<string, number>();
  for (const f of schema.fields) {
    seen.set(f.key, (seen.get(f.key) ?? 0) + 1);
    if (!IDENT_RE.test(f.key)) {
      warnings.push({ code: 'invalid-key', severity: 'error', params: { key: f.key || '∅' } });
    }
  }
  for (const [key, count] of seen) {
    if (count > 1) {
      warnings.push({ code: 'duplicate-key', severity: 'error', params: { key } });
    }
  }
  return warnings;
}

/**
 * Compute the migration plan between a baseline schema and the edited one.
 * Fields are matched by their stable `id`, never by key name.
 */
export function diffSchemas(oldSchema: PdSchema, newSchema: PdSchema): MigrationPlan {
  const steps: MigrationStep[] = [];
  const warnings: SchemaWarning[] = [];
  const oldById = new Map(oldSchema.fields.map((f) => [f.id, f]));
  const newIds = new Set(newSchema.fields.map((f) => f.id));

  for (const field of newSchema.fields) {
    const before = oldById.get(field.id);
    if (!before) {
      steps.push({ kind: 'add', key: field.key, type: field.type, default: field.default });
      continue;
    }
    const renamed = before.key !== field.key;
    const retyped = before.type !== field.type;
    if (!renamed && !retyped) continue;

    const conversion = conversionKind(before.type, field.type);
    if (renamed && retyped) {
      steps.push({
        kind: 'rename-retype',
        from: before.key,
        to: field.key,
        fromType: before.type,
        toType: field.type,
        conversion,
      });
    } else if (renamed) {
      steps.push({ kind: 'rename', from: before.key, to: field.key, type: field.type });
    } else {
      steps.push({
        kind: 'retype',
        key: field.key,
        fromType: before.type,
        toType: field.type,
        conversion,
      });
    }
    if (retyped) {
      if (conversion === 'lossy') {
        warnings.push({
          code: 'lossy-conversion',
          severity: 'warning',
          params: { key: field.key, from: before.type, to: field.type },
        });
      } else if (conversion === 'none') {
        warnings.push({
          code: 'non-migratable',
          severity: 'error',
          params: { key: field.key, from: before.type, to: field.type },
        });
      }
    }
  }

  for (const before of oldSchema.fields) {
    if (!newIds.has(before.id)) {
      steps.push({ kind: 'remove', key: before.key, type: before.type });
      warnings.push({
        code: 'removed-key-persists',
        severity: 'info',
        params: { key: before.key },
      });
    }
  }

  if (steps.length > 0 && newSchema.version <= oldSchema.version) {
    warnings.push({
      code: 'version-not-bumped',
      severity: 'warning',
      params: { old: String(oldSchema.version), new: String(newSchema.version) },
    });
  }

  return {
    fromVersion: oldSchema.version,
    toVersion: newSchema.version,
    oldKeyPrefix: oldSchema.keyPrefix,
    steps,
    warnings,
  };
}
