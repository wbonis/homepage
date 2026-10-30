// Request handling of the contact form, independent of the HTTP server so it can be unit-tested.
// Ported from truenas-deutschland (src/lib/contact-form/handler.ts); bonis.de answers JSON only,
// since both forms post with fetch from the desktop app.
//
// POST order: same origin -> config -> client IP -> rate limit -> size and type -> honeypot ->
// fields -> ALTCHA -> global mail limit -> send. GET (challenge): config -> client IP -> limit.
// The answer is JSON { success, error?, fields? }.
// Unit tests: server/test/contact-handler.test.ts.
import type { SendMailOptions } from 'nodemailer';
import { checkAltcha, createReplayStore, newChallenge } from './altcha.ts';
import { clientIp, ipHeaderShape, rateKey } from './client-ip.ts';
import { loadChallengeConfig, loadConfig, type ContactConfig, type NetConfig } from './config.ts';
import { FIELD, honeypotFilled, validateContact, type FieldName } from './fields.ts';
import { consoleLogger, type Logger } from './log.ts';
import { composeMail, createTransport } from './mail.ts';
import { createRateLimiter, type RateLimiter } from './rate-limit.ts';

/** Largest accepted request body (the form is a few KB). */
export const MAX_BODY_BYTES = 32 * 1024;

/** Error codes in the JSON answer; src/helpers/contact.ts maps them to texts. */
export type ErrorCode = 'input' | 'altcha' | 'too-many' | 'too-large' | 'server';

type Env = Record<string, string | undefined>;
export type SendMail = (config: ContactConfig, message: SendMailOptions) => Promise<void>;

export interface HandlerOptions {
	/** Read on every request, so changed Plesk variables apply after a restart without a build */
	env: () => Env;
	/** Started with --dev (dev defaults for missing variables) */
	dev: boolean;
	send?: SendMail;
	log?: Logger;
	now?: () => Date;
}

const NO_STORE = { 'cache-control': 'no-store' };

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8', ...NO_STORE, ...headers },
	});
}

/**
 * False for a form posted from another site. Browsers send Sec-Fetch-Site; older ones only
 * Origin, which must name the host the request was sent to (Host header, kept by the proxy;
 * the protocol is not compared, TLS ends at nginx). No header at all: not a browser, allowed.
 * No host list: staging.bonis.de, www.bonis.de and bonis.de all pass on their own host.
 */
export function sameOrigin(headers: Headers): boolean {
	const site = headers.get('sec-fetch-site');
	if (site) return site === 'same-origin' || site === 'none';
	const origin = headers.get('origin');
	if (!origin) return true;
	try {
		return new URL(origin).host === headers.get('host');
	} catch {
		return false;
	}
}

/** Origin for the mail text (staging or live), from the Host header; only a plain host name. */
export function siteOf(headers: Headers): string {
	const host = headers.get('host') ?? '';
	return /^[a-z0-9.-]+(:\d{1,5})?$/i.test(host) ? `https://${host.toLowerCase()}` : 'unknown';
}

const isFormType = (type: string | null) =>
	!!type && /^(application\/x-www-form-urlencoded|multipart\/form-data)\b/i.test(type.trim());

function defaultSend(log: Logger): SendMail {
	const transports = new Map<string, ReturnType<typeof createTransport>>();
	return async (config, message) => {
		const id = JSON.stringify(config.smtp) + config.transport;
		if (!transports.has(id)) transports.set(id, createTransport(config));
		const info = await transports.get(id)!.sendMail(message);
		// json transport (dev mode only, refused in production): show what would be sent
		if (config.transport === 'json')
			log.info('mail not sent (MAIL_TRANSPORT=json)', { message: info.message });
	};
}

export function createContactHandler(options: HandlerOptions) {
	const { env, dev, log = consoleLogger, now = () => new Date() } = options;
	const send = options.send ?? defaultSend(log);
	const replay = createReplayStore();
	const limiters = new Map<string, RateLimiter>();
	let warnedDev = false;
	let loggedShape = false;
	let loggedNoIp = false;

	/** One limiter per purpose and settings (settings may change between restarts only). */
	const limiter = (name: string, { max, windowMs }: { max: number; windowMs: number }) => {
		const id = `${name}:${max}/${windowMs}`;
		if (!limiters.has(id)) limiters.set(id, createRateLimiter({ max, windowMs }));
		return limiters.get(id)!;
	};

	/**
	 * Client IP from the configured source, or null (then the request is refused). The first
	 * request logs which address headers arrive, without values (debug aid for the proxy chain).
	 */
	function ipOf(
		request: Request,
		socketAddress: string | undefined,
		net: NetConfig,
	): string | null {
		if (!loggedShape) {
			loggedShape = true;
			log.info('client address headers (first request)', {
				source: net.ipSource,
				...ipHeaderShape(request.headers, socketAddress),
			});
		}
		const ip = clientIp(request.headers, socketAddress, net.ipSource, net.trustedProxies);
		if (!ip && !loggedNoIp) {
			loggedNoIp = true;
			log.error('no client IP, requests refused; check CLIENT_IP_HEADER', { source: net.ipSource });
		}
		return ip;
	}

	function warnDevDefaults(names: string[]) {
		if (warnedDev || names.length === 0) return;
		warnedDev = true;
		log.warn('dev defaults in use, not for production', { variables: names.join(',') });
	}

	const fail = (
		code: ErrorCode,
		status: number,
		extra: { fields?: FieldName[]; headers?: Record<string, string> } = {},
	) =>
		json(
			status,
			{ success: false, error: code, ...(extra.fields ? { fields: extra.fields } : {}) },
			extra.headers,
		);
	const done = () => json(200, { success: true });

	async function post(request: Request, socketAddress?: string): Promise<Response> {
		if (!sameOrigin(request.headers)) {
			log.warn('cross-site post rejected');
			return new Response('Cross-site form submissions are forbidden\n', {
				status: 403,
				headers: NO_STORE,
			});
		}

		const loaded = loadConfig(env(), dev);
		if (!loaded.ok) {
			log.error('configuration invalid, no mail sent', { problems: loaded.errors.join('; ') });
			return fail('server', 503);
		}
		const { config } = loaded;
		warnDevDefaults(loaded.devDefaults);

		const ip = ipOf(request, socketAddress, config);
		if (!ip) return fail('server', 503);
		const limit = limiter('post', config.rateLimit).hit(rateKey(ip));
		if (!limit.allowed) {
			log.warn('rate limit reached');
			return fail('too-many', 429, { headers: { 'retry-after': String(limit.retryAfterSeconds) } });
		}

		const length = Number(request.headers.get('content-length') ?? 0);
		if (length > MAX_BODY_BYTES) return fail('too-large', 413);
		if (!isFormType(request.headers.get('content-type'))) return fail('input', 415);
		let body: FormData;
		try {
			body = await request.formData();
		} catch {
			return fail('input', 400);
		}

		if (honeypotFilled(body)) {
			log.info('honeypot filled, dropped');
			return done();
		}
		const valid = validateContact(body);
		if (!valid.ok) return fail('input', 400, { fields: valid.fields });

		const altchaField = body.get(FIELD.altcha);
		const altcha = await checkAltcha(
			typeof altchaField === 'string' ? altchaField : null,
			config.altchaKey,
			replay,
		);
		if (!altcha.ok) {
			log.info('altcha rejected', { reason: altcha.reason });
			return fail('altcha', 400);
		}

		if (!limiter('mail', config.mailLimit).hit('all').allowed) {
			log.warn('global mail limit reached', { perHour: config.mailLimit.max });
			return fail('too-many', 429, { headers: { 'retry-after': '600' } });
		}

		const message = composeMail(config, valid.data, {
			site: siteOf(request.headers),
			receivedAt: now(),
		});
		try {
			await send(config, message);
		} catch (err) {
			const e = err as { code?: string; responseCode?: number };
			// code ETLS: the relay does not offer STARTTLS (required unless it is on loopback)
			log.error('sending failed', { code: e.code, responseCode: e.responseCode });
			return fail('server', 502);
		}
		log.info('mail sent', { transport: config.transport });
		return done();
	}

	async function challenge(request: Request, socketAddress?: string): Promise<Response> {
		const loaded = loadChallengeConfig(env(), dev);
		if (!loaded.ok) {
			log.error('configuration invalid, no challenge', { problems: loaded.errors.join('; ') });
			return fail('server', 503);
		}
		const ip = ipOf(request, socketAddress, loaded.net);
		if (!ip) return fail('server', 503);
		const limit = limiter('challenge', loaded.net.challengeLimit).hit(rateKey(ip));
		if (!limit.allowed) {
			log.warn('challenge limit reached');
			return fail('too-many', 429, { headers: { 'retry-after': String(limit.retryAfterSeconds) } });
		}
		return json(200, await newChallenge(loaded.key));
	}

	return { post, challenge };
}
