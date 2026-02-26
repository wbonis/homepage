import { create_app_config } from '🍎/helpers/create-app-config.ts';

const finder = create_app_config({
	title: 'Finder',
	resizable: true,
	height: 600,
	width: 900,
});

const fotos = create_app_config({
	title: 'Fotos',
	resizable: true,
	height: 600,
	width: 800,
});

const wallpapers = create_app_config({
	title: 'Hintergründe',
	resizable: true,
	height: 600,
	width: 800,
	dock_breaks_before: true,
});

const calendar = create_app_config({
	title: 'Kalender',
	resizable: true,
});

const calculator = create_app_config({
	title: 'Rechner',
	expandable: true,
	resizable: false,
	height: 250 * 1.414,
	width: 250,
});

const aboutMe = create_app_config({
	title: 'Über mich',
	resizable: true,
	height: 600,
	width: 800,
});

const projects = create_app_config({
	title: 'Projekte',
	resizable: true,
	height: 650,
	width: 900,
});

const mail = create_app_config({
	title: 'Mail',
	resizable: true,
	height: 500,
	width: 700,
});

const contact = create_app_config({
	title: 'Kontakt',
	resizable: true,
	height: 500,
	width: 400,
});

const notes = create_app_config({
	title: 'Notizen',
	resizable: true,
	height: 700,
	width: 600,
});

const terminal = create_app_config({
	title: 'Terminal',
	resizable: true,
	height: 500,
	width: 700,
});

const safari = create_app_config({
	title: 'Safari',
	resizable: true,
	height: 700,
	width: 1000,
});

const blog = create_app_config({
	title: 'Stylite Blog',
	resizable: true,
	height: 600,
	width: 700,
});

const github = create_app_config({
	title: 'GitHub',
	resizable: true,
	height: 600,
	width: 900,
});

const vscode = create_app_config({
	title: 'VS Code',
	resizable: true,
	height: 700,
	width: 1300,
});

const appstore = create_app_config({
	title: 'App Store',
	resizable: true,
	height: 650,
	width: 900,
});

const viewSource = create_app_config({
	title: `Quellcode`,
	resizable: true,
	should_open_window: false,
	external_action: () => window.open('https://github.com/wbonis/homepage', '_blank'),
	dock_breaks_before: true,
});

export const apps_config = {
	finder,
	'about-me': aboutMe,
	contact,
	github,
	blog,
	vscode,
	appstore,
	projects,
	mail,
	notes,
	terminal,
	safari,
	calendar,
	calculator,
	fotos,
	wallpapers,
	'view-source': viewSource,
};
