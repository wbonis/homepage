// Checks every built page (dist/**/*.html) against the Content-Security-Policy that nginx sends
// (copy in deploy/nginx-directives.conf). Fails when a page has something the browser would
// block, e.g. an inline script. Ported from truenas-deutschland.
// Usage: pnpm build && node tools/check-csp.mjs   (exit 1 on violations; BUILD_DIR overrides dist)
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { parseCsp, pageViolations } from './csp.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, process.env.BUILD_DIR || 'dist');

const csp = parseCsp(await readFile(join(ROOT, 'deploy/nginx-directives.conf'), 'utf8'));
const entries = await readdir(DIST, { recursive: true, withFileTypes: true });
const pages = entries
	.filter((e) => e.isFile() && e.name.endsWith('.html'))
	.map((e) => join(e.parentPath, e.name));

let count = 0;
for (const file of pages.sort()) {
	for (const message of pageViolations(await readFile(file, 'utf8'), csp)) {
		process.stdout.write(`FAIL ${relative(DIST, file)}: ${message}\n`);
		count++;
	}
}
process.stdout.write(`${pages.length} pages checked against the CSP, ${count} violations\n`);
process.exitCode = count === 0 && pages.length > 0 ? 0 : 1;
