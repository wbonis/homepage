// The Node server behind Passenger on Plesk: /api/altcha and /api/contact, plus the static
// desktop app from client/. nginx serves existing files itself ("smart static"), so Node mostly
// sees "/" and missing files; it still serves client/ completely (also for local runs) and sets
// the cache headers itself: hashed /assets/ immutable, everything else revalidated. Unit tests: server/test/http.test.ts.
import { open } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { createContactHandler } from './handler.ts';
import type { Logger } from './log.ts';

/** Largest body read from the socket; the handler's own limit (32 KB) is below it. */
export const MAX_REQUEST_BYTES = 64 * 1024;

type ContactHandler = ReturnType<typeof createContactHandler>;

export interface AppOptions {
	handler: ContactHandler;
	/** Folder with the built site (deploy branch: client/) */
	clientDir: string;
	log: Logger;
}

const TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.webmanifest': 'application/manifest+json; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8',
	'.txt': 'text/plain; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.gif': 'image/gif',
	'.ico': 'image/x-icon',
	'.mp3': 'audio/mpeg',
	'.mp4': 'video/mp4',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.pdf': 'application/pdf',
};

/** Vite writes content-hashed names into /assets/; everything else may change on a deploy. */
function cacheControl(pathname: string): string {
	return pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
}

function sendText(
	res: ServerResponse,
	status: number,
	text: string,
	headers: Record<string, string> = {},
) {
	res.writeHead(status, {
		'content-type': 'text/plain; charset=utf-8',
		'cache-control': 'no-store',
		...headers,
	});
	res.end(text);
}

/** File below clientDir for a URL path, or null (outside, dotfile, bad encoding). */
function fileFor(clientDir: string, pathname: string): string | null {
	let decoded: string;
	try {
		decoded = decodeURIComponent(pathname);
	} catch {
		return null;
	}
	if (decoded.includes('\0')) return null;
	const parts = decoded.split('/').filter(Boolean);
	if (parts.some((p) => p.startsWith('.'))) return null;
	const root = resolve(clientDir);
	const file = resolve(
		root,
		...parts,
		decoded.endsWith('/') || parts.length === 0 ? 'index.html' : '',
	);
	return file === root || file.startsWith(root + sep) ? file : null;
}

async function serveStatic(
	clientDir: string,
	req: IncomingMessage,
	res: ServerResponse,
	pathname: string,
) {
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		return sendText(res, 405, 'Method Not Allowed\n', { allow: 'GET, HEAD' });
	}
	const file = fileFor(clientDir, pathname);
	// Open before answering: a file that vanished (deploy) or is unreadable is a clean 404
	const handle = file ? await open(file).catch(() => null) : null;
	const info = handle ? await handle.stat().catch(() => null) : null;
	if (!file || !handle || !info?.isFile()) {
		await handle?.close();
		return sendText(res, 404, 'Not Found\n');
	}
	res.writeHead(200, {
		'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
		'content-length': String(info.size),
		'cache-control': cacheControl(pathname),
		'x-content-type-options': 'nosniff',
	});
	if (req.method === 'HEAD') {
		await handle.close();
		return res.end();
	}
	// pipeline forwards stream errors to the caller (try/catch in createAppServer)
	await pipeline(handle.createReadStream(), res);
}

/** Request body up to MAX_REQUEST_BYTES, or null when it is larger. */
async function readBody(req: IncomingMessage): Promise<Buffer | null> {
	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of req) {
		size += chunk.length;
		if (size > MAX_REQUEST_BYTES) return null;
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

function toHeaders(req: IncomingMessage): Headers {
	const headers = new Headers();
	for (const [name, value] of Object.entries(req.headers)) {
		if (value === undefined) continue;
		for (const v of Array.isArray(value) ? value : [value]) headers.append(name, v);
	}
	return headers;
}

async function writeResponse(res: ServerResponse, response: Response) {
	res.writeHead(response.status, Object.fromEntries(response.headers));
	if (!response.body) return res.end();
	await pipeline(Readable.fromWeb(response.body as import('node:stream/web').ReadableStream), res);
}

const API_ROUTES: Record<string, { method: string; run: 'post' | 'challenge' }> = {
	'/api/contact': { method: 'POST', run: 'post' },
	'/api/altcha': { method: 'GET', run: 'challenge' },
};

async function serveApi(
	handler: ContactHandler,
	req: IncomingMessage,
	res: ServerResponse,
	pathname: string,
) {
	const route = API_ROUTES[pathname.replace(/\/$/, '')];
	if (!route) return sendText(res, 404, 'Not Found\n');
	if (req.method !== route.method) {
		return sendText(res, 405, 'Method Not Allowed\n', { allow: route.method });
	}
	const body = route.method === 'POST' ? await readBody(req) : undefined;
	if (body === null) {
		res.writeHead(413, {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			connection: 'close',
		});
		return res.end(JSON.stringify({ success: false, error: 'too-large' }));
	}
	const { pathname: path, search } = new URL(req.url ?? '/', 'http://localhost');
	const request = new Request(`http://localhost${path}${search}`, {
		method: req.method,
		headers: toHeaders(req),
		body: body ? new Uint8Array(body) : undefined,
	});
	const response = await handler[route.run](request, req.socket.remoteAddress);
	await writeResponse(res, response);
}

export function createAppServer({ handler, clientDir, log }: AppOptions): Server {
	return createServer(async (req, res) => {
		try {
			const { pathname } = new URL(req.url ?? '/', 'http://localhost');
			if (pathname === '/api' || pathname.startsWith('/api/'))
				await serveApi(handler, req, res, pathname);
			else await serveStatic(clientDir, req, res, pathname);
		} catch (err) {
			log.error('request failed', { message: err instanceof Error ? err.message : String(err) });
			if (!res.headersSent) sendText(res, 500, 'Internal Server Error\n');
			else res.destroy();
		}
	});
}
