// Starts the server. Plesk/Passenger runs server/entry.mjs and sets PORT.
//   node server/entry.mjs                         production: client/ next to server/
//   node server/entry.mjs --dev --client ../dist  local: dev defaults (json mail, socket IP)
// Environment variables (names only): see .env.example and docs/deploy.md.
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createContactHandler } from './handler.ts';
import { createAppServer } from './http.ts';
import { consoleLogger } from './log.ts';

const { values } = parseArgs({
	options: { dev: { type: 'boolean', default: false }, client: { type: 'string' } },
});

const clientDir = values.client
	? resolve(values.client)
	: resolve(import.meta.dirname, '..', '..', 'client');
const handler = createContactHandler({
	env: () => process.env,
	dev: values.dev,
	log: consoleLogger,
});
const server = createAppServer({ handler, clientDir, log: consoleLogger });
const port = Number(process.env.PORT ?? 8788);

server.listen(port, () => {
	consoleLogger.info('server started', { port, dev: values.dev });
});
