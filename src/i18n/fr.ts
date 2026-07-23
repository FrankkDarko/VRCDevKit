/**
 * French dictionary — source of truth for the message keys.
 * Split by domain in ./fr/; each new tool adds its own module here.
 */
import { common } from './fr/common';
import { simulator } from './fr/simulator';
import { docgen } from './fr/docgen';

export const fr = {
  ...common,
  ...simulator,
  ...docgen,
} as const;
