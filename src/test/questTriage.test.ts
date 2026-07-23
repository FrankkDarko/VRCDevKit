import { describe, expect, it } from 'vitest';
import {
  TRIAGE_NODES,
  TRIAGE_ROOT,
  type LocalizedText,
  type QuestionNode,
  type SheetNode,
} from '../data/questTriage';

const nodes = Object.values(TRIAGE_NODES);
const questions = nodes.filter((n): n is QuestionNode => n.kind === 'question');
const sheets = nodes.filter((n): n is SheetNode => n.kind === 'sheet');

const localizedTexts = (n: (typeof nodes)[number]): LocalizedText[] =>
  n.kind === 'question'
    ? [n.text, ...(n.hint ? [n.hint] : []), ...n.answers.map((a) => a.label)]
    : [n.title, n.cause, n.check, ...n.fix];

describe('quest triage tree integrity', () => {
  it('has a root question with the five entry symptoms', () => {
    const root = TRIAGE_NODES[TRIAGE_ROOT];
    expect(root).toBeDefined();
    expect(root.kind).toBe('question');
    expect((root as QuestionNode).answers).toHaveLength(5);
  });

  it('ids are consistent and every answer targets an existing node', () => {
    for (const [key, node] of Object.entries(TRIAGE_NODES)) {
      expect(node.id).toBe(key);
    }
    for (const q of questions) {
      for (const a of q.answers) {
        expect(TRIAGE_NODES[a.next], `${q.id} -> ${a.next}`).toBeDefined();
      }
    }
  });

  it('every node is reachable from the root and every path ends on a sheet', () => {
    const reachable = new Set<string>();
    const stack = [TRIAGE_ROOT];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      const node = TRIAGE_NODES[id];
      if (node.kind === 'question') {
        expect(node.answers.length, `${id} needs >= 2 answers`).toBeGreaterThanOrEqual(2);
        stack.push(...node.answers.map((a) => a.next));
      }
    }
    for (const node of nodes) {
      expect(reachable.has(node.id), `${node.id} unreachable`).toBe(true);
    }
  });

  it('has no cycles (a triage path always terminates)', () => {
    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (id: string) => {
      expect(visiting.has(id), `cycle through ${id}`).toBe(false);
      if (done.has(id)) return;
      visiting.add(id);
      const node = TRIAGE_NODES[id];
      if (node.kind === 'question') for (const a of node.answers) visit(a.next);
      visiting.delete(id);
      done.add(id);
    };
    visit(TRIAGE_ROOT);
  });

  it('every localized string exists in both languages', () => {
    for (const node of nodes) {
      for (const lt of localizedTexts(node)) {
        expect(lt.fr.trim(), `${node.id}: empty fr`).not.toBe('');
        expect(lt.en.trim(), `${node.id}: empty en`).not.toBe('');
      }
    }
  });

  it('every sheet has a cause, a check and at least two fix steps', () => {
    expect(sheets.length).toBeGreaterThanOrEqual(10);
    for (const s of sheets) {
      expect(s.fix.length, `${s.id} fix steps`).toBeGreaterThanOrEqual(2);
    }
  });

  it('covers the mandated cases: Shader Graph, lightmap bakes, mobile shaders', () => {
    expect(TRIAGE_NODES['sheet-shadergraph']).toBeDefined();
    expect(TRIAGE_NODES['sheet-lightmap-rebake']).toBeDefined();
    expect(TRIAGE_NODES['sheet-shader-fallback']).toBeDefined();
  });
});
