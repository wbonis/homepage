// Unit tests for the contact form parts in server/src/ (fields, config, rate limit, client IP,
// ALTCHA, mail). Ported from truenas-deutschland. Run: npm test (in server/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solveChallenge } from 'altcha-lib';
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { checkAltcha, createReplayStore, decodePayload, newChallenge } from '../src/altcha.ts';
import { clientIp, ipHeaderShape, rateKey } from '../src/client-ip.ts';
import { DEV_ALTCHA_KEY, loadChallengeConfig, loadConfig } from '../src/config.ts';
import { LIMITS, honeypotFilled, validateContact } from '../src/fields.ts';
import { composeMail, createTransport, isLoopback, mailText } from '../src/mail.ts';
import { createRateLimiter } from '../src/rate-limit.ts';

const KEY = 'k'.repeat(40);

/** The success branch of a result union; fails the test otherwise. */
function ok<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
	assert.ok(result.ok, JSON.stringify(result));
	return result as Extract<T, { ok: true }>;
}

/** The error branch of a result union; fails the test otherwise. */
function notOk<T extends { ok: boolean }>(result: T): Extract<T, { ok: false }> {
	assert.ok(!result.ok, JSON.stringify(result));
	return result as Extract<T, { ok: false }>;
}

function form(values: Record<string, string>): FormData {
	const f = new FormData();
	for (const [k, v] of Object.entries(values)) f.append(k, v);
	return f;
}

const valid = {
	name: 'Erika Mustermann',
	email: 'erika@example.org',
	subject: 'Jobangebot',
	message: 'Bitte rufen Sie mich an.\r\nDanke!',
	website: '',
};

// --- fields -------------------------------------------------------------------------------

test('a complete form is valid; CRLF in the message becomes LF; values are trimmed', () => {
	const r = ok(validateContact(form({ ...valid, name: '  Erika Mustermann ' })));
	assert.equal(r.data.message, 'Bitte rufen Sie mich an.\nDanke!');
	assert.equal(r.data.name, 'Erika Mustermann');
	assert.equal(r.data.subject, 'Jobangebot');
});

test('required fields and e-mail syntax are checked', () => {
	const r = validateContact(
		form({ ...valid, name: '', email: 'kein-at', subject: ' ', message: '' }),
	);
	assert.deepEqual(r, { ok: false, fields: ['name', 'email', 'subject', 'message'] });
	const missing = notOk(validateContact(form({ name: 'Erika' })));
	assert.deepEqual(missing.fields.sort(), ['email', 'message', 'subject']);
});

test('CR/LF in single-line fields is rejected (header injection)', () => {
	for (const field of ['name', 'email', 'subject']) {
		const value = field === 'email' ? 'a@b.de\r\nBcc: x@evil.test' : 'Erika\nBcc: x@evil.test';
		const r = validateContact(form({ ...valid, [field]: value }));
		assert.deepEqual(r, { ok: false, fields: [field] }, field);
	}
	assert.equal(validateContact(form({ ...valid, message: 'a\u0000bcdefghijk' })).ok, false);
});

test('C1 controls, zero-width and bidi characters are rejected, umlauts and line breaks are fine', () => {
	for (const ch of ['\u0085', '\u009b', '​', '‏', '‮', '⁦', '⁩']) {
		assert.deepEqual(
			notOk(validateContact(form({ ...valid, name: `Eri${ch}ka` }))).fields,
			['name'],
			JSON.stringify(ch),
		);
		assert.deepEqual(
			notOk(validateContact(form({ ...valid, message: `Hallo Welt${ch}, bitte melden` }))).fields,
			['message'],
			JSON.stringify(ch),
		);
	}
	assert.equal(
		validateContact(form({ ...valid, name: 'Jürgen Weiß-Öztürk', message: 'Grüße\n\tund Dank!' }))
			.ok,
		true,
	);
});

test('length limits', () => {
	const long = 'x'.repeat(LIMITS.message.max + 1);
	assert.deepEqual(notOk(validateContact(form({ ...valid, message: long }))).fields, ['message']);
	assert.deepEqual(notOk(validateContact(form({ ...valid, name: 'x'.repeat(101) }))).fields, [
		'name',
	]);
	assert.deepEqual(notOk(validateContact(form({ ...valid, subject: 'x'.repeat(201) }))).fields, [
		'subject',
	]);
	assert.deepEqual(
		notOk(validateContact(form({ ...valid, email: `${'a'.repeat(250)}@b.de` }))).fields,
		['email'],
	);
});

test('a field sent twice or as a file is invalid', () => {
	const f = form(valid);
	f.append('email', 'second@example.org');
	assert.deepEqual(validateContact(f), { ok: false, fields: [] });
	const g = form(valid);
	g.set('name', new Blob(['x']), 'x.txt');
	assert.equal(validateContact(g).ok, false);
});

test('honeypot', () => {
	assert.equal(honeypotFilled(form(valid)), false);
	assert.equal(honeypotFilled(form({ name: 'x' })), false);
	assert.equal(honeypotFilled(form({ ...valid, website: 'http://spam.test' })), true);
});

// --- config -------------------------------------------------------------------------------

const ENV = {
	SMTP_HOST: 'relay.example.org',
	SMTP_PORT: '2525',
	MAIL_FROM_NAME: 'bonis.de Website',
	MAIL_FROM_ADDRESS: 'website@example.org',
	MAIL_TO_ADDRESS: 'office@example.org',
	ALTCHA_HMAC_KEY: KEY,
};

test('config: SMTP without auth; empty user/password count as unset', () => {
	const r = ok(loadConfig({ ...ENV, SMTP_USER: '', SMTP_PASSWORD: '' }));
	assert.deepEqual(r.config.smtp, {
		host: 'relay.example.org',
		port: 2525,
		auth: undefined,
		tlsServername: undefined,
	});
	assert.deepEqual(r.config.rateLimit, { max: 5, windowMs: 600_000 });
	assert.deepEqual(r.config.challengeLimit, { max: 30, windowMs: 600_000 });
	assert.deepEqual(r.config.mailLimit, { max: 30, windowMs: 3_600_000 });
	assert.equal(r.config.ipSource, 'x-real-ip');
});

test('config: CLIENT_IP_HEADER accepts x-real-ip, x-forwarded-for, socket only', () => {
	assert.equal(
		ok(loadConfig({ ...ENV, CLIENT_IP_HEADER: 'X-Forwarded-For' })).config.ipSource,
		'x-forwarded-for',
	);
	assert.equal(ok(loadConfig({ ...ENV, CLIENT_IP_HEADER: 'socket' })).config.ipSource, 'socket');
	assert.equal(loadConfig({ ...ENV, CLIENT_IP_HEADER: 'cf-connecting-ip' }).ok, false);
});

test('config: auth needs user and password', () => {
	assert.deepEqual(
		ok(loadConfig({ ...ENV, SMTP_USER: 'u', SMTP_PASSWORD: 'p' })).config.smtp.auth,
		{
			user: 'u',
			pass: 'p',
		},
	);
	assert.equal(loadConfig({ ...ENV, SMTP_USER: 'u' }).ok, false);
});

test('config: errors name the variables but never echo values', () => {
	const r = notOk(
		loadConfig({ ...ENV, ALTCHA_HMAC_KEY: 'short-secret', SMTP_HOST: '', MAIL_TO_ADDRESS: 'nope' }),
	);
	const text = r.errors.join('\n');
	assert.match(text, /ALTCHA_HMAC_KEY/);
	assert.match(text, /SMTP_HOST/);
	assert.match(text, /MAIL_TO_ADDRESS/);
	assert.doesNotMatch(text, /short-secret|nope/);
});

test('config: no ALTCHA key in production, a logged dev key in dev mode', () => {
	const { ALTCHA_HMAC_KEY, ...noKey } = ENV;
	assert.equal(loadConfig(noKey).ok, false);
	assert.deepEqual(loadChallengeConfig({}), { ok: false, errors: ['ALTCHA_HMAC_KEY: missing'] });
	const devKey = ok(loadChallengeConfig({}, true));
	assert.equal(devKey.key, DEV_ALTCHA_KEY);
	assert.equal(devKey.dev, true);
	assert.equal(ok(loadChallengeConfig({ ALTCHA_HMAC_KEY: KEY })).net.challengeLimit.max, 30);
	const dev = ok(loadConfig({}, true));
	assert.equal(dev.config.transport, 'json');
	assert.ok(dev.devDefaults.includes('ALTCHA_HMAC_KEY'));
});

test('config: the json transport only in dev mode, whatever NODE_ENV says', () => {
	assert.equal(loadConfig({ ...ENV, MAIL_TRANSPORT: 'json', NODE_ENV: 'development' }).ok, false);
	assert.equal(loadConfig({ ...ENV, MAIL_TRANSPORT: 'json' }, true).ok, true);
});

test('dev mode without proxy: client IP from the socket unless CLIENT_IP_HEADER is set', () => {
	assert.equal(ok(loadChallengeConfig({}, true)).net.ipSource, 'socket');
	assert.equal(
		ok(loadChallengeConfig({ CLIENT_IP_HEADER: 'x-real-ip' }, true)).net.ipSource,
		'x-real-ip',
	);
	assert.equal(ok(loadChallengeConfig({ ALTCHA_HMAC_KEY: KEY })).net.ipSource, 'x-real-ip');
	const dev = ok(loadConfig({}, true));
	assert.equal(dev.config.ipSource, 'socket');
	assert.ok(dev.devDefaults.includes('CLIENT_IP_HEADER'));
});

// --- rate limit, client IP ----------------------------------------------------------------

test('rate limit: max hits per window and key, then free again', () => {
	let t = 0;
	const limiter = createRateLimiter({ max: 2, windowMs: 1000, now: () => t });
	assert.equal(limiter.hit('a').allowed, true);
	assert.equal(limiter.hit('a').allowed, true);
	assert.deepEqual(limiter.hit('a'), { allowed: false, retryAfterSeconds: 1 });
	assert.equal(limiter.hit('b').allowed, true);
	t = 1001;
	assert.equal(limiter.hit('a').allowed, true);
});

test('rate limit: the number of keys is bounded', () => {
	const limiter = createRateLimiter({ max: 1, windowMs: 1000, maxKeys: 2, now: () => 0 });
	limiter.hit('a');
	limiter.hit('b');
	limiter.hit('c');
	assert.equal(limiter.hit('a').allowed, true, 'oldest key was dropped');
	assert.equal(limiter.hit('c').allowed, false);
});

test('client IP: X-Real-IP by default, never a shared fallback', () => {
	const h = (o: Record<string, string>) => new Headers(o);
	const both = h({ 'x-real-ip': '203.0.113.9', 'x-forwarded-for': '6.6.6.6, 198.51.100.1' });
	assert.equal(clientIp(both, '127.0.0.1', 'x-real-ip'), '203.0.113.9');
	assert.equal(
		clientIp(h({ 'x-real-ip': ' 2001:db8::1 ' }), '127.0.0.1', 'x-real-ip'),
		'2001:db8::1',
	);
	assert.equal(clientIp(h({}), '127.0.0.1', 'x-real-ip'), null, 'no fallback to the socket');
	assert.equal(clientIp(h({ 'x-real-ip': '6.6.6.6, 1.2.3.4' }), '127.0.0.1', 'x-real-ip'), null);
	assert.equal(clientIp(h({ 'x-real-ip': 'unknown' }), undefined, 'x-real-ip'), null);
});

test('client IP: X-Forwarded-For right-most trusted hop, or the socket, when configured', () => {
	const h = (o: Record<string, string>) => new Headers(o);
	assert.equal(
		clientIp(h({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' }), undefined, 'x-forwarded-for', 1),
		'203.0.113.9',
	);
	assert.equal(
		clientIp(
			h({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9, 10.0.0.1' }),
			undefined,
			'x-forwarded-for',
			2,
		),
		'203.0.113.9',
	);
	assert.equal(
		clientIp(h({ 'x-forwarded-for': '203.0.113.9' }), undefined, 'x-forwarded-for', 2),
		null,
	);
	assert.equal(clientIp(h({}), undefined, 'x-forwarded-for', 1), null);
	assert.equal(clientIp(h({ 'x-real-ip': '6.6.6.6' }), '127.0.0.1', 'socket'), '127.0.0.1');
	assert.equal(clientIp(h({}), undefined, 'socket'), null);
});

test('rate key: IPv6 by /64 prefix, IPv4 and mapped IPv4 as is', () => {
	assert.equal(rateKey('203.0.113.9'), '203.0.113.9');
	assert.equal(rateKey('::ffff:203.0.113.9'), '203.0.113.9');
	assert.equal(rateKey('2001:db8:1:2:3:4:5:6'), '2001:db8:1:2::/64');
	assert.equal(rateKey('2001:db8:1:2:ffff::1'), rateKey('2001:0db8:0001:0002::abcd'));
	assert.notEqual(rateKey('2001:db8:1:2::1'), rateKey('2001:db8:1:3::1'));
	assert.equal(rateKey('2001:db8::1'), '2001:db8:0:0::/64');
});

test('header shape for the debug log has no addresses', () => {
	const shape = ipHeaderShape(
		new Headers({ 'x-real-ip': '203.0.113.9', 'x-forwarded-for': '1.1.1.1, 203.0.113.9' }),
		'127.0.0.1',
	);
	assert.deepEqual(shape, { xRealIp: 'ip', xForwardedForHops: 2, socket: 'ip' });
	assert.doesNotMatch(JSON.stringify(shape), /203|127|1\.1/);
});

// --- ALTCHA -------------------------------------------------------------------------------

async function solved(
	challenge: Parameters<typeof solveChallenge>[0]['challenge'],
): Promise<string> {
	const solution = await solveChallenge({ challenge, deriveKey });
	assert.ok(solution, 'challenge not solved');
	return Buffer.from(
		JSON.stringify({
			challenge,
			solution: { counter: solution.counter, derivedKey: solution.derivedKey },
		}),
	).toString('base64');
}

test('ALTCHA: a solved challenge passes once, a replay fails', async () => {
	const replay = createReplayStore();
	const payload = await solved(await newChallenge(KEY, { counter: 50 }));
	assert.deepEqual(await checkAltcha(payload, KEY, replay), { ok: true });
	assert.deepEqual(await checkAltcha(payload, KEY, replay), { ok: false, reason: 'replayed' });
});

test('ALTCHA: wrong key, wrong solution, expired, missing, malformed', async () => {
	const replay = createReplayStore();
	const challenge = await newChallenge(KEY, { counter: 50 });
	const payload = await solved(challenge);
	assert.deepEqual(await checkAltcha(payload, 'x'.repeat(40), replay), {
		ok: false,
		reason: 'invalid',
	});
	const wrong = Buffer.from(
		JSON.stringify({ challenge, solution: { counter: 51, derivedKey: '00'.repeat(32) } }),
	).toString('base64');
	assert.deepEqual(await checkAltcha(wrong, KEY, replay), { ok: false, reason: 'invalid' });
	const old = await solved(
		await newChallenge(KEY, { counter: 50, expiresAt: Math.floor(Date.now() / 1000) - 1 }),
	);
	assert.deepEqual(await checkAltcha(old, KEY, replay), { ok: false, reason: 'expired' });
	assert.deepEqual(await checkAltcha(null, KEY, replay), { ok: false, reason: 'missing' });
	assert.deepEqual(await checkAltcha('%%%', KEY, replay), { ok: false, reason: 'malformed' });
	assert.equal(decodePayload('x'.repeat(5000)), null);
});

test('ALTCHA: a tampered challenge (easier prefix) fails the signature', async () => {
	const challenge = await newChallenge(KEY, { counter: 50 });
	const tampered = { ...challenge, parameters: { ...challenge.parameters, keyPrefix: '0' } };
	const payload = await solved(tampered);
	assert.deepEqual(await checkAltcha(payload, KEY, createReplayStore()), {
		ok: false,
		reason: 'invalid',
	});
});

test('replay store forgets expired ids', () => {
	let t = 0;
	const store = createReplayStore({ now: () => t });
	assert.equal(store.use('a', 100), 'ok');
	assert.equal(store.use('a', 100), 'replayed');
	t = 101;
	assert.equal(store.use('a', 200), 'ok');
});

test('replay store: full of unexpired ids -> refuse, never evict', () => {
	let t = 0;
	const store = createReplayStore({ maxEntries: 2, now: () => t });
	assert.equal(store.use('a', 100), 'ok');
	assert.equal(store.use('b', 200), 'ok');
	assert.equal(store.use('c', 200), 'full');
	assert.equal(store.use('a', 100), 'replayed', 'a is still remembered');
	t = 150;
	assert.equal(store.use('c', 300), 'ok', 'expired a made room');
});

// --- mail ---------------------------------------------------------------------------------

const META = { site: 'https://staging.bonis.de', receivedAt: new Date('2026-10-29T13:05:00Z') };

test('mail: from, to, reply-to, subject and all fields in the text', () => {
	const config = ok(loadConfig(ENV)).config;
	const data = ok(validateContact(form(valid))).data;
	const message = composeMail(config, data, META);
	assert.deepEqual(message.from, { name: 'bonis.de Website', address: 'website@example.org' });
	assert.equal(message.to, 'office@example.org');
	assert.deepEqual(message.replyTo, { name: 'Erika Mustermann', address: 'erika@example.org' });
	assert.equal(message.subject, '[bonis.de] Jobangebot');
	for (const part of [
		'Erika Mustermann',
		'erika@example.org',
		'Jobangebot',
		'Bitte rufen Sie mich an.\nDanke!',
		'https://staging.bonis.de',
		'29.10.2026, 14:05:00 (Europe/Berlin)',
	]) {
		assert.ok(String(message.text).includes(part), part);
	}
	assert.equal(message.attachments, undefined);
});

test('mail: text layout', () => {
	const text = mailText(
		{ name: 'A B', email: 'a@b.de', subject: 'Hallo', message: 'Hallo Welt!' },
		META,
	);
	assert.match(text, /^Name: {5}A B$/m);
	assert.match(text, /^Betreff: {2}Hallo$/m);
});

test('mail: the encoded message has exactly one Reply-To and no injected headers', async () => {
	const config = ok(loadConfig(ENV)).config;
	const data = {
		...ok(validateContact(form(valid))).data,
		name: 'Erika "Bcc: x@evil.test" <y@evil.test>',
	};
	const transport = nodemailer.createTransport({
		streamTransport: true,
		buffer: true,
		newline: 'unix',
	});
	const info = await transport.sendMail(composeMail(config, data, META));
	const raw = info.message.toString();
	const headers = raw.slice(0, raw.indexOf('\n\n'));
	assert.equal(headers.match(/^Reply-To:/gim)?.length, 1);
	assert.doesNotMatch(headers, /^Bcc:/im);
	assert.deepEqual(info.envelope.to, ['office@example.org']);
});

test('SMTP: STARTTLS required except on loopback; 465 is implicit TLS', () => {
	const base = ok(loadConfig(ENV)).config;
	const opts = (host: string, port: number) =>
		createTransport({ ...base, smtp: { ...base.smtp, host, port } })
			.options as SMTPTransport.Options;
	assert.equal(opts('relay.stylite.eu', 2525).requireTLS, true);
	assert.equal(
		opts('relay.stylite.eu', 2525).tls?.rejectUnauthorized,
		undefined,
		'certificate checks stay on',
	);
	assert.equal(opts('127.0.0.1', 2525).requireTLS, false);
	assert.equal(opts('relay.stylite.eu', 465).secure, true);
	for (const h of ['localhost', '127.0.0.1', '127.1.2.3', '::1', '[::1]'])
		assert.equal(isLoopback(h), true, h);
	for (const h of ['relay.stylite.eu', '10.0.0.1', '128.0.0.1', 'localhost.evil.test'])
		assert.equal(isLoopback(h), false, h);
});
