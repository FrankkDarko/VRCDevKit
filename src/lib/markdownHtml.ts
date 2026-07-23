/**
 * Minimal Markdown -> HTML renderer for the doc preview.
 * Supports exactly the subset emitted by generateMarkdown:
 * headings, tables, ordered/unordered lists, bold/italic/inline code, hr.
 * All text is HTML-escaped before inline formatting is applied.
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(
    /(https?:\/\/[^\s<]+[^\s<.,)])/g,
    '<a href="$1" target="_blank" rel="noreferrer noopener">$1</a>',
  );
  return out;
}

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isSeparatorRow = (l: string) => /^\s*\|[\s\-:|]+\|\s*$/.test(l);

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));

export function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (t === '') {
      i++;
      continue;
    }
    if (t.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }
    const heading = t.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i++;
      continue;
    }
    if (t === '---') {
      out.push('<hr />');
      i++;
      continue;
    }
    if (isTableRow(t) && i + 1 < lines.length && isSeparatorRow(lines[i + 1].trim())) {
      const header = cells(t);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        rows.push(cells(lines[i].trim()));
        i++;
      }
      out.push('<table><thead><tr>');
      for (const h of header) out.push(`<th>${inline(h)}</th>`);
      out.push('</tr></thead><tbody>');
      for (const r of rows) {
        out.push('<tr>');
        for (const c of r) out.push(`<td>${inline(c)}</td>`);
        out.push('</tr>');
      }
      out.push('</tbody></table>');
      continue;
    }
    const ol = t.match(/^(\d+)\.\s+(.*)$/);
    if (ol) {
      out.push('<ol>');
      while (i < lines.length) {
        const m = lines[i].trim().match(/^\d+\.\s+(.*)$/);
        if (!m) break;
        out.push(`<li>${inline(m[1])}</li>`);
        i++;
      }
      out.push('</ol>');
      continue;
    }
    if (/^[-*]\s+/.test(t)) {
      out.push('<ul>');
      while (i < lines.length) {
        const m = lines[i].trim().match(/^[-*]\s+(.*)$/);
        if (!m) break;
        out.push(`<li>${inline(m[1])}</li>`);
        i++;
      }
      out.push('</ul>');
      continue;
    }
    // paragraph: merge consecutive plain lines
    const para: string[] = [t];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#|\||-|\*|\d+\.|---|```)/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}
