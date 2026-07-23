/** Turns simulation evidence into actionable, translatable issues. */
import type { ClientTick, Divergence, Issue, Scenario, SimConfig } from './types';
import type { Evidence } from './simulator';

const list = (xs: (number | string)[]) => [...new Set(xs)].join(', ');

export function deriveIssues(
  config: SimConfig,
  _scenario: Scenario,
  ev: Evidence,
  divergences: Divergence[],
  timeline: ClientTick[][],
  finalOwner: number,
): Issue[] {
  const issues: Issue[] = [];
  const lastRow = timeline[timeline.length - 1];
  const manualVars = config.variables.filter((v) => v.sync === 'manual');

  // Divergence still present on the final tick = the design does not converge.
  if (lastRow) {
    const finalDivergent = new Set(
      divergences
        .filter((d) => d.tick === timeline.length - 1)
        .map((d) => d.variable),
    );
    if (finalDivergent.size > 0) {
      issues.push({
        code: 'final-desync',
        severity: 'error',
        params: { vars: list([...finalDivergent]) },
      });
    }

    // Late joiner still disagreeing with the owner at the end.
    for (const j of ev.lateJoins) {
      const cell = lastRow[j.client];
      const ownerCell = lastRow[finalOwner];
      if (!cell?.present || !ownerCell) continue;
      const stale = config.variables
        .filter((v) => cell.values[v.name] !== ownerCell.values[v.name])
        .map((v) => v.name);
      if (stale.length > 0) {
        issues.push({
          code: 'late-joiner-missed-state',
          severity: 'error',
          params: { client: String(j.client), tick: String(j.tick), vars: list(stale) },
        });
      }
    }
  }

  if (ev.ignoredDeliveries > 0) {
    issues.push({
      code: 'missing-ondeserialization',
      severity: 'error',
      params: { count: String(ev.ignoredDeliveries) },
    });
  }

  if (ev.manualDirtyEver && ev.manualSendCount === 0 && manualVars.length > 0) {
    issues.push({
      code: 'no-serialization-manual',
      severity: 'error',
      params: { vars: list(manualVars.map((v) => v.name)) },
    });
  }

  if (ev.nonOwnerWrites.length > 0) {
    const clients = list(ev.nonOwnerWrites.map((w) => w.client));
    const vars = list(ev.nonOwnerWrites.map((w) => w.variable));
    issues.push({
      code: config.ownership === 'master' ? 'write-without-ownership-master' : 'write-without-ownership',
      severity: 'error',
      params: { clients, vars, count: String(ev.nonOwnerWrites.length) },
    });
  }

  for (const cw of ev.concurrentWrites) {
    issues.push({
      code: 'concurrent-write',
      severity: config.ownership === 'anyone' ? 'error' : 'warning',
      params: { variable: cw.variable, tick: String(cw.tick), clients: list(cw.clients) },
    });
  }

  if (ev.droppedSerializations > 0) {
    issues.push({
      code: 'serialization-rate-limited',
      severity: 'warning',
      params: { count: String(ev.droppedSerializations) },
    });
  }

  if (ev.rsByNonOwner.length > 0) {
    issues.push({
      code: 'request-serialization-non-owner',
      severity: 'warning',
      params: { clients: list(ev.rsByNonOwner.map((r) => r.client)) },
    });
  }

  for (const lost of ev.lostOnLeave) {
    issues.push({
      code: 'state-lost-on-leave',
      severity: 'error',
      params: { client: String(lost.client), tick: String(lost.tick), vars: list(lost.variables) },
    });
  }

  for (const tr of ev.transferDuringWrite) {
    issues.push({
      code: 'ownership-transfer-during-write',
      severity: 'error',
      params: { from: String(tr.from), to: String(tr.to), tick: String(tr.tick) },
    });
  }

  const order = { error: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}
