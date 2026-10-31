/**
 * A minimal ZIP writer (stored, no compression) for the downloads hub (task M6-06), so the
 * script bundle is built from scripts/gee/ at build time without a new dependency.
 */
const CRC_TABLE = (() => {
	const t = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		t[n] = c >>> 0;
	}
	return t;
})();

export function crc32(data: Uint8Array): number {
	let c = 0xffffffff;
	for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
	name: string;
	data: Uint8Array;
}

/** Build a ZIP archive. Dates are fixed (1 January 2026) so the output is the same on every build. */
export function zip(entries: ZipEntry[]): Uint8Array {
	const enc = new TextEncoder();
	const DOS_TIME = 0;
	const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
	const local: Uint8Array[] = [];
	const central: Uint8Array[] = [];
	let offset = 0;
	for (const e of entries) {
		const name = enc.encode(e.name);
		const crc = crc32(e.data);
		const h = new DataView(new ArrayBuffer(30));
		h.setUint32(0, 0x04034b50, true);
		h.setUint16(4, 20, true); // version needed
		h.setUint16(6, 0x0800, true); // UTF-8 names
		h.setUint16(8, 0, true); // stored
		h.setUint16(10, DOS_TIME, true);
		h.setUint16(12, DOS_DATE, true);
		h.setUint32(14, crc, true);
		h.setUint32(18, e.data.length, true);
		h.setUint32(22, e.data.length, true);
		h.setUint16(26, name.length, true);
		h.setUint16(28, 0, true);
		local.push(new Uint8Array(h.buffer), name, e.data);

		const c = new DataView(new ArrayBuffer(46));
		c.setUint32(0, 0x02014b50, true);
		c.setUint16(4, 20, true); // version made by
		c.setUint16(6, 20, true);
		c.setUint16(8, 0x0800, true);
		c.setUint16(10, 0, true);
		c.setUint16(12, DOS_TIME, true);
		c.setUint16(14, DOS_DATE, true);
		c.setUint32(16, crc, true);
		c.setUint32(20, e.data.length, true);
		c.setUint32(24, e.data.length, true);
		c.setUint16(28, name.length, true);
		c.setUint32(42, offset, true);
		central.push(new Uint8Array(c.buffer), name);
		offset += 30 + name.length + e.data.length;
	}
	const centralSize = central.reduce((s, b) => s + b.length, 0);
	const end = new DataView(new ArrayBuffer(22));
	end.setUint32(0, 0x06054b50, true);
	end.setUint16(8, entries.length, true);
	end.setUint16(10, entries.length, true);
	end.setUint32(12, centralSize, true);
	end.setUint32(16, offset, true);
	const parts = [...local, ...central, new Uint8Array(end.buffer)];
	const out = new Uint8Array(parts.reduce((s, b) => s + b.length, 0));
	let p = 0;
	for (const b of parts) {
		out.set(b, p);
		p += b.length;
	}
	return out;
}
