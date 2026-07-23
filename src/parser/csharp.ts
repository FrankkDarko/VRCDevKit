/**
 * Tolerant, regex-free-ish C# field extractor for UdonSharp scripts.
 * No compiler: comments are stripped, strings are respected, braces are
 * matched, and anything that cannot be understood is skipped — a broken
 * file yields warnings, never an exception.
 */
import type { ParseFileResult, ParsedClass, ParsedField, ParseWarning } from './types';

/** Replace comments with spaces, keeping strings (incl. verbatim) intact. */
export function stripComments(src: string): string {
  const out = src.split('');
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = i + 1 < n ? src[i + 1] : '';
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') out[i++] = ' ';
    } else if (c === '/' && d === '*') {
      out[i++] = ' ';
      out[i++] = ' ';
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] !== '\n') out[i] = ' ';
        i++;
      }
      if (i < n) {
        out[i++] = ' ';
        out[i++] = ' ';
      }
    } else if (c === '@' && d === '"') {
      i += 2;
      while (i < n) {
        if (src[i] === '"' && src[i + 1] === '"') i += 2;
        else if (src[i] === '"') {
          i++;
          break;
        } else i++;
      }
    } else if (c === '"') {
      i++;
      while (i < n && src[i] !== '"') {
        if (src[i] === '\\') i++;
        i++;
      }
      i++;
    } else if (c === "'") {
      i++;
      while (i < n && src[i] !== "'") {
        if (src[i] === '\\') i++;
        i++;
      }
      i++;
    } else {
      i++;
    }
  }
  return out.join('');
}

/** Index of the char matching the opener at `open` ("{}"/"[]"/"()"), or -1. */
function matchDelim(s: string, open: number): number {
  const openCh = s[open];
  const closeCh = openCh === '{' ? '}' : openCh === '[' ? ']' : ')';
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\') i++;
        i++;
      }
    } else if (c === "'") {
      i++;
      while (i < s.length && s[i] !== "'") {
        if (s[i] === '\\') i++;
        i++;
      }
    } else if (c === openCh) depth++;
    else if (c === closeCh) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Split on top-level commas (ignoring commas nested in (), [], <>, {} or strings). */
function splitTopLevel(s: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let angle = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\') i++;
        i++;
      }
    } else if (c === "'") {
      i++;
      while (i < s.length && s[i] !== "'") {
        if (s[i] === '\\') i++;
        i++;
      }
    } else if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === '<') angle++;
    else if (c === '>') angle = Math.max(0, angle - 1);
    else if (c === sep && depth === 0 && angle === 0) {
      parts.push(s.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(s.slice(start));
  return parts;
}

/** Extract the string literal from an attribute argument like "text". */
function stringArg(arg: string): string {
  const t = arg.trim();
  if (t.startsWith('@"') && t.endsWith('"')) return t.slice(2, -1).replace(/""/g, '"');
  if (t.startsWith('"') && t.endsWith('"')) {
    return t
      .slice(1, -1)
      .replace(/\\"/g, '"')
      .replace(/\\n/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\\/g, '\\');
  }
  return t;
}

interface AttrInfo {
  tooltip?: string;
  header?: string;
  range?: [string, string];
  synced: boolean;
  syncMode?: string;
  serializeField: boolean;
  hidden: boolean;
}

function parseAttributes(chunks: string[]): AttrInfo {
  const info: AttrInfo = { synced: false, serializeField: false, hidden: false };
  for (const raw of chunks) {
    for (const attr of splitTopLevel(raw, ',')) {
      let a = attr.trim();
      // attribute targets like [field: SerializeField]
      const colon = a.match(/^(?:field|property)\s*:\s*(.*)$/);
      if (colon) a = colon[1];
      const m = a.match(/^([A-Za-z_][\w.]*)\s*(?:\((.*)\))?$/s);
      if (!m) continue;
      const name = m[1].split('.').pop() ?? m[1];
      const args = m[2] !== undefined ? splitTopLevel(m[2], ',') : [];
      switch (name.replace(/Attribute$/, '')) {
        case 'Tooltip':
          if (args[0] !== undefined) info.tooltip = stringArg(args[0]);
          break;
        case 'Header':
          if (args[0] !== undefined) info.header = stringArg(args[0]);
          break;
        case 'Range':
          if (args.length >= 2) info.range = [args[0].trim(), args[1].trim()];
          break;
        case 'UdonSynced':
          info.synced = true;
          if (args[0]) info.syncMode = args[0].trim().split('.').pop();
          break;
        case 'SerializeField':
          info.serializeField = true;
          break;
        case 'HideInInspector':
          info.hidden = true;
          break;
      }
    }
  }
  return info;
}

const MODIFIERS = new Set([
  'public', 'private', 'protected', 'internal', 'static', 'readonly', 'const',
  'volatile', 'new', 'override', 'sealed', 'abstract', 'partial', 'extern', 'unsafe',
]);

/** Parse one member declaration (attributes already removed). */
function parseFieldDecl(decl: string, attrs: AttrInfo): ParsedField[] {
  if (/^\s*$/.test(decl)) return [];
  if (decl.includes('=>')) return []; // expression-bodied member
  const head = splitTopLevel(decl, '=')[0];
  if (head.includes('(')) return []; // method / constructor / delegate

  const tokens = decl.trim().split(/\s+/);
  const mods = new Set<string>();
  let idx = 0;
  while (idx < tokens.length && MODIFIERS.has(tokens[idx])) {
    mods.add(tokens[idx]);
    idx++;
  }
  if (mods.has('event')) return [];
  const rest = tokens.slice(idx).join(' ');
  if (!rest) return [];

  const isPublic = mods.has('public');
  const inspector =
    (isPublic && !mods.has('static') && !mods.has('const')) || attrs.serializeField;
  if (!inspector && !attrs.synced) return [];

  // "Type name = default, name2 = default2"
  const declarators = splitTopLevel(rest, ',');
  const first = declarators[0];
  const eq = splitTopLevel(first, '=');
  const left = eq[0].trim();
  const nameMatch = left.match(/([A-Za-z_]\w*)\s*$/);
  if (!nameMatch) return [];
  const name = nameMatch[1];
  const type = left.slice(0, left.length - nameMatch[0].length).trim();
  if (!type || type === 'using' || type === 'namespace' || type === 'return') return [];

  const fields: ParsedField[] = [];
  const mk = (fname: string, def?: string): ParsedField => ({
    name: fname,
    type,
    visibility: isPublic ? 'public' : 'serializedPrivate',
    tooltip: attrs.tooltip,
    header: attrs.header,
    range: attrs.range,
    synced: attrs.synced,
    syncMode: attrs.syncMode,
    hidden: attrs.hidden,
    defaultValue: def?.trim() || undefined,
  });
  fields.push(mk(name, eq.slice(1).join('=')));
  for (const d of declarators.slice(1)) {
    const dq = splitTopLevel(d, '=');
    const dn = dq[0].trim().match(/^[A-Za-z_]\w*$/);
    if (dn) fields.push(mk(dn[0], dq.slice(1).join('=')));
  }
  return fields;
}

/** Extract fields declared at the top level of a class body. */
function extractFields(body: string): ParsedField[] {
  const fields: ParsedField[] = [];
  let i = 0;
  let buffer = '';
  let attrChunks: string[] = [];
  let currentHeader: string | undefined;

  const flush = () => {
    const attrs = parseAttributes(attrChunks);
    if (attrs.header !== undefined) currentHeader = attrs.header;
    for (const f of parseFieldDecl(buffer, attrs)) {
      // fields keep grouping under the last seen [Header]
      f.header = currentHeader;
      fields.push(f);
    }
    buffer = '';
    attrChunks = [];
  };

  while (i < body.length) {
    const c = body[i];
    if (c === '"' || c === "'") {
      const quote = c;
      buffer += c;
      i++;
      while (i < body.length && body[i] !== quote) {
        if (body[i] === '\\') {
          buffer += body[i];
          i++;
        }
        buffer += body[i];
        i++;
      }
      buffer += body[i] ?? '';
      i++;
    } else if (c === '[' && buffer.trim() === '') {
      const close = matchDelim(body, i);
      if (close < 0) break;
      attrChunks.push(body.slice(i + 1, close));
      i = close + 1;
    } else if (c === '{') {
      const close = matchDelim(body, i);
      if (close < 0) break;
      const hasInitializer = /=(?!=)[^;]*$/.test(buffer) && !splitTopLevel(buffer, '=')[0].includes('(');
      if (hasInitializer) {
        buffer += body.slice(i, close + 1);
      } else {
        // method / property / nested type body — not a field
        buffer = '';
        attrChunks = [];
      }
      i = close + 1;
    } else if (c === ';') {
      flush();
      i++;
    } else {
      buffer += c;
      i++;
    }
  }
  return fields;
}

const CLASS_RE = /\b(?:class|struct)\s+([A-Za-z_]\w*)/g;

export function parseCSharpFile(fileName: string, source: string): ParseFileResult {
  const warnings: ParseWarning[] = [];
  const classes: ParsedClass[] = [];
  try {
    const clean = stripComments(source);
    let m: RegExpExecArray | null;
    CLASS_RE.lastIndex = 0;
    while ((m = CLASS_RE.exec(clean)) !== null) {
      const name = m[1];
      const bodyOpen = clean.indexOf('{', m.index);
      if (bodyOpen < 0) {
        warnings.push({ code: 'unbalanced-braces', detail: name });
        continue;
      }
      const headText = clean.slice(m.index + m[0].length, bodyOpen);
      const colonIdx = headText.indexOf(':');
      const baseTypes =
        colonIdx >= 0
          ? splitTopLevel(headText.slice(colonIdx + 1), ',')
              .map((s) => s.trim().split('.').pop() ?? '')
              .filter(Boolean)
          : [];
      const bodyClose = matchDelim(clean, bodyOpen);
      if (bodyClose < 0) {
        warnings.push({ code: 'unbalanced-braces', detail: name });
      }
      const body = clean.slice(bodyOpen + 1, bodyClose < 0 ? clean.length : bodyClose);
      classes.push({
        name,
        baseTypes,
        isUdonSharpBehaviour: baseTypes.includes('UdonSharpBehaviour'),
        fields: extractFields(body),
      });
    }
    if (classes.length === 0) warnings.push({ code: 'no-class-found' });
  } catch (e) {
    warnings.push({ code: 'parse-error', detail: e instanceof Error ? e.message : String(e) });
  }
  return { fileName, classes, warnings };
}
