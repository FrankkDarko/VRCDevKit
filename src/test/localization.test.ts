import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from '../generators/localization/csv';
import { detectIssues } from '../generators/localization/detect';
import {
  generateLocalizationScript,
  toRuntimeJson,
} from '../generators/localization/codegen';
import { defaultTable, type LocTable } from '../generators/localization/types';

const table = (): LocTable => ({
  languages: ['en', 'fr', 'ja'],
  reference: 'en',
  rows: [
    { key: 'title', values: { en: 'Hello', fr: 'Bonjour', ja: 'こんにちは' } },
    {
      key: 'tricky',
      values: { en: 'He said "hi", ok?', fr: 'Ligne 1\nLigne 2', ja: '' },
    },
  ],
});

describe('CSV codec', () => {
  it('round-trips quotes, commas, newlines and unicode', () => {
    const t = table();
    const parsed = parseCsv(toCsv(t));
    expect(parsed.languages).toEqual(['en', 'fr', 'ja']);
    expect(parsed.rows).toEqual(t.rows);
  });

  it('round-trips with semicolon delimiter (French spreadsheet exports)', () => {
    const t = table();
    const csv = toCsv(t, ';');
    expect(csv.split('\r\n')[0]).toBe('key;en;fr;ja');
    expect(parseCsv(csv).rows).toEqual(t.rows);
  });

  it('fills missing trailing cells with empty strings', () => {
    const parsed = parseCsv('key,en,fr\nsolo,Hello\n');
    expect(parsed.rows[0].values).toEqual({ en: 'Hello', fr: '' });
  });

  it('rejects malformed headers', () => {
    expect(() => parseCsv('name,en\nx,y\n')).toThrow();
    expect(() => parseCsv('key\nx\n')).toThrow();
    expect(() => parseCsv('')).toThrow();
  });
});

describe('detectIssues', () => {
  it('flags empty keys, duplicates, orphans, missing translations and overflow', () => {
    const t: LocTable = {
      languages: ['en', 'fr'],
      reference: 'en',
      rows: [
        { key: '', values: { en: 'x', fr: 'y' } },
        { key: 'dup', values: { en: 'a', fr: 'b' } },
        { key: 'dup', values: { en: 'a', fr: 'b' } },
        { key: 'orphan', values: { en: '', fr: 'seulement en français' } },
        { key: 'missing', values: { en: 'present', fr: '' } },
        {
          key: 'long',
          values: { en: 'Short text', fr: 'Un texte considérablement plus long que la référence' },
        },
      ],
    };
    const issues = detectIssues(t);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain('empty-key');
    expect(codes).toContain('duplicate-key');
    expect(codes).toContain('orphan');
    expect(codes).toContain('missing');
    expect(codes).toContain('overflow');
    const overflow = issues.find((i) => i.code === 'overflow')!;
    expect(overflow.params.lang).toBe('fr');
  });

  it('reports nothing on a clean table', () => {
    expect(detectIssues(defaultTable())).toHaveLength(0);
  });

  it('does not flag overflow on tiny reference strings', () => {
    const t: LocTable = {
      languages: ['en', 'fr'],
      reference: 'en',
      rows: [{ key: 'ok', values: { en: 'OK', fr: "D'accord" } }],
    };
    expect(detectIssues(t).map((i) => i.code)).not.toContain('overflow');
  });
});

describe('runtime JSON', () => {
  it('emits index-aligned arrays', () => {
    const data = JSON.parse(toRuntimeJson(table()));
    expect(data.languages).toEqual(['en', 'fr', 'ja']);
    expect(data.keys).toEqual(['title', 'tricky']);
    expect(data.strings.fr[0]).toBe('Bonjour');
    expect(data.strings.ja[1]).toBe('');
  });
});

describe('generateLocalizationScript', () => {
  const code = generateLocalizationScript(table());

  it('produces a structurally sound behaviour', () => {
    expect(code).toContain('public class WorldLocalization : UdonSharpBehaviour');
    expect((code.match(/{/g) ?? []).length).toBe((code.match(/}/g) ?? []).length);
    expect(code).toContain('using TMPro;');
    expect(code).toContain('using UnityEngine.UI;');
  });

  it('embeds languages, keys and per-language string arrays', () => {
    expect(code).toContain('private readonly string[] _strings_en');
    expect(code).toContain('private readonly string[] _strings_fr');
    expect(code).toContain('private readonly string[] _strings_ja');
    expect(code).toContain('"こんにちは",');
    // escaping: quotes and newlines survive as valid C#
    expect(code).toContain('"He said \\"hi\\", ok?",');
    expect(code).toContain('"Ligne 1\\nLigne 2",');
  });

  it('resolves the player language with reference fallback', () => {
    expect(code).toContain('VRCPlayerApi.GetCurrentLanguage()');
    expect(code).toContain('private const int REFERENCE_INDEX = 0;');
    expect(code).toContain('public void SetLanguage(string code)');
    expect(code).toContain('public string Localize(string key)');
  });

  it('applies strings to Text and TextMeshProUGUI bindings', () => {
    expect(code).toContain('public Text[] uiTexts;');
    expect(code).toContain('public TextMeshProUGUI[] tmpTexts;');
    expect(code).toContain('uiTexts[i].text = Localize(uiTextKeys[i]);');
    expect(code).toContain('tmpTexts[i].text = Localize(tmpTextKeys[i]);');
  });

  it('sanitizes exotic language codes into identifiers', () => {
    const t = table();
    t.languages = ['en', 'pt-br'];
    t.rows.forEach((r) => (r.values['pt-br'] = 'x'));
    const c = generateLocalizationScript(t);
    expect(c).toContain('_strings_pt_br');
  });
});
