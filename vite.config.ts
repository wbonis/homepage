import { execSync } from 'node:child_process';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import UnpluginIcons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';
import { VitePWA } from 'vite-plugin-pwa';
import { browserslistToTargets } from 'lightningcss';
import browserslist from 'browserslist';

import { prefetch } from './prefetch-plugin.ts';
import { blogSeo } from './blog-seo-plugin.ts';
import { photosManifest } from './photos-plugin.ts';

const commitDate = execSync('git log -1 --format="%cd" --date=format:"%Y.%m.%d %H:%M"').toString().trim();
const commitHash = execSync('git log -1 --format="%h"').toString().trim();

export default defineConfig({
	plugins: [
		svelte(),
		prefetch(),
		blogSeo(),
		photosManifest(),

		UnpluginIcons({ autoInstall: true, compiler: 'svelte' }),
		VitePWA({
			includeAssets: [
				'robots.txt',
				'app-icons/finder/32.png',
				'cover-image.png',
				'cursors/(normal|link|text|help)-select.svg',
				'**/*.mp3',
			],
			manifest: {
				name: 'Mac OS Monterey Svelte Web',
				short_name: 'macOS Svelte',
				theme_color: '#ffffff',
				description: 'Mac OS Monterey Web written in Svelte',
				icons: [
					{
						src: 'app-icons/finder/128.png',
						sizes: '128x128',
						type: 'image/png',
					},
					{
						src: 'app-icons/finder/192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'app-icons/finder/256.png',
						sizes: '256x256',
						type: 'image/png',
					},
					{
						src: 'app-icons/finder/512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: 'app-icons/finder/512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable',
					},
				],
			},
		}),
		imagetools({}),
	],
	resolve: {
		alias: {
			'🍎': new URL('./src/', import.meta.url).pathname,
		},
	},
	server: {
		// pnpm dev:api runs the contact server (server/) on 8788
		proxy: { '/api': 'http://localhost:8788' },
	},
	build: {
		minify: 'terser',
		cssMinify: 'lightningcss',
	},
	define: {
		__APP_VERSION__: JSON.stringify(`${commitDate} (${commitHash})`),
	},
	css: {
		transformer: 'lightningcss',
		lightningcss: {
			targets: browserslistToTargets(browserslist('defaults, not IE 11, not IE_Mob 11, not dead')),
		},
	},
});
