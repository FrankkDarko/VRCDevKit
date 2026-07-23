import { describe, expect, it } from 'vitest';
import { markdownToHtml } from '../lib/markdownHtml';

describe('markdownToHtml', () => {
  it('renders headings, lists and tables', () => {
    const html = markdownToHtml('# Title\n\n- a\n- b\n\n| X | Y |\n| --- | --- |\n| 1 | 2 |');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<th>X</th>');
    expect(html).toContain('<td>2</td>');
  });

  it('renders fenced code blocks with escaped content', () => {
    const html = markdownToHtml('```csharp\npublic class A<T> { int x = 1 & 2; }\n```');
    expect(html).toContain('<pre><code>');
    expect(html).toContain('A&lt;T&gt;');
    expect(html).toContain('1 &amp; 2');
    expect(html).not.toContain('```');
  });

  it('escapes HTML in regular text', () => {
    const html = markdownToHtml('Hello <script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
