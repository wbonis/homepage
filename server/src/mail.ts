// The contact mail: composition (plain text, all fields) and the nodemailer transport.
// SMTP: STARTTLS required (requireTLS), certificates are checked. Only a relay on the loopback
// interface may be plain (tests, local relays). A relay without STARTTLS fails every send.
// MAIL_TRANSPORT=json builds the message without sending it (dev mode only).
// Unit tests: server/test/contact-form.test.ts.
import { isIP } from 'node:net';
import nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';
import type { ContactConfig } from './config.ts';
import type { ContactData } from './fields.ts';

export interface MailMeta {
	/** Origin the form was sent from (staging or live), e.g. https://www.bonis.de */
	site: string;
	receivedAt: Date;
}

const berlinTime = new Intl.DateTimeFormat('de-DE', {
	timeZone: 'Europe/Berlin',
	dateStyle: 'medium',
	timeStyle: 'medium',
});

const row = (label: string, value: string) => `${`${label}:`.padEnd(10)}${value}`;

export function mailText(data: ContactData, meta: MailMeta): string {
	return [
		row('Name', data.name),
		row('E-Mail', data.email),
		row('Betreff', data.subject),
		'',
		data.message,
		'',
		'--',
		row('Website', meta.site),
		`Eingegangen: ${berlinTime.format(meta.receivedAt)} (Europe/Berlin)`,
		'',
	].join('\n');
}

/** Message for nodemailer. Addresses are objects, so names are encoded and never parsed. */
export function composeMail(
	config: ContactConfig,
	data: ContactData,
	meta: MailMeta,
): SendMailOptions {
	return {
		from: { name: config.from.name, address: config.from.address },
		to: config.to,
		replyTo: { name: data.name, address: data.email },
		subject: `[bonis.de] ${data.subject}`,
		text: mailText(data, meta),
		disableFileAccess: true,
		disableUrlAccess: true,
	};
}

const TIMEOUT_MS = 15_000;

/** localhost, 127.0.0.0/8, ::1 */
export function isLoopback(host: string): boolean {
	const h = host.toLowerCase().replace(/^\[|\]$/g, '');
	if (h === 'localhost' || h === '::1') return true;
	return isIP(h) === 4 && h.startsWith('127.');
}

export function createTransport(config: ContactConfig): Transporter {
	if (config.transport === 'json') return nodemailer.createTransport({ jsonTransport: true });
	const { host, port, auth, tlsServername } = config.smtp;
	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		requireTLS: port !== 465 && !isLoopback(host),
		auth,
		tls: { minVersion: 'TLSv1.2', ...(tlsServername ? { servername: tlsServername } : {}) },
		connectionTimeout: TIMEOUT_MS,
		greetingTimeout: TIMEOUT_MS,
		socketTimeout: TIMEOUT_MS,
	});
}
