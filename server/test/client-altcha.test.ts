// The browser solver (src/helpers/altcha.ts) against the server's ALTCHA check: what the forms
// post must pass checkAltcha. Runs the client code in Node (crypto.subtle). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solveAltcha } from '../../src/helpers/altcha.ts';
import { checkAltcha, createReplayStore, newChallenge } from '../src/altcha.ts';

const KEY = 'k'.repeat(40);

test('a challenge solved by the browser code passes the server check', async () => {
	const challenge = await newChallenge(KEY, { counter: 40 });
	const payload = await solveAltcha(JSON.parse(JSON.stringify(challenge)));
	assert.deepEqual(await checkAltcha(payload, KEY, createReplayStore()), { ok: true });
});

test('an unknown algorithm is refused', async () => {
	const challenge = await newChallenge(KEY, { counter: 1 });
	const other = { ...challenge, parameters: { ...challenge.parameters, algorithm: 'SHA-1' } };
	await assert.rejects(solveAltcha(other), /algorithm/);
});
