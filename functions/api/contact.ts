import { sendMail } from '../../src/helpers/smtp';

interface Env {
	SMTP_SERVER: string;
	SMTP_USER: string;
	SMTP_PASS: string;
	TURNSTILE_SECRET_KEY: string;
}

interface ContactBody {
	name: string;
	email: string;
	subject: string;
	message: string;
	'cf-turnstile-response': string;
}

const ALLOWED_ORIGINS = ['https://www.bonis.de', 'https://bonis.de'];

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

function corsHeaders(origin: string | null): Record<string, string> {
	const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
	return {
		'Access-Control-Allow-Origin': allowed,
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	};
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
	const formData = new URLSearchParams();
	formData.append('secret', secret);
	formData.append('response', token);
	if (ip) formData.append('remoteip', ip);

	const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: formData.toString(),
	});

	const data = (await res.json()) as { success: boolean };
	return data.success;
}

export const onRequestOptions: PagesFunction<Env> = async ({ request }) => {
	return new Response(null, {
		status: 204,
		headers: corsHeaders(request.headers.get('Origin')),
	});
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
	const origin = request.headers.get('Origin');
	const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };

	let body: ContactBody;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
	}

	const { name, email, subject, message } = body;
	const turnstileToken = body['cf-turnstile-response'];

	if (!name || !email || !subject || !message) {
		return new Response(
			JSON.stringify({ error: 'All fields are required (name, email, subject, message).' }),
			{ status: 400, headers },
		);
	}

	// Input length limits
	if (name.length > MAX_NAME || email.length > MAX_EMAIL || subject.length > MAX_SUBJECT || message.length > MAX_MESSAGE) {
		return new Response(
			JSON.stringify({ error: 'One or more fields exceed the maximum allowed length.' }),
			{ status: 400, headers },
		);
	}

	if (!isValidEmail(email)) {
		return new Response(JSON.stringify({ error: 'Invalid email address.' }), {
			status: 400,
			headers,
		});
	}

	// Verify Turnstile token
	if (!turnstileToken) {
		return new Response(JSON.stringify({ error: 'Security verification missing.' }), {
			status: 400,
			headers,
		});
	}

	if (!env.TURNSTILE_SECRET_KEY) {
		console.error('TURNSTILE_SECRET_KEY not configured');
		return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
			status: 500,
			headers,
		});
	}

	const clientIp = request.headers.get('CF-Connecting-IP');
	const turnstileValid = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, clientIp);

	if (!turnstileValid) {
		return new Response(JSON.stringify({ error: 'Security verification failed.' }), {
			status: 403,
			headers,
		});
	}

	if (!env.SMTP_SERVER || !env.SMTP_USER || !env.SMTP_PASS) {
		console.error('SMTP credentials not configured');
		return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
			status: 500,
			headers,
		});
	}

	try {
		const text = [
			`Name: ${name}`,
			`Email: ${email}`,
			'',
			message,
		].join('\n');

		await sendMail(
			{
				host: env.SMTP_SERVER,
				port: 465,
				username: env.SMTP_USER,
				password: env.SMTP_PASS,
			},
			{
				from: 'noreply@bonis.de',
				to: 'bonis@bonis.de',
				replyTo: email,
				subject: `[bonis.de] ${subject}`,
				text,
			},
		);

		return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
	} catch (err) {
		console.error('SMTP send failed:', err instanceof Error ? err.message : String(err), err);
		return new Response(
			JSON.stringify({ error: 'Failed to send message. Please try again later.' }),
			{ status: 500, headers },
		);
	}
};
