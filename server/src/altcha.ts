// ALTCHA proof of work, self-hosted (altcha-lib, no third-party calls).
// GET /api/altcha returns a signed challenge; src/helpers/altcha.ts solves it in the browser
// (PBKDF2/SHA-256 via crypto.subtle) and posts base64(JSON {challenge, solution}) in the field
// "altcha". The server checks signature, expiry and solution, then marks the challenge used.
// Replay store: in memory, resets on restart (a challenge then stays usable until it expires).
// When it is full of unexpired entries, new solutions are refused (not evicted: that would
// make evicted solutions reusable).
// Unit tests: server/test/contact-form.test.ts.
import { createHmac, randomInt } from 'node:crypto';
import { createChallenge, verifySolution } from 'altcha-lib';
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2';
import { z } from 'zod';

export const ALTCHA_ALGORITHM = 'PBKDF2/SHA-256';
/** PBKDF2 iterations per attempt */
export const ALTCHA_COST = 1000;
/** The solution is a random counter in this range: about 0.5–1 s of work in a desktop browser */
export const ALTCHA_COUNTER = { min: 500, max: 2500 } as const;
export const ALTCHA_TTL_SECONDS = 600;
const MAX_PAYLOAD = 4096;

/** Second secret for the key signature, derived so that one variable is enough. */
function keySignatureSecret(key: string): string {
	return createHmac('sha256', key).update('altcha-key-signature').digest('hex');
}

export interface ChallengeOptions {
	/** Seconds since the epoch; default now + ALTCHA_TTL_SECONDS */
	expiresAt?: number;
	counter?: number;
}

export async function newChallenge(key: string, options: ChallengeOptions = {}) {
	return createChallenge({
		algorithm: ALTCHA_ALGORITHM,
		cost: ALTCHA_COST,
		counter: options.counter ?? randomInt(ALTCHA_COUNTER.min, ALTCHA_COUNTER.max + 1),
		deriveKey,
		expiresAt: options.expiresAt ?? Math.floor(Date.now() / 1000) + ALTCHA_TTL_SECONDS,
		hmacSignatureSecret: key,
		hmacKeySignatureSecret: keySignatureSecret(key),
	});
}

const hex = z.string().regex(/^[0-9a-f]+$/);
const payloadSchema = z
	.object({
		challenge: z
			.object({
				parameters: z
					.object({
						algorithm: z.literal(ALTCHA_ALGORITHM),
						expiresAt: z.number(),
						keySignature: hex,
					})
					.catchall(z.unknown()),
				signature: hex,
			})
			.strict(),
		solution: z
			.object({ counter: z.number().int().nonnegative(), derivedKey: hex })
			.catchall(z.unknown()),
	})
	.strict();

export type AltchaPayload = z.infer<typeof payloadSchema>;

export function decodePayload(raw: string | null): AltchaPayload | null {
	if (!raw || raw.length > MAX_PAYLOAD) return null;
	try {
		const parsed = payloadSchema.safeParse(JSON.parse(Buffer.from(raw, 'base64').toString('utf8')));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

/** Remembers used challenges until they expire. */
export interface ReplayStore {
	/** "replayed" if the id was used before (and has not expired), "full" if no room is left. */
	use(id: string, expiresAtMs: number): 'ok' | 'replayed' | 'full';
}

export function createReplayStore({ maxEntries = 50_000, now = Date.now } = {}): ReplayStore {
	const used = new Map<string, number>();
	const prune = () => {
		const t = now();
		for (const [id, expires] of used) if (expires <= t) used.delete(id);
	};
	return {
		use(id, expiresAtMs) {
			if ((used.get(id) ?? 0) > now()) return 'replayed';
			if (used.size >= maxEntries) prune();
			if (used.size >= maxEntries) return 'full';
			used.set(id, expiresAtMs);
			return 'ok';
		},
	};
}

export type AltchaCheck =
	| { ok: true }
	| { ok: false; reason: 'missing' | 'malformed' | 'expired' | 'invalid' | 'replayed' | 'full' };

export async function checkAltcha(
	raw: string | null,
	key: string,
	replay: ReplayStore,
): Promise<AltchaCheck> {
	if (!raw) return { ok: false, reason: 'missing' };
	const payload = decodePayload(raw);
	if (!payload) return { ok: false, reason: 'malformed' };
	const result = await verifySolution({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- shape checked by payloadSchema
		challenge: payload.challenge as any,
		solution: payload.solution,
		deriveKey,
		hmacSignatureSecret: key,
		hmacKeySignatureSecret: keySignatureSecret(key),
	});
	if (result.expired) return { ok: false, reason: 'expired' };
	if (!result.verified) return { ok: false, reason: 'invalid' };
	const { signature, parameters } = payload.challenge;
	const used = replay.use(signature, parameters.expiresAt * 1000);
	return used === 'ok' ? { ok: true } : { ok: false, reason: used };
}
