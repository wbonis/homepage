// Client IP for the rate limits. Plesk chain: client -> nginx -> Apache (mod_remoteip) ->
// Passenger -> Node. nginx always overwrites X-Real-IP with the address it saw, so that is the
// default source. X-Forwarded-For may contain entries the client sent and may be rewritten by
// mod_remoteip; it is only used when configured (right-most hop, n = TRUSTED_PROXIES).
// No usable address -> null: the caller rejects the request instead of sharing one bucket.
// Unit tests: server/test/contact-form.test.ts.
import { isIP } from 'node:net';

/** CLIENT_IP_HEADER values */
export const IP_SOURCES = ['x-real-ip', 'x-forwarded-for', 'socket'] as const;
export type IpSource = (typeof IP_SOURCES)[number];

export function clientIp(
	headers: Headers,
	socketAddress: string | undefined,
	source: IpSource,
	trustedProxies = 1,
): string | null {
	const valid = (v: string | null | undefined) => (v && isIP(v.trim()) ? v.trim() : null);
	if (source === 'socket') return valid(socketAddress);
	if (source === 'x-real-ip') return valid(headers.get('x-real-ip'));
	const hops = (headers.get('x-forwarded-for') ?? '').split(',').map((h) => h.trim());
	return trustedProxies > 0 ? valid(hops[hops.length - trustedProxies]) : null;
}

/** Rate limit key: IPv4 as is, IPv6 by its /64 prefix (one host usually owns a whole /64). */
export function rateKey(ip: string): string {
	if (isIP(ip) !== 6) return ip;
	const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
	if (mapped) return mapped[1];
	const [head, tail = ''] = ip.toLowerCase().split('::');
	const left = head ? head.split(':') : [];
	const right = tail ? tail.split(':') : [];
	const groups = ip.includes('::')
		? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right]
		: left;
	return `${groups
		.slice(0, 4)
		.map((g) => g.replace(/^0+(?=.)/, ''))
		.join(':')}::/64`;
}

/**
 * Which address headers arrive, without their values (debug aid for the proxy setup, logged
 * once per process): presence, whether the value is an IP, number of X-Forwarded-For hops.
 */
export function ipHeaderShape(headers: Headers, socketAddress: string | undefined) {
	const real = headers.get('x-real-ip');
	const fwd = headers.get('x-forwarded-for');
	return {
		xRealIp: real === null ? 'absent' : isIP(real.trim()) ? 'ip' : 'not-an-ip',
		xForwardedForHops: fwd === null ? 0 : fwd.split(',').length,
		socket: socketAddress ? (isIP(socketAddress) ? 'ip' : 'other') : 'absent',
	};
}
