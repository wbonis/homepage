import type { apps_config } from '🍎/configs/apps/apps-config';

export type AppID = keyof typeof apps_config;

export const apps = $state({
	open: {
		finder: false,
		'about-me': false,
		projects: false,
		contact: false,
		resume: false,
		terminal: false,
		safari: false,
		blog: false,
		github: false,
		calendar: false,
		calculator: false,
		wallpapers: false,
		vscode: false,
		appstore: false,
		'view-source': false,
	} as Record<AppID, boolean>,

	active: 'finder' satisfies AppID,

	/**
	 * Maximum zIndex for the active app
	 * Initialize with -2, so that it becomes 0 when initialised
	 */
	active_z_index: -2,

	z_indices: {
		finder: 0,
		'about-me': 0,
		projects: 0,
		contact: 0,
		resume: 0,
		terminal: 0,
		safari: 0,
		blog: 0,
		github: 0,
		calendar: 0,
		calculator: 0,
		wallpapers: 0,
		vscode: 0,
		appstore: 0,
		'view-source': 0,
	} as Record<AppID, number>,

	is_being_dragged: false as boolean,

	fullscreen: {
		finder: false,
		'about-me': false,
		projects: false,
		contact: false,
		resume: false,
		terminal: false,
		safari: false,
		blog: false,
		github: false,
		calendar: false,
		calculator: false,
		wallpapers: false,
		vscode: false,
		appstore: false,
		'view-source': false,
	} as Record<AppID, boolean>,
});
