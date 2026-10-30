// Unit tests for server/src/handler.ts (POST /api/contact, GET /api/altcha) with a fake mail
// sender. Ported from truenas-deutschland; bonis.de answers JSON only (the forms use fetch).
// Run: npm test (in server/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solveChallenge } from 'altcha-lib';
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2';
import type { SendMailOptions } from 'nodemailer';
import {
	createContactHandler,
	MAX_BODY_BYTES,
	sameOrigin,
	siteOf,
	type SendMail,
} from '../src/handler.ts';
import type { LogFields, Logger } from '../src/log.ts';

const KEY = 'k'.repeat(40);
const ENV: Record<string, string> = {
	SMTP_HOST: 'relay.example.org',
	SMTP_PORT: '2525',
	MAIL_FROM_NAME: 'Website',
	MAIL_FROM_ADDRESS: 'website@example.org',
	MAIL_TO_ADDRESS: 'office@example.org',
	ALTCHA_HMAC_KEY: KEY,
	RATE_LIMIT_MAX: '3',
};

type Handler = ReturnType<typeof createContactHandler>;

function setup({ env = ENV, send }: { env?: Record<string, string>; send?: SendMail } = {}) {
	const sent: SendMailOptions[] = [];
	const logs: { l: string; event: string; fields?: LogFields }[] = [];
	const logAt =
		(l: string) =>
		(event: string, fields?: LogFields): void =>
			void logs.push({ l, event, fields });
	const log: Logger = { info: logAt('info'), warn: logAt('warn'), error: logAt('error') };
	const handler = createContactHandler({
		env: () => env,
		dev: false,
		send: send ?? (async (_config, message) => void sent.push(message)),
		log,
	});
	return { handler, sent, logs };
}

const getChallenge = (handler: Handler, ip = '192.0.2.1') =>
	handler.challenge(new Request('http://localhost/api/altcha', { headers: { 'x-real-ip': ip } }));

async function altchaFor(handler: Handler): Promise<string> {
	const challenge = await (await getChallenge(handler)).json();
	const solution = await solveChallenge({ challenge, deriveKey });
	assert.ok(solution, 'challenge not solved');
	return Buffer.from(
		JSON.stringify({
			challenge,
			solution: { counter: solution.counter, derivedKey: solution.derivedKey },
		}),
	).toString('base64');
}

const fields = {
	name: 'Erika Mustermann',
	email: 'erika@example.org',
	subject: 'Jobangebot',
	message: 'Bitte um Rückruf, danke.',
	website: '',
};

function request(
	body: Record<string, string>,
	{ ip = '203.0.113.1', headers = {} }: { ip?: string; headers?: Record<string, string> } = {},
): Request {
	return new Request('https://staging.bonis.de/api/contact', {
		method: 'POST',
		body: new URLSearchParams(body),
		headers: { 'x-real-ip': ip, host: 'staging.bonis.de', ...headers },
	});
}

test('success: 200 { success: true }, one mail with the site in the text', async () => {
	const { handler, sent } = setup();
	const res = await handler.post(request({ ...fields, altcha: await altchaFor(handler) }));
	assert.equal(res.status, 200);
	assert.equal(res.headers.get('cache-control'), 'no-store');
	assert.deepEqual(await res.json(), { success: true });
	assert.equal(sent.length, 1);
	assert.equal(sent[0].subject, '[bonis.de] Jobangebot');
	assert.match(String(sent[0].text), /Website: {2}https:\/\/staging\.bonis\.de$/m);
});

test('invalid fields: 400 error input, JSON lists the fields', async () => {
	const { handler, sent } = setup();
	const res = await handler.post(request({ ...fields, email: 'x' }));
	assert.equal(res.status, 400);
	assert.deepEqual(await res.json(), { success: false, error: 'input', fields: ['email'] });
	assert.equal(sent.length, 0);
});

test('ALTCHA missing or replayed: error altcha, nothing sent', async () => {
	const { handler, sent } = setup();
	const res = await handler.post(request(fields));
	assert.deepEqual(await res.json(), { success: false, error: 'altcha' });
	const altcha = await altchaFor(handler);
	assert.equal((await handler.post(request({ ...fields, altcha }))).status, 200);
	const replay = await handler.post(request({ ...fields, altcha }, { ip: '203.0.113.2' }));
	assert.deepEqual(await replay.json(), { success: false, error: 'altcha' });
	assert.equal(sent.length, 1);
});

test('honeypot: looks like success, nothing sent', async () => {
	const { handler, sent, logs } = setup();
	const res = await handler.post(
		request({ ...fields, website: 'http://spam.test', altcha: await altchaFor(handler) }),
	);
	assert.deepEqual(await res.json(), { success: true });
	assert.equal(sent.length, 0);
	assert.ok(logs.some((l) => l.event.startsWith('honeypot')));
});

test('rate limit per client IP: 429 with Retry-After after RATE_LIMIT_MAX attempts', async () => {
	const { handler } = setup();
	for (let i = 0; i < 3; i++) await handler.post(request(fields, { ip: '198.51.100.7' }));
	const res = await handler.post(request(fields, { ip: '198.51.100.7' }));
	assert.equal(res.status, 429);
	assert.ok(Number(res.headers.get('retry-after')) > 0);
	assert.deepEqual(await res.json(), { success: false, error: 'too-many' });
	const other = await handler.post(request(fields, { ip: '198.51.100.8' }));
	assert.notEqual(other.status, 429);
});

test('too large or not a form: 413 / 415', async () => {
	const { handler } = setup();
	const big = await handler.post(
		request(fields, { headers: { 'content-length': String(MAX_BODY_BYTES + 1) } }),
	);
	assert.equal(big.status, 413);
	assert.deepEqual(await big.json(), { success: false, error: 'too-large' });
	const res = await handler.post(
		new Request('http://localhost/api/contact', {
			method: 'POST',
			body: '{}',
			headers: { 'content-type': 'application/json', 'x-real-ip': '192.0.2.9' },
		}),
	);
	assert.equal(res.status, 415);
});

test('broken config: 503, error logged without secrets, no mail', async () => {
	const { ALTCHA_HMAC_KEY, ...env } = ENV;
	const { handler, sent, logs } = setup({ env: { ...env, SMTP_PASSWORD: 'geheim' } });
	const res = await handler.post(request(fields));
	assert.equal(res.status, 503);
	assert.equal(sent.length, 0);
	const text = JSON.stringify(logs);
	assert.match(text, /ALTCHA_HMAC_KEY/);
	assert.doesNotMatch(text, /geheim/);
	assert.equal((await getChallenge(handler)).status, 503);
});

test('SMTP failure: 502 error server, logged without message content', async () => {
	const { handler, logs } = setup({
		send: async () => {
			throw Object.assign(new Error('Greeting never received from erika@example.org'), {
				code: 'ETIMEDOUT',
				command: 'CONN',
			});
		},
	});
	const res = await handler.post(request({ ...fields, altcha: await altchaFor(handler) }));
	assert.equal(res.status, 502);
	assert.deepEqual(await res.json(), { success: false, error: 'server' });
	const error = logs.find((l) => l.l === 'error');
	assert.deepEqual(error?.fields, { code: 'ETIMEDOUT', responseCode: undefined });
	assert.doesNotMatch(JSON.stringify(logs), /erika/);
});

test('challenge: signed, PBKDF2/SHA-256, expires in 10 minutes, not cached', async () => {
	const { handler } = setup();
	const res = await getChallenge(handler);
	assert.equal(res.headers.get('cache-control'), 'no-store');
	const { parameters, signature } = await res.json();
	assert.equal(parameters.algorithm, 'PBKDF2/SHA-256');
	assert.match(signature, /^[0-9a-f]{64}$/);
	const ttl = parameters.expiresAt - Date.now() / 1000;
	assert.ok(ttl > 590 && ttl <= 600, String(ttl));
});

test('log lines carry no form data', async () => {
	const { handler, logs } = setup();
	await handler.post(request({ ...fields, altcha: await altchaFor(handler) }));
	assert.doesNotMatch(JSON.stringify(logs), /Erika|erika@|Rückruf/);
});

test('same origin: Sec-Fetch-Site, else Origin host = Host header', () => {
	const h = (o: Record<string, string>) => new Headers(o);
	assert.equal(
		sameOrigin(h({ 'sec-fetch-site': 'same-origin', origin: 'https://evil.test' })),
		true,
	);
	assert.equal(sameOrigin(h({ 'sec-fetch-site': 'cross-site' })), false);
	assert.equal(sameOrigin(h({ 'sec-fetch-site': 'same-site' })), false);
	assert.equal(
		sameOrigin(h({ origin: 'https://staging.bonis.de', host: 'staging.bonis.de' })),
		true,
	);
	assert.equal(sameOrigin(h({ origin: 'https://www.bonis.de', host: 'www.bonis.de' })), true);
	assert.equal(sameOrigin(h({ origin: 'https://evil.test', host: 'www.bonis.de' })), false);
	assert.equal(sameOrigin(h({ origin: 'null', host: 'www.bonis.de' })), false);
	assert.equal(sameOrigin(h({})), true);
});

test('a cross-site post gets 403 and sends nothing', async () => {
	const { handler, sent } = setup();
	const res = await handler.post(request(fields, { headers: { 'sec-fetch-site': 'cross-site' } }));
	assert.equal(res.status, 403);
	assert.equal(sent.length, 0);
});

test('site for the mail: https + Host header, only a plain host name', () => {
	assert.equal(siteOf(new Headers({ host: 'staging.bonis.de' })), 'https://staging.bonis.de');
	assert.equal(siteOf(new Headers({ host: 'localhost:8788' })), 'https://localhost:8788');
	assert.equal(siteOf(new Headers({ host: 'evil.test/path?x=1' })), 'unknown');
	assert.equal(siteOf(new Headers({ host: 'a b' })), 'unknown');
	assert.equal(siteOf(new Headers({})), 'unknown');
});

test('no client IP: refused with 503 and one error log, not a shared bucket', async () => {
	const { handler, sent, logs } = setup();
	const noIp = () =>
		handler.post(
			new Request('http://localhost/api/contact', {
				method: 'POST',
				body: new URLSearchParams(fields),
			}),
		);
	assert.equal((await noIp()).status, 503);
	assert.equal((await noIp()).status, 503);
	assert.equal(logs.filter((l) => l.l === 'error' && l.event.startsWith('no client IP')).length, 1);
	assert.equal(sent.length, 0);
});

test('first request logs which address headers arrive, without addresses', async () => {
	const { handler, logs } = setup();
	await handler.post(request(fields, { ip: '198.51.100.77' }));
	await handler.post(request(fields, { ip: '198.51.100.78' }));
	const shape = logs.filter((l) => l.event.startsWith('client address headers'));
	assert.equal(shape.length, 1);
	assert.deepEqual(shape[0].fields, {
		source: 'x-real-ip',
		xRealIp: 'ip',
		xForwardedForHops: 0,
		socket: 'absent',
	});
	assert.doesNotMatch(JSON.stringify(logs), /198\.51/);
});

test('IPv6 addresses of one /64 share a rate limit bucket', async () => {
	const { handler } = setup();
	for (let i = 1; i <= 3; i++) await handler.post(request(fields, { ip: `2001:db8:5:6::${i}` }));
	assert.equal((await handler.post(request(fields, { ip: '2001:db8:5:6::99' }))).status, 429);
	assert.notEqual((await handler.post(request(fields, { ip: '2001:db8:5:7::1' }))).status, 429);
});

test('global mail limit: at most MAIL_LIMIT_PER_HOUR mails from all visitors', async () => {
	const { handler, sent, logs } = setup({
		env: { ...ENV, MAIL_LIMIT_PER_HOUR: '2', RATE_LIMIT_MAX: '100' },
	});
	const statuses: number[] = [];
	for (let i = 0; i < 3; i++) {
		const res = await handler.post(
			request({ ...fields, altcha: await altchaFor(handler) }, { ip: `198.51.100.${i + 20}` }),
		);
		statuses.push(res.status);
	}
	assert.deepEqual(statuses, [200, 200, 429]);
	assert.equal(sent.length, 2);
	assert.ok(logs.some((l) => l.event === 'global mail limit reached'));
});

test('challenges are rate-limited per client IP (CHALLENGE_LIMIT_MAX)', async () => {
	const { handler } = setup({ env: { ...ENV, CHALLENGE_LIMIT_MAX: '2' } });
	assert.equal((await getChallenge(handler, '192.0.2.50')).status, 200);
	assert.equal((await getChallenge(handler, '192.0.2.50')).status, 200);
	const limited = await getChallenge(handler, '192.0.2.50');
	assert.equal(limited.status, 429);
	assert.ok(Number(limited.headers.get('retry-after')) > 0);
	assert.equal((await getChallenge(handler, '192.0.2.51')).status, 200);
	const noIp = await handler.challenge(new Request('http://localhost/api/altcha'));
	assert.equal(noIp.status, 503);
});
