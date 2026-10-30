// package.json for the deploy branch: only what the Node server on Plesk installs and runs.
// No devDependencies (TypeScript and test tools have no place on the web server) and no
// scripts (the "prepare" hook would run on the server's npm install).
// Usage (release.sh): node tools/deploy-package.mjs server/package.json > out/package.json
//   then `npm install --package-lock-only` in out/ trims the lock file to match.
import { readFileSync } from 'node:fs';

const KEEP = ['name', 'version', 'private', 'type', 'engines', 'dependencies'];

export function deployPackage(pkg) {
	if (!pkg.dependencies || Object.keys(pkg.dependencies).length === 0) {
		throw new Error('package.json has no runtime dependencies');
	}
	return Object.fromEntries(KEEP.filter((key) => key in pkg).map((key) => [key, pkg[key]]));
}

if (import.meta.main) {
	const [file] = process.argv.slice(2);
	if (!file) throw new Error('usage: node tools/deploy-package.mjs <package.json>');
	process.stdout.write(
		`${JSON.stringify(deployPackage(JSON.parse(readFileSync(file, 'utf8'))), null, 2)}\n`,
	);
}
