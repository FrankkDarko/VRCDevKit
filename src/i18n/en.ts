/**
 * English dictionary — the compiler enforces exhaustiveness against `fr`
 * at the merge below (missing keys fail the build).
 */
import type { Dict } from './types';
import { common } from './en/common';
import { simulator } from './en/simulator';
import { docgen } from './en/docgen';

export const en: Dict = {
  ...common,
  ...simulator,
  ...docgen,
};
