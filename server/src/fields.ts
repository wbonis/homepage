// Fields of the contact form: names, limits and server-side validation (Zod).
// Two forms post them: the Mail app (src/components/apps/Mail/Mail.svelte) and the bug report
// dialog (src/components/Desktop/ScreenOverlay.svelte), both via src/helpers/contact.ts.
// Unit tests: server/test/contact-form.test.ts.
import { z } from 'zod';

/** Form field names, shared by the client helper and the server. */
export const FIELD = {
	name: 'name',
	email: 'email',
	subject: 'subject',
	message: 'message',
	/** Honeypot: never filled by the forms, must stay empty */
	honeypot: 'website',
	/** ALTCHA proof of work (base64 JSON), filled by src/helpers/altcha.ts */
	altcha: 'altcha',
} as const;

export const LIMITS = {
	name: { min: 2, max: 100 },
	email: { max: 254 },
	subject: { min: 1, max: 200 },
	message: { min: 1, max: 5000 },
} as const;

/** Fields a visitor fills in; the server reports invalid ones by these names. */
export type FieldName = 'name' | 'email' | 'subject' | 'message';

// Single-line fields end up in mail headers (Reply-To) or the subject: no CR/LF, and no other
// control characters anywhere (C0, DEL, C1), nor invisible zero-width or bidi controls that
// could disguise text. The message keeps line breaks and tabs.
const INVISIBLE = '\u0080-\u009f​-‏‪-‮⁦-⁩';
const NO_CONTROL = new RegExp(`^[^\\u0000-\\u001f\\u007f${INVISIBLE}]*$`);
const NO_CONTROL_MULTILINE = new RegExp(
	`^[^\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f${INVISIBLE}]*$`,
);

const line = (max: number, min = 0) => z.string().trim().min(min).max(max).regex(NO_CONTROL);

export interface ContactData {
	name: string;
	email: string;
	subject: string;
	message: string;
}

const contactSchema = z.object({
	name: line(LIMITS.name.max, LIMITS.name.min),
	email: z.string().trim().max(LIMITS.email.max).regex(NO_CONTROL).pipe(z.email()),
	subject: line(LIMITS.subject.max, LIMITS.subject.min),
	message: z
		.string()
		.transform((v) => v.replace(/\r\n?/g, '\n'))
		.pipe(
			z.string().trim().min(LIMITS.message.min).max(LIMITS.message.max).regex(NO_CONTROL_MULTILINE),
		),
});

export type ValidationResult = { ok: true; data: ContactData } | { ok: false; fields: FieldName[] };

/** First value of each field; a repeated field is invalid (a browser never sends one twice). */
function singleValues(form: FormData): Record<string, string | undefined> | null {
	const out: Record<string, string | undefined> = {};
	for (const name of Object.values(FIELD)) {
		const all = form.getAll(name);
		if (all.length > 1 || all.some((v) => typeof v !== 'string')) return null;
		out[name] = all[0] as string | undefined;
	}
	return out;
}

export function validateContact(form: FormData): ValidationResult {
	const values = singleValues(form);
	if (!values) return { ok: false, fields: [] };
	const result = contactSchema.safeParse(values);
	if (result.success) return { ok: true, data: result.data };
	const fields = [...new Set(result.error.issues.map((i) => String(i.path[0])))] as FieldName[];
	return { ok: false, fields };
}

/** True if the honeypot field has any content (a missing field counts as empty). */
export function honeypotFilled(form: FormData): boolean {
	const value = form.get(FIELD.honeypot);
	if (value === null) return false;
	return typeof value !== 'string' || value.trim() !== '';
}
