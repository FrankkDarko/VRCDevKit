/** Default simulator configuration shared by the UI and tests. */
import type { SimConfig } from './types';

export function defaultConfig(): SimConfig {
  return {
    variables: [
      { name: 'score', type: 'int', sync: 'manual', initial: '0' },
      { name: 'doorOpen', type: 'bool', sync: 'continuous', initial: 'false' },
    ],
    ownership: 'perObject',
    behavior: {
      serializeOnPlayerJoined: false,
      applyOnDeserialization: true,
      handleOwnershipTransferred: false,
      setOwnerBeforeWrite: false,
      customEvents: [],
    },
    clientCount: 3,
    seed: 1337,
  };
}
