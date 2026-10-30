// Checks built HTML against the site's Content-Security-Policy (deploy/nginx-directives.conf).
// The CSP is sent by nginx, not by the build, so a page can look fine in every other check and
// still be broken in the browser: a changed inline script gets a new hash and is blocked
// silently. pageViolations() reports everything on a page the policy would block.
// Covered: inline scripts (hash), script/style/img/iframe/form URLs (origin), inline event
// handlers, javascript: URLs, inline styles (style attributes via style-src-attr). Not covered: url() inside CSS files, fetch() and
// workers started by scripts (connect-src/worker-src) — test those in the browser.
import { createHash } from 'node:crypto';
import { parse } from 'parse5';

/**
 * Directives of the Content-Security-Policy add_header line: Map("script-src" -> sources).
 * Commented-out lines (#) are ignored. The plan repeats the header inside location blocks
 * (nginx drops server-level add_header there); every active copy must be the same policy.
 */
export function parseCsp(nginxConf) {
	const policies = nginxConf
		.split('\n')
		.filter((line) => !line.trim().startsWith('#'))
		.flatMap((line) =>
			[...line.matchAll(/add_header\s+Content-Security-Policy\s+"([^"]+)"/g)].map((m) => m[1]),
		);
	if (policies.length === 0) throw new Error('no Content-Security-Policy add_header line found');
	if (new Set(policies).size > 1)
		throw new Error('Content-Security-Policy add_header lines differ');
	return new Map(
		policies[0]
			.split(';')
			.map((part) => part.trim().split(/\s+/))
			.filter(([name]) => name)
			.map(([name, ...sources]) => [name.toLowerCase(), sources]),
	);
}

/** "sha256-<base64>" of a script's text, as the browser computes it. */
export function scriptHash(text) {
	return `sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}`;
}

// Sources of a fetch directive, with default-src as fallback (CSP Level 3).
function sourcesFor(csp, directive) {
	return csp.get(directive) ?? csp.get('default-src') ?? [];
}

// Script types the browser executes; anything else (JSON-LD, templates) is a data block.
const EXECUTABLE = new Set(['', 'text/javascript', 'application/javascript', 'module']);

function isAllowedUrl(url, sources) {
	if (sources.includes("'none'")) return false;
	if (sources.includes('*')) return true;
	const value = url.trim();
	if (/^data:/i.test(value)) return sources.includes('data:');
	if (/^blob:/i.test(value)) return sources.includes('blob:');
	if (/^(https?:)?\/\//i.test(value)) {
		const { host, protocol } = new URL(value, 'https://self.invalid');
		if (sources.includes(protocol)) return true; // scheme source, e.g. https:
		return sources.some((s) => s.replace(/^https?:\/\//, '').replace(/\/$/, '') === host);
	}
	return sources.includes("'self'"); // relative or root-relative = same origin
}

function inlineAllowed(sources) {
	// 'unsafe-inline' is ignored by browsers as soon as a hash or nonce is present
	const hashed = sources.some((s) => /^'(sha\d+|nonce)-/.test(s));
	return sources.includes("'unsafe-inline'") && !hashed;
}

function walk(node, visit) {
	visit(node);
	for (const child of node.childNodes ?? []) walk(child, visit);
	if (node.content) walk(node.content, visit);
}

const attrOf = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const textOf = (node) => (node.childNodes ?? []).map((c) => c.value ?? '').join('');

// What each element loads, and the directive that governs it.
const URL_RULES = [
	{ tag: 'script', attr: 'src', directive: 'script-src' },
	{ tag: 'img', attr: 'src', directive: 'img-src' },
	{ tag: 'img', attr: 'srcset', directive: 'img-src' },
	{ tag: 'source', attr: 'srcset', directive: 'img-src' },
	{ tag: 'iframe', attr: 'src', directive: 'frame-src' },
	{ tag: 'form', attr: 'action', directive: 'form-action', noFallback: true },
];

function urlsOf(node, attr) {
	const value = attrOf(node, attr);
	if (value === undefined) return [];
	if (attr === 'srcset')
		return value
			.split(',')
			.map((part) => part.trim().split(/\s+/)[0])
			.filter(Boolean);
	return [value];
}

function checkElement(node, csp, report) {
	const tag = node.tagName;
	for (const { name, value } of node.attrs) {
		if (/^on/i.test(name))
			report(`inline event handler ${name}="${value.slice(0, 40)}" on <${tag}>`);
		if (
			(name === 'href' || name === 'src' || name === 'action') &&
			/^\s*javascript:/i.test(value)
		) {
			report(`javascript: URL in <${tag} ${name}>`);
		}
	}
	// style="" attributes: style-src-attr if present, else style-src (CSP Level 3)
	const attrSources = csp.get('style-src-attr') ?? sourcesFor(csp, 'style-src');
	if (attrOf(node, 'style') !== undefined && !inlineAllowed(attrSources)) {
		report(`inline style attribute on <${tag}> (style-src-attr/style-src has no 'unsafe-inline')`);
	}
	for (const rule of URL_RULES) {
		if (rule.tag !== tag) continue;
		// form-action has no default-src fallback: without the directive, any target is allowed
		if (rule.noFallback && !csp.has(rule.directive)) continue;
		const sources = sourcesFor(csp, rule.directive);
		if (tag === 'iframe' && sources.includes("'none'")) {
			report(`<iframe> is blocked (${rule.directive} 'none')`);
			continue;
		}
		for (const url of urlsOf(node, rule.attr)) {
			if (!isAllowedUrl(url, sources))
				report(`<${tag} ${rule.attr}="${url}"> is not allowed by ${rule.directive}`);
		}
	}
	if (tag === 'link' && /\bstylesheet\b/i.test(attrOf(node, 'rel') ?? '')) {
		const href = attrOf(node, 'href') ?? '';
		if (!isAllowedUrl(href, sourcesFor(csp, 'style-src')))
			report(`stylesheet ${href} is not allowed by style-src`);
	}
}

function checkInlineBlock(node, csp, report) {
	if (node.tagName === 'script' && attrOf(node, 'src') === undefined) {
		const type = (attrOf(node, 'type') ?? '').trim().toLowerCase();
		if (!EXECUTABLE.has(type)) return;
		const sources = sourcesFor(csp, 'script-src');
		const hash = scriptHash(textOf(node));
		if (!sources.includes(`'${hash}'`) && !inlineAllowed(sources)) {
			report(
				`inline script with ${hash} is not allowed by script-src (add the hash in Plesk and in deploy/nginx-directives.conf, or move the script to a file)`,
			);
		}
	}
	if (node.tagName === 'style' && !inlineAllowed(sourcesFor(csp, 'style-src'))) {
		const hash = scriptHash(textOf(node));
		if (!sourcesFor(csp, 'style-src').includes(`'${hash}'`))
			report(`inline <style> with ${hash} is not allowed by style-src`);
	}
}

/** Everything on one page that the CSP would block, as readable messages. */
export function pageViolations(html, csp) {
	const found = [];
	const report = (message) => found.push(message);
	walk(parse(html), (node) => {
		if (!node.tagName) return;
		checkElement(node, csp, report);
		checkInlineBlock(node, csp, report);
	});
	return found;
}
