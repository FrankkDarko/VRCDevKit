import { describe, expect, it } from 'vitest';
import { crc32, createZip } from '../lib/zip';

const u32At = (b: Uint8Array, off: number) =>
  (b[off] | (b[off + 1] << 8) | (b[off + 2] << 16) | (b[off + 3] << 24)) >>> 0;
const u16At = (b: Uint8Array, off: number) => b[off] | (b[off + 1] << 8);

describe('crc32', () => {
  it('matches known vectors', () => {
    const enc = new TextEncoder();
    expect(crc32(enc.encode('hello'))).toBe(0x3610a686);
    expect(crc32(enc.encode(''))).toBe(0);
    expect(crc32(enc.encode('The quick brown fox jumps over the lazy dog'))).toBe(0x414fa339);
  });
});

describe('createZip', () => {
  const zip = createZip([
    { name: 'hello.txt', data: 'hello' },
    { name: 'dir/é.json', data: '{"a":1}' },
  ]);

  it('starts with a local header and ends with EOCD', () => {
    expect(u32At(zip, 0)).toBe(0x04034b50);
    expect(u32At(zip, zip.length - 22)).toBe(0x06054b50);
  });

  it('stores data uncompressed at a predictable offset', () => {
    // local header is 30 bytes + name length
    const nameLen = u16At(zip, 26);
    expect(nameLen).toBe('hello.txt'.length);
    const data = new TextDecoder().decode(zip.slice(30 + nameLen, 30 + nameLen + 5));
    expect(data).toBe('hello');
    expect(u32At(zip, 14)).toBe(0x3610a686); // crc of "hello"
    expect(u16At(zip, 8)).toBe(0); // method: store
    expect(u16At(zip, 6)).toBe(0x0800); // UTF-8 flag
  });

  it('records both entries in the central directory and EOCD', () => {
    const eocd = zip.length - 22;
    expect(u16At(zip, eocd + 10)).toBe(2); // total entries
    const centralStart = u32At(zip, eocd + 16);
    expect(u32At(zip, centralStart)).toBe(0x02014b50);
    // UTF-8 name survives byte-for-byte
    const bytes = new TextEncoder().encode('dir/é.json');
    const hay = zip.join(',');
    expect(hay.includes(bytes.join(','))).toBe(true);
  });

  it('is deterministic for identical input', () => {
    const again = createZip([
      { name: 'hello.txt', data: 'hello' },
      { name: 'dir/é.json', data: '{"a":1}' },
    ]);
    expect(again.length).toBe(zip.length);
    expect(again.every((b, i) => b === zip[i])).toBe(true);
  });
});
