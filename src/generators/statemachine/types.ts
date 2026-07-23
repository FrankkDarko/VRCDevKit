/** UdonSharp state machine editor — domain types. No React, no DOM. */

/** Who is allowed to trigger transitions leaving a given state. */
export type SmAuthority = 'master' | 'owner' | 'anyone';

/** Synced variable types supported by the machine (kept simulator-compatible). */
export type SmVarType = 'bool' | 'int' | 'float' | 'string';

export interface SmVariable {
  name: string;
  type: SmVarType;
  initial: string;
}

/** Variable written when entering a state (value is a C# literal/expression). */
export interface SmAssignment {
  variable: string;
  value: string;
}

export interface SmState {
  id: string;
  name: string;
  x: number;
  y: number;
  authority: SmAuthority;
  assignments: SmAssignment[];
}

export interface SmTransition {
  id: string;
  /** Trigger name — becomes a public method (and a SendCustomEvent target). */
  name: string;
  from: string;
  to: string;
  /** Optional C# boolean expression guarding the transition. */
  condition: string;
}

export interface SmMachine {
  className: string;
  initialStateId: string;
  variables: SmVariable[];
  states: SmState[];
  transitions: SmTransition[];
}

export function defaultMachine(): SmMachine {
  return {
    className: 'DoorStateMachine',
    initialStateId: 's-closed',
    variables: [{ name: 'doorOpen', type: 'bool', initial: 'false' }],
    states: [
      { id: 's-closed', name: 'Closed', x: 80, y: 200, authority: 'anyone', assignments: [{ variable: 'doorOpen', value: 'false' }] },
      { id: 's-opening', name: 'Opening', x: 340, y: 60, authority: 'owner', assignments: [] },
      { id: 's-open', name: 'Open', x: 600, y: 200, authority: 'anyone', assignments: [{ variable: 'doorOpen', value: 'true' }] },
      { id: 's-closing', name: 'Closing', x: 340, y: 340, authority: 'owner', assignments: [] },
    ],
    transitions: [
      { id: 't1', name: 'Open', from: 's-closed', to: 's-opening', condition: '' },
      { id: 't2', name: 'FinishOpening', from: 's-opening', to: 's-open', condition: '' },
      { id: 't3', name: 'Close', from: 's-open', to: 's-closing', condition: '' },
      { id: 't4', name: 'FinishClosing', from: 's-closing', to: 's-closed', condition: '' },
    ],
  };
}

export type SmIssueCode =
  | 'no-states'
  | 'no-initial'
  | 'invalid-state-name'
  | 'duplicate-state-name'
  | 'invalid-transition-name'
  | 'dangling-transition'
  | 'duplicate-trigger'
  | 'unreachable-state'
  | 'unknown-variable'
  | 'invalid-variable-name'
  | 'duplicate-variable';

export interface SmIssue {
  code: SmIssueCode;
  severity: 'error' | 'warning' | 'info';
  params: Record<string, string>;
}
