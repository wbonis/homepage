import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

export function photosManifest(): Plugin {
	const photosDir = resolve('public/photos');
	const extensions = ['.png', '.jpg', '.jpeg', '.webp'];

	function getPhotos(): string[] {
		try {
			return readdirSync(photosDir).filter((f) =>
				extensions.some((ext) => f.toLowerCase().endsWith(ext)),
			);
		} catch {
			return [];
		}
	}

	return {
		name: 'photos-manifest',

		configureServer(server) {
			server.middlewares.use('/photos/manifest.json', (_req, res) => {
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(getPhotos()));
			});
		},

		generateBundle() {
			this.emitFile({
				type: 'asset',
				fileName: 'photos/manifest.json',
				source: JSON.stringify(getPhotos()),
			});
		},
	};
}
