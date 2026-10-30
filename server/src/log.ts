// One JSON line per event on stdout/stderr (Passenger writes both to the Plesk app log).
// Never pass form contents, addresses or secrets here.

export type LogFields = Record<string, string | number | boolean | undefined>;

export interface Logger {
	info(event: string, fields?: LogFields): void;
	warn(event: string, fields?: LogFields): void;
	error(event: string, fields?: LogFields): void;
}

const line = (level: string, event: string, fields: LogFields = {}) =>
	JSON.stringify({
		time: new Date().toISOString(),
		level,
		scope: 'contact-form',
		event,
		...fields,
	});

export const consoleLogger: Logger = {
	info: (event, fields) => console.info(line('info', event, fields)),
	warn: (event, fields) => console.warn(line('warn', event, fields)),
	error: (event, fields) => console.error(line('error', event, fields)),
};
