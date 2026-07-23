/** Types produced by the tolerant C# parser. No React, no DOM. */

export interface ParsedField {
  name: string;
  type: string;
  /** How the field reaches the Inspector. */
  visibility: 'public' | 'serializedPrivate';
  tooltip?: string;
  /** [Header("...")] declared on this field (starts a group). */
  header?: string;
  range?: [string, string];
  synced: boolean;
  /** UdonSyncMode argument if given, e.g. "Linear". */
  syncMode?: string;
  hidden: boolean;
  defaultValue?: string;
}

export interface ParsedClass {
  name: string;
  baseTypes: string[];
  isUdonSharpBehaviour: boolean;
  fields: ParsedField[];
}

export type ParseWarningCode = 'no-class-found' | 'unbalanced-braces' | 'parse-error';

export interface ParseWarning {
  code: ParseWarningCode;
  detail?: string;
}

export interface ParseFileResult {
  fileName: string;
  classes: ParsedClass[];
  warnings: ParseWarning[];
}
