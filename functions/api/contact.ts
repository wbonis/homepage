import { sendMail } from '../../src/helpers/smtp';

interface Env {
	SMTP_USER: string;
	SMTP_PASS: string;
}

interface ContactBody {
	name: string;
	email: string;
	subject: string;
	message: string;
}

const ALLOWED_ORIGINS = ['https://www.bonis.de', 'https://bonis.de'];

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

	if (!name || !email || !subject || !message) {
		return new Response(
			JSON.stringify({ error: 'All fields are required (name, email, subject, message).' }),
			{ status: 400, headers },
		);
	}

	if (!isValidEmail(email)) {
		return new Response(JSON.stringify({ error: 'Invalid email address.' }), {
			status: 400,
			headers,
		});
	}

	if (!env.SMTP_USER || !env.SMTP_PASS) {
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
				host: 'mail.stylite.eu',
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
		console.error('SMTP send failed:', err);
		return new Response(
			JSON.stringify({ error: 'Failed to send email. Please try again later.' }),
			{ status: 500, headers },
		);
	}
};
