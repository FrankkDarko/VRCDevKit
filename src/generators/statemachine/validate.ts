/** Structural validation of a state machine (pure functions). */
import type { SmIssue, SmMachine } from './types';

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function validateMachine(m: SmMachine): SmIssue[] {
  const issues: SmIssue[] = [];
  const stateIds = new Set(m.states.map((s) => s.id));

  if (m.states.length === 0) {
    issues.push({ code: 'no-states', severity: 'error', params: {} });
    return issues;
  }
  if (!stateIds.has(m.initialStateId)) {
    issues.push({ code: 'no-initial', severity: 'error', params: {} });
  }

  const stateNames = new Map<string, number>();
  for (const s of m.states) {
    if (!IDENT_RE.test(s.name)) {
      issues.push({ code: 'invalid-state-name', severity: 'error', params: { name: s.name || '∅' } });
    }
    stateNames.set(s.name, (stateNames.get(s.name) ?? 0) + 1);
    for (const a of s.assignments) {
      if (!m.variables.some((v) => v.name === a.variable)) {
        issues.push({
          code: 'unknown-variable',
          severity: 'error',
          params: { state: s.name, variable: a.variable },
        });
      }
    }
  }
  for (const [name, count] of stateNames) {
    if (count > 1) {
      issues.push({ code: 'duplicate-state-name', severity: 'error', params: { name } });
    }
  }

  const varNames = new Map<string, number>();
  for (const v of m.variables) {
    if (!IDENT_RE.test(v.name)) {
      issues.push({ code: 'invalid-variable-name', severity: 'error', params: { name: v.name || '∅' } });
    }
    varNames.set(v.name, (varNames.get(v.name) ?? 0) + 1);
  }
  for (const [name, count] of varNames) {
    if (count > 1) {
      issues.push({ code: 'duplicate-variable', severity: 'error', params: { name } });
    }
  }

  const triggerBySource = new Map<string, Set<string>>();
  for (const t of m.transitions) {
    if (!IDENT_RE.test(t.name)) {
      issues.push({ code: 'invalid-transition-name', severity: 'error', params: { name: t.name || '∅' } });
    }
    if (!stateIds.has(t.from) || !stateIds.has(t.to)) {
      issues.push({ code: 'dangling-transition', severity: 'error', params: { name: t.name } });
      continue;
    }
    // Two transitions with the same trigger from the same state are ambiguous.
    if (!triggerBySource.has(t.from)) triggerBySource.set(t.from, new Set());
    const set = triggerBySource.get(t.from)!;
    if (set.has(t.name)) {
      const from = m.states.find((s) => s.id === t.from)!.name;
      issues.push({ code: 'duplicate-trigger', severity: 'error', params: { name: t.name, state: from } });
    }
    set.add(t.name);
  }

  // Reachability from the initial state.
  if (stateIds.has(m.initialStateId)) {
    const reachable = new Set<string>([m.initialStateId]);
    const queue = [m.initialStateId];
    while (queue.length > 0) {
      const cur = queue.pop()!;
      for (const t of m.transitions) {
        if (t.from === cur && stateIds.has(t.to) && !reachable.has(t.to)) {
          reachable.add(t.to);
          queue.push(t.to);
        }
      }
    }
    for (const s of m.states) {
      if (!reachable.has(s.id)) {
        issues.push({ code: 'unreachable-state', severity: 'warning', params: { name: s.name } });
      }
    }
  }

  const order = { error: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}
