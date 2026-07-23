import { describe, expect, it } from 'vitest';
import { simulate } from '../engine/simulator';
import { buildScenario } from '../engine/scenarios';
import { defaultConfig } from '../engine/defaults';
import type { SimConfig } from '../engine/types';

const manualOnly = (over: Partial<SimConfig> = {}): SimConfig => ({
  ...defaultConfig(),
  variables: [{ name: 'score', type: 'int', sync: 'manual', initial: '0' }],
  ...over,
});

const continuousOnly = (over: Partial<SimConfig> = {}): SimConfig => ({
  ...defaultConfig(),
  variables: [{ name: 'pos', type: 'Vector3', sync: 'continuous', initial: '(0,0,0)' }],
  ...over,
});

const codes = (r: ReturnType<typeof simulate>) => r.issues.map((i) => i.code);

describe('determinism', () => {
  it('same config and scenario produce identical results', () => {
    const config = defaultConfig();
    const scenario = buildScenario('masterLeave', config);
    const a = simulate(config, scenario);
    const b = simulate(config, scenario);
    expect(a).toEqual(b);
  });

  it('timeline has one row per tick and one cell per client', () => {
    const config = defaultConfig();
    const scenario = buildScenario('lateJoiner', config);
    const r = simulate(config, scenario);
    expect(r.timeline).toHaveLength(scenario.ticks);
    for (const row of r.timeline) expect(row).toHaveLength(config.clientCount);
  });
});

describe('late joiner', () => {
  it('manual sync without any serialization leaves the joiner (and everyone) stale', () => {
    const config = manualOnly();
    const r = simulate(config, buildScenario('lateJoiner', config));
    expect(codes(r)).toContain('late-joiner-missed-state');
    expect(codes(r)).toContain('no-serialization-manual');
    const last = r.timeline[r.timeline.length - 1];
    expect(last[0].values.score).toBe('42');
    expect(last[config.clientCount - 1].values.score).toBe('0');
    expect(r.divergences.length).toBeGreaterThan(0);
  });

  it('serializeOnPlayerJoined makes the late joiner converge', () => {
    const config = manualOnly();
    config.behavior.serializeOnPlayerJoined = true;
    const r = simulate(config, buildScenario('lateJoiner', config));
    const last = r.timeline[r.timeline.length - 1];
    for (const cell of last.filter((c) => c.present)) {
      expect(cell.values.score).toBe('42');
    }
    expect(codes(r)).not.toContain('late-joiner-missed-state');
  });

  it('continuous sync converges without RequestSerialization', () => {
    const config = continuousOnly();
    const r = simulate(config, buildScenario('lateJoiner', config));
    const last = r.timeline[r.timeline.length - 1];
    for (const cell of last.filter((c) => c.present)) {
      expect(cell.values.pos).toBe('42');
    }
    expect(codes(r)).not.toContain('late-joiner-missed-state');
  });
});

describe('ownership', () => {
  it('stealing ownership during an unserialized write loses the write', () => {
    const config = manualOnly();
    const r = simulate(config, buildScenario('ownershipSteal', config));
    expect(codes(r)).toContain('ownership-transfer-during-write');
    const last = r.timeline[r.timeline.length - 1];
    for (const cell of last.filter((c) => c.present)) {
      expect(cell.values.score).toBe('B'); // the thief's value won
    }
  });

  it('master-authoritative model denies SetOwner from non-masters', () => {
    const config = manualOnly({ ownership: 'master' });
    const r = simulate(config, buildScenario('ownershipSteal', config));
    const last = r.timeline[r.timeline.length - 1];
    expect(last[0].isOwner).toBe(true); // client 1 never got ownership
    expect(codes(r)).toContain('write-without-ownership-master');
  });

  it('a non-owner write never replicates and is flagged', () => {
    const config = manualOnly();
    const r = simulate(config, buildScenario('concurrentWrite', config));
    expect(codes(r)).toContain('write-without-ownership');
    expect(codes(r)).toContain('concurrent-write');
    const last = r.timeline[r.timeline.length - 1];
    for (const cell of last.filter((c) => c.present)) {
      expect(cell.values.score).toBe('A'); // owner's value wins everywhere
    }
  });

  it('setOwnerBeforeWrite lets the second writer take over', () => {
    const config = manualOnly();
    config.behavior.setOwnerBeforeWrite = true;
    const r = simulate(config, buildScenario('concurrentWrite', config));
    expect(codes(r)).not.toContain('write-without-ownership');
    const last = r.timeline[r.timeline.length - 1];
    expect(last[1].isOwner).toBe(true);
  });
});

describe('leaves and migration', () => {
  it('master leave migrates master and owner, unserialized state is lost', () => {
    const config = manualOnly();
    const r = simulate(config, buildScenario('masterLeave', config));
    expect(codes(r)).toContain('state-lost-on-leave');
    const last = r.timeline[r.timeline.length - 1];
    expect(last[0].present).toBe(false);
    expect(last[1].isMaster).toBe(true);
    expect(last[1].isOwner).toBe(true);
    for (const cell of last.filter((c) => c.present)) {
      expect(cell.values.score).toBe('3'); // the value 2 (never serialized) is gone
    }
  });

  it('instance owner leave converges cleanly with default behavior', () => {
    const config = manualOnly();
    const r = simulate(config, buildScenario('instanceOwnerLeave', config));
    const last = r.timeline[r.timeline.length - 1];
    expect(last[1].isMaster).toBe(true);
    for (const cell of last.filter((c) => c.present)) {
      expect(cell.values.score).toBe('7');
    }
    expect(codes(r)).not.toContain('final-desync');
  });
});

describe('serialization limits', () => {
  it('a burst of RequestSerialization gets rate limited', () => {
    const config = manualOnly();
    const r = simulate(config, buildScenario('serializationBurst', config));
    expect(codes(r)).toContain('serialization-rate-limited');
    const last = r.timeline[r.timeline.length - 1];
    for (const cell of last.filter((c) => c.present)) {
      expect(cell.values.score).toBe('3'); // still converges eventually
    }
  });

  it('ignoring OnDeserialization is reported and blocks convergence', () => {
    const config = manualOnly();
    config.behavior.applyOnDeserialization = false;
    const r = simulate(config, buildScenario('serializationBurst', config));
    expect(codes(r)).toContain('missing-ondeserialization');
    expect(codes(r)).toContain('final-desync');
  });
});
