/**
 * One-off asset generation: favicon.png (32px) and og-image.png (1200x630)
 * rasterized from inline SVG. Run with:  node scripts/generate-assets.mjs
 * Requires sharp (npm i --no-save sharp). Outputs are committed, so this
 * script is not part of the build.
 */
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const faviconSvg = await readFile(new URL('../public/favicon.svg', import.meta.url));
await sharp(faviconSvg, { density: 300 }).resize(32, 32).png().toFile('public/favicon.png');
console.log('public/favicon.png written');

const mark = (x, y, s, color) => `
  <g transform="translate(${x} ${y}) scale(${s})" fill="none">
    <g stroke="${color}" stroke-width="2">
      <line x1="12" y1="7.5" x2="12" y2="10"/>
      <line x1="5.5" y1="18.5" x2="10.5" y2="13.2"/>
      <line x1="18.5" y1="18.5" x2="13.5" y2="13.2" stroke-dasharray="2 1.6"/>
    </g>
    <g fill="${color}">
      <rect x="9.1" y="1.6" width="5.8" height="5.8"/>
      <rect x="2.8" y="16.6" width="4.8" height="4.8"/>
      <rect x="16.4" y="16.6" width="4.8" height="4.8"/>
      <path d="M12 9.4 L14.6 12 L12 14.6 L9.4 12 Z"/>
    </g>
  </g>`;

const og = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0c0f0d"/>
  <rect x="0" y="0" width="1200" height="4" fill="#4ef07a"/>
  ${mark(120, 195, 10, '#4ef07a')}
  <text x="420" y="300" font-family="Consolas, monospace" font-size="86" font-weight="700" fill="#e8efe9">VRC_DEVKIT</text>
  <text x="424" y="370" font-family="Consolas, monospace" font-size="30" fill="#94a096">Udon sync simulator + UdonSharp docgen</text>
  <text x="424" y="425" font-family="Consolas, monospace" font-size="24" fill="#4ef07a">100% client-side · FR/EN · MIT</text>
</svg>`;

await sharp(Buffer.from(og)).png().toFile('public/og-image.png');
console.log('public/og-image.png written');
