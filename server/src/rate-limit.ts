// In-memory rate limit per client IP (sliding window). State lives in the Node process: it
// resets on restart and is not shared between processes (Plesk/Passenger runs one).
// Unit tests: server/test/contact-form.test.ts.

export interface RateLimiter {
	/** Counts one attempt for key. allowed = false once max attempts fall in the window. */
	hit(key: string): { allowed: boolean; retryAfterSeconds: number };
}

export interface RateLimitOptions {
	max: number;
	windowMs: number;
	/** Most keys kept; the oldest is dropped beyond that (memory bound) */
	maxKeys?: number;
	now?: () => number;
}

export function createRateLimiter({
	max,
	windowMs,
	maxKeys = 10_000,
	now = Date.now,
}: RateLimitOptions): RateLimiter {
	const hits = new Map<string, readonly number[]>();
	return {
		hit(key) {
			const t = now();
			const recent = (hits.get(key) ?? []).filter((at) => at > t - windowMs);
			hits.delete(key);
			if (recent.length >= max) {
				hits.set(key, recent);
				return { allowed: false, retryAfterSeconds: Math.ceil((recent[0] + windowMs - t) / 1000) };
			}
			hits.set(key, [...recent, t]);
			if (hits.size > maxKeys) hits.delete(hits.keys().next().value!);
			return { allowed: true, retryAfterSeconds: 0 };
		},
	};
}
