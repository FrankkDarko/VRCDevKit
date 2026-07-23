/**
 * Shareable-state codec: JSON -> deflate -> base64url (and back).
 * Used for the URL hash (#/simulator?s=...) and clipboard sharing.
 * Falls back to plain base64url where CompressionStream is unavailable.
 */

export interface ShareState {
  config: unknown;
  scenario: unknown;
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function bytesToBase64url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    if (i + 1 < bytes.length) out += B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)];
    if (i + 2 < bytes.length) out += B64_CHARS[b2 & 63];
  }
  return out;
}

function base64urlToBytes(s: string): Uint8Array {
  const idx = (c: string) => {
    const i = B64_CHARS.indexOf(c);
    if (i < 0) throw new Error('invalid base64url');
    return i;
  };
  const out: number[] = [];
  for (let i = 0; i < s.length; i += 4) {
    const c0 = idx(s[i]);
    const c1 = idx(s[i + 1]);
    out.push((c0 << 2) | (c1 >> 4));
    if (i + 2 < s.length) {
      const c2 = idx(s[i + 2]);
      out.push(((c1 & 15) << 4) | (c2 >> 2));
      if (i + 3 < s.length) {
        const c3 = idx(s[i + 3]);
        out.push(((c2 & 3) << 6) | c3);
      }
    }
  }
  return new Uint8Array(out);
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  void writer.write(bytes as unknown as ArrayBuffer & Uint8Array);
  void writer.close();
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value as Uint8Array);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

const hasCompression = typeof CompressionStream !== 'undefined';

/** Encode arbitrary JSON-able state to a compact URL-safe string. */
export async function encodeState(state: unknown): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(state));
  if (hasCompression) {
    const compressed = await pipe(json, new CompressionStream('deflate-raw'));
    return 'c' + bytesToBase64url(compressed);
  }
  return 'p' + bytesToBase64url(json);
}

/** Decode a string produced by encodeState. Throws on malformed input. */
export async function decodeState<T = unknown>(encoded: string): Promise<T> {
  const kind = encoded[0];
  const bytes = base64urlToBytes(encoded.slice(1));
  let json: Uint8Array;
  if (kind === 'c') {
    if (!hasCompression) throw new Error('DecompressionStream unavailable');
    json = await pipe(bytes, new DecompressionStream('deflate-raw'));
  } else if (kind === 'p') {
    json = bytes;
  } else {
    throw new Error('unknown encoding');
  }
  return JSON.parse(new TextDecoder().decode(json)) as T;
}
