// Unit tests for tools/deploy-package.mjs (package.json of the deploy branch) and the Node
// version pins. Ported from truenas-deutschland. Run: pnpm test:tools
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deployPackage } from '../tools/deploy-package.mjs';

const PKG = {
	name: 'bonis-homepage-server',
	private: true,
	type: 'module',
	engines: { node: '^26' },
	scripts: { test: 'node --test', typecheck: 'tsc' },
	dependencies: { 'altcha-lib': '2.8.0', nodemailer: '10.3.1' },
	devDependencies: { typescript: '^6.0.3' },
};

test('deployPackage keeps what the server needs to install and run', () => {
	assert.deepEqual(deployPackage(PKG), {
		name: 'bonis-homepage-server',
		private: true,
		type: 'module',
		engines: { node: '^26' },
		dependencies: { 'altcha-lib': '2.8.0', nodemailer: '10.3.1' },
	});
});

test('deployPackage drops dev dependencies and scripts', () => {
	const out = deployPackage(PKG);
	assert.equal('devDependencies' in out, false);
	assert.equal('scripts' in out, false);
});

test('deployPackage does not change its input', () => {
	const copy = structuredClone(PKG);
	deployPackage(PKG);
	assert.deepEqual(PKG, copy);
});

test('deployPackage fails without runtime dependencies', () => {
	assert.throws(() => deployPackage({ ...PKG, dependencies: undefined }), /dependencies/);
});

test('server engines.node allows exactly the major version in .nvmrc and .node-version', () => {
	const major = readFileSync('.nvmrc', 'utf8').trim();
	assert.equal(readFileSync('.node-version', 'utf8').trim(), major);
	const pkg = JSON.parse(readFileSync('server/package.json', 'utf8'));
	assert.equal(pkg.engines.node, `^${major}`);
});

test('server/.npmrc makes npm refuse a Node version outside engines', () => {
	assert.match(readFileSync('server/.npmrc', 'utf8'), /^engine-strict=true$/m);
});
