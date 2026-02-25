/**
 * Minimal SMTP client using Cloudflare Workers connect() TCP API.
 * Sends a single email over an SSL/TLS connection (port 465).
 */
import { connect } from 'cloudflare:sockets';

interface SmtpOptions {
	host: string;
	port: number;
	username: string;
	password: string;
}

interface MailOptions {
	from: string;
	to: string;
	replyTo: string;
	subject: string;
	text: string;
}

async function readResponse(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
	const decoder = new TextDecoder();
	let response = '';

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		response += decoder.decode(value, { stream: true });
		// Multiline SMTP responses use "250-..." for continuation lines
		// and "250 ..." (space) for the final line. Wait until we have a final line.
		const lines = response.split('\r\n');
		const lastComplete = lines.length > 1 ? lines[lines.length - 2] : null;
		if (lastComplete && lastComplete.length >= 4 && lastComplete[3] === ' ') break;
	}

	return response.trim();
}

async function sendCommand(
	writer: WritableStreamDefaultWriter<Uint8Array>,
	reader: ReadableStreamDefaultReader<Uint8Array>,
	command: string,
	expectedCode: number,
): Promise<string> {
	const encoder = new TextEncoder();
	await writer.write(encoder.encode(command + '\r\n'));

	const response = await readResponse(reader);
	// For multiline responses, parse the code from the last line
	const lines = response.split('\r\n').filter(Boolean);
	const lastLine = lines[lines.length - 1] || response;
	const code = parseInt(lastLine.substring(0, 3), 10);

	if (code !== expectedCode) {
		throw new Error(`SMTP error: expected ${expectedCode}, got "${response}"`);
	}

	return response;
}

function formatDate(): string {
	return new Date().toUTCString().replace('GMT', '+0000');
}

function escapeHeader(value: string): string {
	return value.replace(/[\r\n]/g, ' ').trim();
}

export async function sendMail(smtp: SmtpOptions, mail: MailOptions): Promise<void> {
	const socket = connect(`${smtp.host}:${smtp.port}`, { secureTransport: 'on' });

	const writer = socket.writable.getWriter();
	const reader = socket.readable.getReader();

	try {
		// Read server greeting
		const greeting = await readResponse(reader);
		if (!greeting.startsWith('220')) {
			throw new Error(`SMTP greeting error: ${greeting}`);
		}

		// EHLO
		await sendCommand(writer, reader, 'EHLO bonis.de', 250);

		// AUTH LOGIN
		await sendCommand(writer, reader, 'AUTH LOGIN', 334);
		await sendCommand(
			writer,
			reader,
			btoa(smtp.username),
			334,
		);
		await sendCommand(
			writer,
			reader,
			btoa(smtp.password),
			235,
		);

		// MAIL FROM
		await sendCommand(writer, reader, `MAIL FROM:<${mail.from}>`, 250);

		// RCPT TO
		await sendCommand(writer, reader, `RCPT TO:<${mail.to}>`, 250);

		// DATA
		await sendCommand(writer, reader, 'DATA', 354);

		// Compose email
		const body = [
			`From: "${escapeHeader(mail.replyTo)}" <${mail.from}>`,
			`To: <${mail.to}>`,
			`Reply-To: <${mail.replyTo}>`,
			`Subject: ${escapeHeader(mail.subject)}`,
			`Date: ${formatDate()}`,
			`MIME-Version: 1.0`,
			`Content-Type: text/plain; charset=UTF-8`,
			`Content-Transfer-Encoding: 8bit`,
			'',
			mail.text,
			'',
			'.',
		].join('\r\n');

		await sendCommand(writer, reader, body, 250);

		// QUIT
		await sendCommand(writer, reader, 'QUIT', 221);
	} finally {
		try {
			writer.releaseLock();
			reader.releaseLock();
		} catch {
			// ignore release errors
		}
		socket.close();
	}
}
