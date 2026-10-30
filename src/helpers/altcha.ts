// ALTCHA proof of work in the browser, for the contact forms (src/helpers/contact.ts).
// Solves a challenge from GET /api/altcha (server/src/altcha.ts, altcha-lib v2) with
// crypto.subtle: PBKDF2/SHA-256, password = nonce + counter (big-endian uint32). No worker,
// no wasm, no third-party request: works under the site's CSP. Ported from truenas-deutschland
// (src/scripts/contact-form.js). Test against the server check: server/test/client-altcha.test.ts.

export interface AltchaChallenge {
	parameters: {
		algorithm: string;
		cost: number;
		keyLength: number;
		keyPrefix: string;
		nonce: string;
		salt: string;
		[key: string]: unknown;
	};
	signature: string;
}

/** Counters tried in parallel per round */
const BATCH = 8;
const MAX_COUNTER = 1 << 22;

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
	const out = new Uint8Array(hex.length / 2);
	for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
	return out;
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function password(nonce: Uint8Array, counter: number): Uint8Array<ArrayBuffer> {
	const buf = new Uint8Array(nonce.length + 4);
	buf.set(nonce, 0);
	new DataView(buf.buffer).setUint32(nonce.length, counter, false);
	return buf;
}

async function derive(
	p: AltchaChallenge['parameters'],
	salt: Uint8Array<ArrayBuffer>,
	nonce: Uint8Array,
	counter: number,
): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		password(nonce, counter),
		{ name: 'PBKDF2' },
		false,
		['deriveBits'],
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt, iterations: p.cost, hash: 'SHA-256' },
		key,
		p.keyLength * 8,
	);
	return bytesToHex(new Uint8Array(bits));
}

/** The payload for the form field "altcha": base64(JSON { challenge, solution }). */
export async function solveAltcha(challenge: AltchaChallenge): Promise<string> {
	const p = challenge.parameters;
	if (p.algorithm !== 'PBKDF2/SHA-256') throw new Error(`unsupported algorithm ${p.algorithm}`);
	const salt = hexToBytes(p.salt);
	const nonce = hexToBytes(p.nonce);
	const prefix = p.keyPrefix.toLowerCase();
	for (let start = 0; start < MAX_COUNTER; start += BATCH) {
		const counters = Array.from({ length: BATCH }, (_, i) => start + i);
		const keys = await Promise.all(counters.map((c) => derive(p, salt, nonce, c)));
		const hit = keys.findIndex((k) => k.startsWith(prefix));
		if (hit >= 0) {
			const solution = { counter: start + hit, derivedKey: keys[hit] };
			return btoa(JSON.stringify({ challenge, solution }));
		}
	}
	throw new Error('challenge not solved');
}
