import { create_app_config } from '🍎/helpers/create-app-config.ts';

const finder = create_app_config({
	title: 'Finder',
	resizable: true,
	height: 600,
	width: 900,
});

const wallpapers = create_app_config({
	title: 'Wallpapers',
	resizable: true,
	height: 600,
	width: 800,
	dock_breaks_before: true,
});

const calendar = create_app_config({
	title: 'Calendar',
	resizable: true,
});

const calculator = create_app_config({
	title: 'Calculator',
	expandable: true,
	resizable: false,
	height: 250 * 1.414,
	width: 250,
});

const aboutMe = create_app_config({
	title: 'About Me',
	resizable: true,
	height: 600,
	width: 800,
});

const projects = create_app_config({
	title: 'Projects',
	resizable: true,
	height: 650,
	width: 900,
});

const contact = create_app_config({
	title: 'Contact',
	resizable: true,
	height: 500,
	width: 700,
});

const resume = create_app_config({
	title: 'Resume',
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

const viewSource = create_app_config({
	title: `View Source`,
	resizable: true,
	should_open_window: false,
	external_action: () => window.open('https://github.com/wbonis/homepage', '_blank'),
	dock_breaks_before: true,
});

export const apps_config = {
	finder,
	'about-me': aboutMe,
	projects,
	contact,
	resume,
	terminal,
	safari,
	blog,
	github,
	calendar,
	calculator,
	wallpapers,
	vscode,
	'view-source': viewSource,
};
