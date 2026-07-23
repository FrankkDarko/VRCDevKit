import { describe, expect, it } from 'vitest';
import { decodeState, encodeState } from '../engine/serialize';
import { defaultConfig } from '../engine/defaults';
import { buildScenario } from '../engine/scenarios';

describe('state codec', () => {
  it('round-trips a full simulator state', async () => {
    const state = {
      config: defaultConfig(),
      scenario: buildScenario('masterLeave', defaultConfig()),
    };
    const encoded = await encodeState(state);
    expect(encoded).toMatch(/^[cp][A-Za-z0-9\-_]*$/); // URL-safe, no padding
    const decoded = await decodeState<typeof state>(encoded);
    expect(decoded).toEqual(state);
  });

  it('round-trips strings with unicode', async () => {
    const state = { text: 'héhé ✓ 日本語 «guillemets»' };
    expect(await decodeState(await encodeState(state))).toEqual(state);
  });

  it('compresses large payloads', async () => {
    const state = { arr: Array.from({ length: 200 }, (_, i) => ({ i, name: 'variable' + i })) };
    const encoded = await encodeState(state);
    expect(encoded.length).toBeLessThan(JSON.stringify(state).length / 2);
  });

  it('throws on malformed input', async () => {
    await expect(decodeState('x###')).rejects.toThrow();
    await expect(decodeState('p!!!')).rejects.toThrow();
  });
});
