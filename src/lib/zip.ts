/**
 * Minimal ZIP writer (store method, no compression). Pure, dependency-free.
 * Enough for template archives: UTF-8 names, correct CRC-32, deterministic
 * timestamps. Not a general-purpose archiver (no zip64, no streaming).
 */

export interface ZipEntry {
  /** Forward-slash path inside the archive, e.g. "Packages/com.x.y/package.json". */
  name: string;
  data: string | Uint8Array;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

class ByteWriter {
  private chunks: Uint8Array[] = [];
  length = 0;

  u16(v: number) {
    this.bytes(new Uint8Array([v & 0xff, (v >> 8) & 0xff]));
  }
  u32(v: number) {
    this.bytes(new Uint8Array([v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >>> 24) & 0xff]));
  }
  bytes(b: Uint8Array) {
    this.chunks.push(b);
    this.length += b.length;
  }
  concat(): Uint8Array {
    const out = new Uint8Array(this.length);
    let off = 0;
    for (const c of this.chunks) {
      out.set(c, off);
      off += c.length;
    }
    return out;
  }
}

/** Build a ZIP archive. The default date keeps output deterministic. */
export function createZip(entries: ZipEntry[], date = new Date(2026, 0, 1, 12, 0, 0)): Uint8Array {
  const encoder = new TextEncoder();
  const { time, date: dosDate } = dosDateTime(date);
  const w = new ByteWriter();
  const central: { name: Uint8Array; crc: number; size: number; offset: number }[] = [];

  for (const entry of entries) {
    const name = encoder.encode(entry.name.replace(/\\/g, '/'));
    const data = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const crc = crc32(data);
    central.push({ name, crc, size: data.length, offset: w.length });

    w.u32(0x04034b50); // local file header
    w.u16(20); // version needed
    w.u16(0x0800); // flags: UTF-8 names
    w.u16(0); // method: store
    w.u16(time);
    w.u16(dosDate);
    w.u32(crc);
    w.u32(data.length); // compressed size (= raw, store)
    w.u32(data.length);
    w.u16(name.length);
    w.u16(0); // extra length
    w.bytes(name);
    w.bytes(data);
  }

  const centralStart = w.length;
  for (const e of central) {
    w.u32(0x02014b50); // central directory header
    w.u16(20); // made by
    w.u16(20); // version needed
    w.u16(0x0800);
    w.u16(0);
    w.u16(time);
    w.u16(dosDate);
    w.u32(e.crc);
    w.u32(e.size);
    w.u32(e.size);
    w.u16(e.name.length);
    w.u16(0); // extra
    w.u16(0); // comment
    w.u16(0); // disk
    w.u16(0); // internal attrs
    w.u32(0); // external attrs
    w.u32(e.offset);
    w.bytes(e.name);
  }
  const centralSize = w.length - centralStart;

  w.u32(0x06054b50); // end of central directory
  w.u16(0); // disk
  w.u16(0); // start disk
  w.u16(central.length);
  w.u16(central.length);
  w.u32(centralSize);
  w.u32(centralStart);
  w.u16(0); // comment length

  return w.concat();
}
