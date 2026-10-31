import { describe, expect, it } from 'vitest';
import { crc32, zip } from '../src/lib/zip';

describe('zip writer (downloads hub)', () => {
	it('computes the standard CRC-32', () => {
		expect(crc32(new TextEncoder().encode('The quick brown fox jumps over the lazy dog'))).toBe(0x414fa339);
		expect(crc32(new Uint8Array())).toBe(0);
	});

	it('writes local headers, the central directory and the end record', () => {
		const data = new TextEncoder().encode('print("hello Bhutan")');
		const out = zip([{ name: 'a/b.js', data }]);
		const v = new DataView(out.buffer);
		expect(v.getUint32(0, true)).toBe(0x04034b50);
		expect(out.length).toBe(30 + 6 + data.length + 46 + 6 + 22);
		const end = out.length - 22;
		expect(v.getUint32(end, true)).toBe(0x06054b50);
		expect(v.getUint16(end + 10, true)).toBe(1);
		expect(v.getUint32(end + 16, true)).toBe(30 + 6 + data.length);
		expect(v.getUint32(30 + 6 + data.length, true)).toBe(0x02014b50);
	});
});
