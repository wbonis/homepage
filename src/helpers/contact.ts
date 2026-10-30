// Sends the contact forms (Mail app, bug report dialog) to the Node server (server/src/handler.ts):
// GET /api/altcha -> solve in the browser -> POST /api/contact as a form (urlencoded) with the
// fields, the solution ("altcha") and an empty honeypot ("website"). The server answers JSON
// { success, error?, fields? }; error codes are mapped to German texts here (the UI language).

import { solveAltcha, type AltchaChallenge } from './altcha';

export interface ContactFields {
	name: string;
	email: string;
	subject: string;
	message: string;
}

const ERROR_TEXT: Record<string, string> = {
	input: 'Bitte Eingaben prüfen.',
	altcha: 'Sicherheitsprüfung fehlgeschlagen. Bitte erneut versuchen.',
	'too-many': 'Zu viele Nachrichten. Bitte später erneut versuchen.',
	'too-large': 'Die Nachricht ist zu lang.',
	server: 'Senden fehlgeschlagen. Bitte später erneut versuchen.',
};

const FIELD_LABEL: Record<string, string> = {
	name: 'Name',
	email: 'E-Mail',
	subject: 'Betreff',
	message: 'Nachricht',
};

let pending: Promise<string> | null = null;

async function fetchAndSolve(): Promise<string> {
	const res = await fetch('/api/altcha', {
		headers: { accept: 'application/json' },
		cache: 'no-store',
	});
	if (!res.ok) throw new Error(res.status === 429 ? ERROR_TEXT['too-many'] : ERROR_TEXT.server);
	return solveAltcha((await res.json()) as AltchaChallenge);
}

/**
 * Starts the proof of work in the background (call on the first focus in a form), so it is
 * usually done before the visitor presses Send. A solution is used once.
 */
export function prepareAltcha(): Promise<string> {
	if (!pending) {
		pending = fetchAndSolve();
		pending.catch(() => (pending = null));
	}
	return pending;
}

function errorText(data: { error?: string; fields?: string[] }): string {
	if (data.error === 'input' && data.fields?.length) {
		return `Bitte prüfen: ${data.fields.map((f) => FIELD_LABEL[f] ?? f).join(', ')}.`;
	}
	return ERROR_TEXT[data.error ?? ''] ?? ERROR_TEXT.server;
}

/** Sends one message; throws an Error with a text for the visitor when it fails. */
export async function sendContact(fields: ContactFields): Promise<void> {
	let altcha: string;
	try {
		altcha = await prepareAltcha();
	} catch (err) {
		// fetchAndSolve throws texts for HTTP errors; anything else (network, solver) is generic
		const known = err instanceof Error && Object.values(ERROR_TEXT).includes(err.message);
		throw known ? err : new Error(ERROR_TEXT.altcha);
	} finally {
		pending = null;
	}
	let res: Response;
	try {
		res = await fetch('/api/contact', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: new URLSearchParams({ ...fields, website: '', altcha }),
		});
	} catch {
		throw new Error('Netzwerkfehler. Bitte erneut versuchen.');
	}
	const data = (await res.json().catch(() => ({}))) as {
		success?: boolean;
		error?: string;
		fields?: string[];
	};
	if (!res.ok || !data.success) throw new Error(errorText(data));
}
