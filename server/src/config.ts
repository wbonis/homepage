// Runtime configuration of the contact form, read from environment variables at request time
// (process.env, set in Plesk; never import.meta.env, which would be baked into the build).
// Variables: see .env.example and docs/deploy.md. Errors name the variables, never
// their values. Unit tests: server/test/contact-form.test.ts.
import { z } from 'zod';
import { IP_SOURCES, type IpSource } from './client-ip.ts';

/** Insecure key for dev mode (--dev) only; production refuses to run without ALTCHA_HMAC_KEY. */
export const DEV_ALTCHA_KEY = 'dev-only-insecure-altcha-key-do-not-use-in-production';

const DEV_DEFAULTS: Record<string, string> = {
	// no nginx in front of the dev server, so no X-Real-IP: use the socket address
	CLIENT_IP_HEADER: 'socket',
	MAIL_TRANSPORT: 'json',
	MAIL_FROM_NAME: 'bonis.de (dev)',
	MAIL_FROM_ADDRESS: 'dev@example.invalid',
	MAIL_TO_ADDRESS: 'dev@example.invalid',
	ALTCHA_HMAC_KEY: DEV_ALTCHA_KEY,
};

/** Empty strings count as unset (Plesk keeps variables with empty values). */
const optional = z
	.string()
	.optional()
	.transform((v) => (v ? v : undefined));

const int = (min: number, max: number, fallback: number) =>
	optional
		.transform((v) => (v === undefined ? fallback : Number(v)))
		.pipe(z.number().int().min(min).max(max));

const altchaKey = z.string().min(32, 'at least 32 characters');

/** Client IP and limits: needed by POST /api/contact and GET /api/altcha */
const netShape = {
	/** Where the client IP comes from (Plesk: nginx sets X-Real-IP) */
	CLIENT_IP_HEADER: z
		.string()
		.optional()
		.transform((v) => (v ? v.toLowerCase() : 'x-real-ip'))
		.pipe(z.enum(IP_SOURCES)),
	/** Only for CLIENT_IP_HEADER=x-forwarded-for: proxies that append to it */
	TRUSTED_PROXIES: int(0, 5, 1),
	RATE_LIMIT_MAX: int(1, 1000, 5),
	RATE_LIMIT_WINDOW_SECONDS: int(10, 86400, 600),
	/** Challenges per client IP and RATE_LIMIT_WINDOW_SECONDS */
	CHALLENGE_LIMIT_MAX: int(1, 10000, 30),
	/** Mails per hour from all visitors together (brake against botnets) */
	MAIL_LIMIT_PER_HOUR: int(1, 10000, 30),
};

const schema = z
	.object({
		...netShape,
		MAIL_TRANSPORT: z.enum(['smtp', 'json']).default('smtp'),
		SMTP_HOST: optional,
		SMTP_PORT: int(1, 65535, 25),
		SMTP_USER: optional,
		SMTP_PASSWORD: optional,
		/** TLS server name if the certificate does not match SMTP_HOST (e.g. host given as IP) */
		SMTP_TLS_SERVERNAME: optional,
		MAIL_FROM_NAME: z
			.string()
			.min(1)
			.regex(/^[^\r\n]*$/),
		MAIL_FROM_ADDRESS: z.email(),
		MAIL_TO_ADDRESS: z.email(),
		ALTCHA_HMAC_KEY: altchaKey,
	})
	.superRefine((env, ctx) => {
		if (env.MAIL_TRANSPORT === 'smtp' && !env.SMTP_HOST) {
			ctx.addIssue({
				code: 'custom',
				path: ['SMTP_HOST'],
				message: 'required for MAIL_TRANSPORT=smtp',
			});
		}
		if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD)) {
			ctx.addIssue({
				code: 'custom',
				path: ['SMTP_PASSWORD'],
				message: 'set SMTP_USER and SMTP_PASSWORD together',
			});
		}
	});

export interface NetConfig {
	ipSource: IpSource;
	trustedProxies: number;
	rateLimit: { max: number; windowMs: number };
	challengeLimit: { max: number; windowMs: number };
	mailLimit: { max: number; windowMs: number };
}

export interface ContactConfig extends NetConfig {
	transport: 'smtp' | 'json';
	smtp: {
		host: string;
		port: number;
		auth?: { user: string; pass: string };
		tlsServername?: string;
	};
	from: { name: string; address: string };
	to: string;
	altchaKey: string;
}

export type ConfigResult =
	| { ok: true; config: ContactConfig; devDefaults: string[] }
	| { ok: false; errors: string[] };

type Env = Record<string, string | undefined>;

/** Issue list without values: "SMTP_HOST: required for MAIL_TRANSPORT=smtp". */
function describe(error: z.ZodError): string[] {
	return error.issues.map((i) => `${i.path.join('.') || '(env)'}: ${i.message}`);
}

/** Dev defaults for unset variables, and their names (for a warning). */
function withDevDefaults(env: Env): { env: Env; applied: string[] } {
	const applied = Object.keys(DEV_DEFAULTS).filter((k) => !env[k]);
	return {
		env: { ...env, ...Object.fromEntries(applied.map((k) => [k, DEV_DEFAULTS[k]])) },
		applied,
	};
}

function net(e: z.infer<z.ZodObject<typeof netShape>>): NetConfig {
	const windowMs = e.RATE_LIMIT_WINDOW_SECONDS * 1000;
	return {
		ipSource: e.CLIENT_IP_HEADER,
		trustedProxies: e.TRUSTED_PROXIES,
		rateLimit: { max: e.RATE_LIMIT_MAX, windowMs },
		challengeLimit: { max: e.CHALLENGE_LIMIT_MAX, windowMs },
		mailLimit: { max: e.MAIL_LIMIT_PER_HOUR, windowMs: 3_600_000 },
	};
}

/**
 * Full configuration for sending mail. dev = started with --dev: dev defaults for
 * missing variables; MAIL_TRANSPORT=json is accepted only there.
 */
export function loadConfig(rawEnv: Env, dev = false): ConfigResult {
	const { env, applied } = dev ? withDevDefaults(rawEnv) : { env: rawEnv, applied: [] };
	const parsed = schema.safeParse(env);
	if (!parsed.success) return { ok: false, errors: describe(parsed.error) };
	const e = parsed.data;
	if (e.MAIL_TRANSPORT === 'json' && !dev) {
		return { ok: false, errors: ['MAIL_TRANSPORT: json only in dev mode (--dev)'] };
	}
	return {
		ok: true,
		devDefaults: applied,
		config: {
			transport: e.MAIL_TRANSPORT,
			smtp: {
				host: e.SMTP_HOST ?? '',
				port: e.SMTP_PORT,
				auth:
					e.SMTP_USER && e.SMTP_PASSWORD ? { user: e.SMTP_USER, pass: e.SMTP_PASSWORD } : undefined,
				tlsServername: e.SMTP_TLS_SERVERNAME,
			},
			from: { name: e.MAIL_FROM_NAME, address: e.MAIL_FROM_ADDRESS },
			to: e.MAIL_TO_ADDRESS,
			altchaKey: e.ALTCHA_HMAC_KEY,
			...net(e),
		},
	};
}

export type ChallengeConfigResult =
	| { ok: true; key: string; dev: boolean; net: NetConfig }
	| { ok: false; errors: string[] };

/** What GET /api/altcha needs: the ALTCHA key, client IP source and limits. */
export function loadChallengeConfig(rawEnv: Env, dev = false): ChallengeConfigResult {
	const env =
		dev && !rawEnv.CLIENT_IP_HEADER
			? { ...rawEnv, CLIENT_IP_HEADER: DEV_DEFAULTS.CLIENT_IP_HEADER }
			: rawEnv;
	const parsedNet = z.object(netShape).safeParse(env);
	const errors = parsedNet.success ? [] : describe(parsedNet.error);
	const devKey = dev && !env.ALTCHA_HMAC_KEY;
	if (!devKey && !altchaKey.safeParse(env.ALTCHA_HMAC_KEY).success) {
		errors.push(`ALTCHA_HMAC_KEY: ${env.ALTCHA_HMAC_KEY ? 'at least 32 characters' : 'missing'}`);
	}
	if (!parsedNet.success || errors.length) return { ok: false, errors };
	return {
		ok: true,
		key: devKey ? DEV_ALTCHA_KEY : env.ALTCHA_HMAC_KEY!,
		dev: devKey,
		net: net(parsedNet.data),
	};
}
