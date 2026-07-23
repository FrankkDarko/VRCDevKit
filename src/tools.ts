/**
 * Single registry of every tool: id (= hash route), category, availability.
 * The router, the header menu and the home page all derive from this table —
 * shipping a new tool means flipping `enabled` and adding its page component.
 */
import type { MessageKey } from './i18n/types';

export type ToolId =
  | 'simulator'
  | 'docgen'
  | 'playerdata'
  | 'statemachine'
  | 'vpm'
  | 'quest-triage'
  | 'localization';

export type Category = 'network' | 'distribution' | 'content' | 'diagnostic';

export interface ToolDef {
  id: ToolId;
  num: string;
  category: Category;
  enabled: boolean;
}

export const CATEGORIES: Category[] = ['network', 'distribution', 'content', 'diagnostic'];

export const TOOLS: ToolDef[] = [
  { id: 'simulator', num: '01', category: 'network', enabled: true },
  { id: 'statemachine', num: '02', category: 'network', enabled: false },
  { id: 'playerdata', num: '03', category: 'network', enabled: false },
  { id: 'docgen', num: '04', category: 'distribution', enabled: true },
  { id: 'vpm', num: '05', category: 'distribution', enabled: false },
  { id: 'localization', num: '06', category: 'content', enabled: false },
  { id: 'quest-triage', num: '07', category: 'diagnostic', enabled: true },
];

export const toolTitleKey = (id: ToolId) => `tool.${id}.title` as MessageKey;
export const toolDescKey = (id: ToolId) => `tool.${id}.desc` as MessageKey;
export const categoryKey = (c: Category) => `category.${c}` as MessageKey;

export const isToolId = (s: string): s is ToolId => TOOLS.some((t) => t.id === s);
export const isEnabledTool = (s: string): s is ToolId =>
  TOOLS.some((t) => t.id === s && t.enabled);
