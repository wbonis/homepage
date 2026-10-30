// Tests for server/src/http.ts: routing, static files from client/, cache headers, body limit.
// Starts the real server on a free port with a temporary client/ folder. Run: npm test (in server/)
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { createContactHandler } from '../src/handler.ts';
import { createAppServer, MAX_REQUEST_BYTES } from '../src/http.ts';
import type { Logger } from '../src/log.ts';

const quiet: Logger = { info() {}, warn() {}, error() {} };
let dir: string;
let server: Server;
let base: string;

before(async () => {
	dir = await mkdtemp(join(tmpdir(), 'bonis-http-'));
	const client = join(dir, 'client');
	await mkdir(join(client, 'assets'), { recursive: true });
	await writeFile(join(client, 'index.html'), '<!doctype html><title>desktop</title>');
	await writeFile(join(client, 'assets', 'index-abc123.js'), 'console.log(1)');
	await writeFile(join(client, 'sw.js'), 'self.x = 1');
	await writeFile(join(client, 'robots.txt'), 'User-agent: *');
	await writeFile(join(client, '.htaccess'), 'secret');
	await writeFile(join(dir, 'outside.txt'), 'outside');
	const handler = createContactHandler({
		env: () => ({ ALTCHA_HMAC_KEY: 'k'.repeat(40), CLIENT_IP_HEADER: 'socket' }),
		dev: false,
		send: async () => {},
		log: quiet,
	});
	server = createAppServer({ handler, clientDir: client, log: quiet });
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
	await new Promise((resolve) => server.close(resolve));
	await rm(dir, { recursive: true, force: true });
});

test('/ serves index.html, not cached', async () => {
	const res = await fetch(`${base}/`);
	assert.equal(res.status, 200);
	assert.match(res.headers.get('content-type') ?? '', /^text\/html/);
	assert.equal(res.headers.get('cache-control'), 'no-cache');
	assert.match(await res.text(), /desktop/);
});

test('hashed /assets/ files are immutable, sw.js is no-cache', async () => {
	const js = await fetch(`${base}/assets/index-abc123.js`);
	assert.equal(js.status, 200);
	assert.match(js.headers.get('content-type') ?? '', /^text\/javascript/);
	assert.equal(js.headers.get('cache-control'), 'public, max-age=31536000, immutable');
	const sw = await fetch(`${base}/sw.js`);
	assert.equal(sw.headers.get('cache-control'), 'no-cache');
});

test('HEAD answers headers without a body', async () => {
	const res = await fetch(`${base}/robots.txt`, { method: 'HEAD' });
	assert.equal(res.status, 200);
	assert.equal(res.headers.get('content-length'), '13');
	assert.equal(await res.text(), '');
});

test('missing files, dotfiles and paths outside client/ are 404', async () => {
	for (const path of [
		'/nope.js',
		'/.htaccess',
		'/../outside.txt',
		'/%2e%2e/outside.txt',
		'/assets/%00x',
	]) {
		const res = await fetch(`${base}${path}`);
		assert.equal(res.status, 404, path);
		await res.body?.cancel();
	}
});

test('other methods on pages are 405', async () => {
	const res = await fetch(`${base}/`, { method: 'POST', body: 'x' });
	assert.equal(res.status, 405);
	assert.equal(res.headers.get('allow'), 'GET, HEAD');
});

test('API routes, with and without trailing slash; wrong method 405; unknown 404', async () => {
	for (const path of ['/api/altcha', '/api/altcha/']) {
		const res = await fetch(`${base}${path}`);
		assert.equal(res.status, 200, path);
		assert.equal((await res.json()).parameters.algorithm, 'PBKDF2/SHA-256');
	}
	for (const path of ['/api/contact', '/api/contact/']) {
		const res = await fetch(`${base}${path}`, {
			method: 'POST',
			body: new URLSearchParams({ name: 'x' }),
		});
		assert.equal(res.status, 503, `${path}: no mail config in this test`);
		assert.deepEqual(await res.json(), { success: false, error: 'server' });
	}
	const get = await fetch(`${base}/api/contact`);
	assert.equal(get.status, 405);
	assert.equal(get.headers.get('allow'), 'POST');
	await get.body?.cancel();
	const unknown = await fetch(`${base}/api/nope`);
	assert.equal(unknown.status, 404);
	await unknown.body?.cancel();
});

test('a body larger than the limit is refused with 413', async () => {
	const res = await fetch(`${base}/api/contact`, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: 'x'.repeat(MAX_REQUEST_BYTES + 1),
	});
	assert.equal(res.status, 413);
	assert.deepEqual(await res.json(), { success: false, error: 'too-large' });
});
