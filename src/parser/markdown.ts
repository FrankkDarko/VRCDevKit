/** Builds the installation guide (Markdown) from parsed classes. */
import type { ParseFileResult, ParsedClass, ParsedField } from './types';
import { docDicts, type DocLang } from '../i18n/docgen';

const fmt = (template: string, params: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? `{${k}}`);

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const code = (s: string) => '`' + s.replace(/`/g, "'") + '`';

function fieldRow(f: ParsedField, d: (typeof docDicts)['en']): string {
  let desc = f.tooltip ? cell(f.tooltip) : d.noDescription;
  if (f.range) {
    const note = fmt(d.rangeNote, { min: f.range[0], max: f.range[1] });
    desc = desc === d.noDescription ? note : `${desc} (${note})`;
  }
  const def = f.defaultValue ? code(cell(f.defaultValue)) : d.noDefault;
  return `| ${code(f.name)} | ${code(f.type)} | ${desc} | ${def} |`;
}

function componentSection(cls: ParsedClass, d: (typeof docDicts)['en']): string {
  const lines: string[] = [];
  lines.push(`### ${cls.name}${cls.isUdonSharpBehaviour ? ` \`${d.behaviourBadge}\`` : ''}`);
  lines.push('');
  if (!cls.isUdonSharpBehaviour) {
    lines.push(d.notBehaviourNote);
    lines.push('');
  }
  const inspectorFields = cls.fields.filter((f) => !f.hidden);
  if (inspectorFields.length === 0) {
    lines.push(d.noInspectorFields);
    lines.push('');
    return lines.join('\n');
  }
  lines.push(fmt(d.componentIntro, { name: cls.name }));
  lines.push('');

  // Preserve declaration order, breaking into [Header] groups.
  let currentHeader: string | undefined | null = null;
  let tableOpen = false;
  const openTable = () => {
    lines.push(`| ${d.colField} | ${d.colType} | ${d.colDescription} | ${d.colDefault} |`);
    lines.push('| --- | --- | --- | --- |');
    tableOpen = true;
  };
  for (const f of inspectorFields) {
    if (f.header !== currentHeader) {
      currentHeader = f.header;
      if (tableOpen) lines.push('');
      if (currentHeader) {
        lines.push(`#### ${currentHeader}`);
        lines.push('');
      }
      openTable();
    } else if (!tableOpen) {
      openTable();
    }
    lines.push(fieldRow(f, d));
  }
  lines.push('');
  return lines.join('\n');
}

export function generateMarkdown(
  results: ParseFileResult[],
  lang: DocLang,
  assetName?: string,
): string {
  const d = docDicts[lang];
  const classes = results.flatMap((r) => r.classes);
  const name =
    assetName?.trim() ||
    classes.find((c) => c.isUdonSharpBehaviour)?.name ||
    classes[0]?.name ||
    'Asset';

  const out: string[] = [];
  out.push(`# ${fmt(d.title, { name })}`);
  out.push('');
  out.push(d.intro);
  out.push('');

  out.push(`## ${d.prerequisites}`);
  out.push('');
  out.push(`- ${d.prereqUnity}`);
  out.push(`- ${d.prereqSdk}`);
  out.push(`- ${d.prereqUdonSharp}`);
  out.push('');

  out.push(`## ${d.installSteps}`);
  out.push('');
  const behaviourNames = classes
    .filter((c) => c.isUdonSharpBehaviour)
    .map((c) => code(c.name))
    .join(', ');
  out.push(`1. ${d.step1}`);
  out.push(`2. ${d.step2}`);
  out.push(`3. ${fmt(d.step3, { components: behaviourNames || code(name) })}`);
  out.push(`4. ${d.step4}`);
  out.push('');

  out.push(`## ${d.components}`);
  out.push('');
  for (const cls of classes) {
    out.push(componentSection(cls, d));
  }

  out.push(`## ${d.syncedTitle}`);
  out.push('');
  const synced = classes.flatMap((c) =>
    c.fields.filter((f) => f.synced).map((f) => ({ cls: c.name, f })),
  );
  if (synced.length === 0) {
    out.push(d.syncedNone);
  } else {
    out.push(d.syncedIntro);
    out.push('');
    out.push(`| ${d.colVariable} | ${d.colComponent} | ${d.colSyncMode} |`);
    out.push('| --- | --- | --- |');
    for (const { cls, f } of synced) {
      out.push(`| ${code(f.name)} | ${code(cls)} | ${f.syncMode ?? 'None (manual/continuous per behaviour)'} |`);
    }
    out.push('');
    out.push(d.syncManualNote);
  }
  out.push('');

  out.push(`## ${d.troubleshooting}`);
  out.push('');
  out.push(`**${d.trouble1q}**`);
  out.push('');
  out.push(d.trouble1a);
  out.push('');
  out.push(`**${d.trouble2q}**`);
  out.push('');
  out.push(d.trouble2a);
  out.push('');
  out.push(`**${d.trouble3q}**`);
  out.push('');
  out.push(d.trouble3a);
  out.push('');
  out.push('---');
  out.push('');
  out.push(`*${d.generatedBy}*`);
  out.push('');
  return out.join('\n');
}

/** Strip Markdown syntax for the "copy as plain text" button. */
export function markdownToPlainText(md: string): string {
  return md
    .replace(/^\s*\|.*\|\s*$/gm, (row) =>
      /^\s*\|[\s\-|]+\|\s*$/.test(row)
        ? ''
        : row
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
            .join('  —  '),
    )
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^---$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
