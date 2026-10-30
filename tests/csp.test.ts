// Unit tests for tools/csp.mjs (Content-Security-Policy check of built pages).
// Run: pnpm test:tools
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsp, scriptHash, pageViolations } from '../tools/csp.mjs';

const CONF = `
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' '${scriptHash('ok()')}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'none'; form-action 'self'" always;
`;
const csp = parseCsp(CONF);
const page = (body: string, head = '') =>
	`<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;

test('parseCsp reads the directives of the add_header line', () => {
	assert.deepEqual(csp.get('default-src'), ["'self'"]);
	assert.deepEqual(csp.get('img-src'), ["'self'", 'data:']);
	assert.equal(csp.get('script-src').length, 2);
});

test('parseCsp fails without a Content-Security-Policy header', () => {
	assert.throws(
		() => parseCsp('add_header X-Frame-Options "DENY" always;'),
		/Content-Security-Policy/,
	);
});

test('parseCsp ignores commented-out lines', () => {
	const conf = `## add_header Content-Security-Policy "style-src 'unsafe-inline'" always;
add_header Content-Security-Policy "style-src 'self'" always;`;
	assert.deepEqual(parseCsp(conf).get('style-src'), ["'self'"]);
});

test('parseCsp accepts the same policy repeated in a location block', () => {
	const line = `add_header Content-Security-Policy "default-src 'self'" always;`;
	assert.deepEqual(parseCsp(`${line}\nlocation ~ x {\n\t${line}\n}`).get('default-src'), [
		"'self'",
	]);
});

test('parseCsp fails when active policies differ', () => {
	const conf = `add_header Content-Security-Policy "default-src 'self'" always;
location ~ x { add_header Content-Security-Policy "default-src *" always; }`;
	assert.throws(() => parseCsp(conf), /differ/);
});

test('scriptHash is the base64 SHA-256 the browser computes', () => {
	// echo -n 'ok()' | openssl dgst -sha256 -binary | base64
	assert.equal(scriptHash('ok()'), 'sha256-TD4bijd3KUcHDmm9fAy+0QwyFVw/v4b25yHb8E2F7bY=');
});

test('an inline script with an allowed hash passes', () => {
	assert.deepEqual(pageViolations(page('', '<script>ok()</script>'), csp), []);
});

test('an inline script with an unknown hash is reported with its hash', () => {
	const [v] = pageViolations(page('<script>evil()</script>'), csp);
	assert.match(v, /inline script/);
	assert.match(v, new RegExp(scriptHash('evil()').replace(/[+/=]/g, '\\$&')));
});

test('JSON-LD and other data blocks are not executed and need no hash', () => {
	const html = page('', '<script type="application/ld+json">{"a":1}</script>');
	assert.deepEqual(pageViolations(html, csp), []);
});

test('same-origin script files pass, external ones do not', () => {
	assert.deepEqual(pageViolations(page('<script src="/scripts/site.js?v=1"></script>'), csp), []);
	assert.equal(
		pageViolations(page('<script src="https://cdn.example.com/x.js"></script>'), csp).length,
		1,
	);
	assert.equal(
		pageViolations(page('<script src="//cdn.example.com/x.js"></script>'), csp).length,
		1,
	);
});

test('inline event handlers and javascript: URLs are reported', () => {
	assert.equal(pageViolations(page('<button onclick="go()">x</button>'), csp).length, 1);
	assert.equal(pageViolations(page('<a href="javascript:go()">x</a>'), csp).length, 1);
});

test("inline styles pass with 'unsafe-inline' in style-src", () => {
	assert.deepEqual(pageViolations(page('<p style="color:red">x</p><style>p{}</style>'), csp), []);
});

test('inline styles are reported when style-src does not allow them', () => {
	const strict = parseCsp(`add_header Content-Security-Policy "default-src 'self'" always;`);
	assert.equal(pageViolations(page('<p style="color:red">x</p>'), strict).length, 1);
});

test('images: self and data: pass when allowed, external hosts do not', () => {
	assert.deepEqual(
		pageViolations(
			page('<img src="/a.png" srcset="/a-1.webp 1x, data:image/png;base64,AA 2x">'),
			csp,
		),
		[],
	);
	assert.equal(pageViolations(page('<img src="https://img.example.com/a.png">'), csp).length, 1);
});

test("iframes are reported when frame-src is 'none'", () => {
	assert.equal(pageViolations(page('<iframe src="/embed/"></iframe>'), csp).length, 1);
});

test('form targets must match form-action', () => {
	assert.deepEqual(
		pageViolations(page('<form action="/api/contact" method="post"></form>'), csp),
		[],
	);
	assert.equal(
		pageViolations(page('<form action="https://forms.example.com/x"></form>'), csp).length,
		1,
	);
});

test('external stylesheets are checked against style-src', () => {
	assert.equal(
		pageViolations(page('', '<link rel="stylesheet" href="https://fonts.example.com/a.css">'), csp)
			.length,
		1,
	);
	assert.deepEqual(
		pageViolations(page('', '<link rel="stylesheet" href="/_astro/Base.abc123.css">'), csp),
		[],
	);
});

// --- bonis.de ("App website" plan) ---------------------------------------------------------

test('style attributes follow style-src-attr when present, <style> elements stay on style-src', () => {
	const app = parseCsp(
		`add_header Content-Security-Policy "default-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'" always;`,
	);
	assert.deepEqual(pageViolations(page('<p style="border:0">x</p>'), app), []);
	assert.equal(pageViolations(page('<style>p{}</style>'), app).length, 1);
});

test('scheme sources (https:) allow every host of that scheme', () => {
	const app = parseCsp(
		`add_header Content-Security-Policy "default-src 'self'; frame-src 'self' https:" always;`,
	);
	assert.deepEqual(
		pageViolations(page('<iframe src="https://stackblitz.com/x"></iframe>'), app),
		[],
	);
	assert.equal(
		pageViolations(page('<iframe src="http://insecure.example/x"></iframe>'), app).length,
		1,
	);
});
