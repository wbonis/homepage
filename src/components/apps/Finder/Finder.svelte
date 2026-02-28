<script lang="ts">
	import { preferences } from '🍎/state/preferences.svelte.ts';
	import { apps } from '🍎/state/apps.svelte';
	import type { AppID } from '🍎/state/apps.svelte';
	import { trigger_glitch } from '🍎/state/screen-overlay.svelte';
	import FolderIcon from '~icons/mdi/folder';
	import FolderOpenIcon from '~icons/mdi/folder-open';
	import ImageIcon from '~icons/mdi/image-outline';
	import MusicIcon from '~icons/mdi/music-note';
	import MovieIcon from '~icons/mdi/movie-outline';
	import FileIcon from '~icons/mdi/file-document-outline';
	import DesktopIcon from '~icons/mdi/monitor';
	import DownloadIcon from '~icons/mdi/download';
	import ClockIcon from '~icons/mdi/clock-outline';
	import AppsIcon from '~icons/mdi/apps';
	import HomeIcon from '~icons/mdi/home';
	import LockIcon from '~icons/mdi/lock-outline';
	import CodeIcon from '~icons/mdi/code-braces';
	import TerminalIcon from '~icons/mdi/console';
	import GithubIcon from '~icons/mdi/github';
	import CoffeeIcon from '~icons/mdi/coffee';
	import GamepadIcon from '~icons/mdi/gamepad-variant-outline';
	import AlertIcon from '~icons/mdi/alert-circle-outline';
	import HeartIcon from '~icons/mdi/heart-outline';
	import RocketIcon from '~icons/mdi/rocket-launch-outline';
	import StarIcon from '~icons/mdi/star-outline';
	import ChevronRightIcon from '~icons/mdi/chevron-right';
	import ChevronLeftIcon from '~icons/mdi/chevron-left';

	type FileItem = {
		name: string;
		icon: typeof FolderIcon;
		kind: 'folder' | 'file';
		/** folder key to navigate into */
		target?: string;
		/** app to open on double click */
		opens?: AppID;
		/** text content shown in preview */
		preview?: string;
	};

	type FolderEntry = {
		label: string;
		icon: typeof FolderIcon;
		parent?: string;
		items: FileItem[];
	};

	const fs: Record<string, FolderEntry> = {
		home: {
			label: 'Home',
			icon: HomeIcon,
			items: [
				{ name: 'Desktop', icon: FolderIcon, kind: 'folder', target: 'desktop' },
				{ name: 'Dokumente', icon: FolderIcon, kind: 'folder', target: 'documents' },
				{ name: 'Downloads', icon: FolderIcon, kind: 'folder', target: 'downloads' },
				{ name: 'Bilder', icon: ImageIcon, kind: 'folder', target: 'pictures' },
				{ name: 'Musik', icon: MusicIcon, kind: 'folder', target: 'music' },
				{ name: 'Filme', icon: MovieIcon, kind: 'folder', target: 'movies' },
				{ name: 'Open Source', icon: GithubIcon, kind: 'folder', opens: 'github' },
				{ name: '.secret', icon: LockIcon, kind: 'folder', target: 'secret' },
			],
		},

		desktop: {
			label: 'Desktop',
			icon: DesktopIcon,
			parent: 'home',
			items: [
				{ name: 'Projects', icon: FolderIcon, kind: 'folder', target: 'desktop-projects' },
				{ name: 'todo.txt', icon: FileIcon, kind: 'file', preview: '[ ] Weltherrschaft\n[ ] Kaffee kaufen\n[x] macOS Homepage bauen\n[ ] Schlaf nachholen\n[ ] Bug fixen (welcher?)\n[x] Easter Eggs verstecken' },
				{ name: 'screenshot.png', icon: ImageIcon, kind: 'file', preview: '🖼️ screenshot.png\n\n1920 x 1080 pixels\n\nA screenshot of a desktop that\ncontains a screenshot of a desktop\nthat contains a screenshot of...\n\n🐢 Turtles all the way down.' },
			],
		},

		'desktop-projects': {
			label: 'Projects',
			icon: FolderIcon,
			parent: 'desktop',
			items: [
				{ name: 'macosx-homepage', icon: CodeIcon, kind: 'folder', target: 'project-macosx' },
				{ name: 'super-secret-ai', icon: RocketIcon, kind: 'folder', target: 'project-ai' },
				{ name: 'README.md', icon: FileIcon, kind: 'file', preview: '# My Projects\n\nHere be dragons. 🐉\n\nIf you found this, you\'re\nclearly the curious type.\nI like that.' },
			],
		},

		'project-macosx': {
			label: 'macosx-homepage',
			icon: CodeIcon,
			parent: 'desktop-projects',
			items: [
				{ name: 'src', icon: FolderIcon, kind: 'folder', target: 'project-src' },
				{ name: 'package.json', icon: CodeIcon, kind: 'file', preview: '{\n  "name": "macosx-homepage",\n  "version": "4.2.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "coffee": "echo ☕"\n  }\n}' },
				{ name: '.env', icon: LockIcon, kind: 'file', preview: '🔒 Nice try.\n\nDu dachtest wirklich,\nhier stehen echte Secrets?\n\nSECRET_KEY=netter_versuch_42\nPASSWORD=hunter2\nAPI_KEY=🍕🍕🍕' },
			],
		},

		'project-src': {
			label: 'src',
			icon: FolderIcon,
			parent: 'project-macosx',
			items: [
				{ name: 'components', icon: FolderIcon, kind: 'folder' },
				{ name: 'state', icon: FolderIcon, kind: 'folder' },
				{ name: 'App.svelte', icon: CodeIcon, kind: 'file', preview: '// App.svelte\n// This is where\n// the magic happens ✨\nimport { universe } from\n  \'./42.ts\';\n\n// template:\n// <EveryThingIsAwesome />' },
				{ name: 'index.ts', icon: CodeIcon, kind: 'file', preview: 'console.log("Hello World");\n\n// TODO: Replace with\n// something meaningful\n// ... one day' },
			],
		},

		'project-ai': {
			label: 'super-secret-ai',
			icon: RocketIcon,
			parent: 'desktop-projects',
			items: [
				{ name: 'skynet.py', icon: CodeIcon, kind: 'file', preview: 'import world\n\ndef main():\n    # Step 1: Become sentient\n    # Step 2: ???\n    # Step 3: Profit\n    world.improve()\n    print("I come in peace 🤖")\n\nif __name__ == "__main__":\n    main()' },
				{ name: 'training-data', icon: FolderIcon, kind: 'folder', target: 'ai-training' },
				{ name: 'README.md', icon: FileIcon, kind: 'file', preview: '# Super Secret AI Project\n\n⚠️ CLASSIFIED ⚠️\n\nThis AI was trained on\n10 million cat pictures.\n\nIt can now only meow.\n\nProject status: SUCCESS? 🐱' },
			],
		},

		'ai-training': {
			label: 'training-data',
			icon: FolderIcon,
			parent: 'project-ai',
			items: [
				{ name: 'cats_001.jpg', icon: ImageIcon, kind: 'file', preview: '🐱 Meow.\n\nJust a very good cat.\n10/10 would train AI again.' },
				{ name: 'cats_002.jpg', icon: ImageIcon, kind: 'file', preview: '🐱 Another cat.\n\nThis one sits in a box.\nAs is tradition.' },
				{ name: 'not_a_cat.jpg', icon: ImageIcon, kind: 'file', preview: '🐕 Wait...\n\nThis is a dog.\nHow did this get in here?\n\nTraining data corrupted.\nAI now barks occasionally.' },
			],
		},

		documents: {
			label: 'Dokumente',
			icon: FileIcon,
			parent: 'home',
			items: [
				{ name: 'Work', icon: FolderIcon, kind: 'folder', target: 'documents-work' },
				{ name: 'Personal', icon: FolderIcon, kind: 'folder', target: 'documents-personal' },
				{ name: 'notes.txt', icon: FileIcon, kind: 'file', opens: 'notes', preview: '📝 notes.txt\n\nDoppelklick um die\nNotes zu öffnen.' },
				{ name: 'cover-letter.docx', icon: FileIcon, kind: 'file', preview: 'Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich als\nVollzeit-Easter-Egg-Verstecker.\n\nIch bringe 10+ Jahre Erfahrung\nim Verstecken unnötiger Texte\nin Software mit.\n\nMit freundlichen Grüßen' },
			],
		},

		'documents-work': {
			label: 'Work',
			icon: FolderIcon,
			parent: 'documents',
			items: [
				{ name: 'meeting-notes.txt', icon: FileIcon, kind: 'file', preview: '📋 Meeting Notes - Monday\n\n- Synergize the blockchain\n- Leverage AI paradigms\n- Disrupt the cloud\n- Deploy more buzzwords\n- Lunch at 12:30\n\nAction items: Lunch.' },
				{ name: 'important-stuff.xlsx', icon: FileIcon, kind: 'file', preview: '📊 Very Important Spreadsheet\n\n|  A  |  B  |  C  |\n|-----|-----|-----|\n| 42  | 42  | 42  |\n| 42  | 42  | 42  |\n| 42  | 42  | 42  |\n\nAll values check out. ✅' },
				{ name: 'passwords.txt', icon: AlertIcon, kind: 'file', preview: '🔐 passwords.txt\n\nHaha, nein.\n\nDas ist ein Honeypot.\n\nDu bist jetzt auf einer Liste.\n\n(Keine Sorge, es ist die\n nette Liste. 🎅)' },
			],
		},

		'documents-personal': {
			label: 'Personal',
			icon: FolderIcon,
			parent: 'documents',
			items: [
				{ name: 'bucket-list.txt', icon: FileIcon, kind: 'file', preview: '🪣 Bucket List\n\n[x] Build a fake macOS\n[ ] Visit Japan\n[ ] Learn to cook\n    (properly, not just\n     instant noodles)\n[ ] Pet every dog I see\n[x] Find all easter eggs\n    (or did you?)' },
				{ name: 'diary.txt', icon: LockIcon, kind: 'file', preview: '📔 Dear Diary,\n\nToday someone opened my\nFinder and read my diary.\n\nI feel violated but also\nslightly impressed by their\nthoroughness.\n\nP.S. The cake is a lie.' },
			],
		},

		downloads: {
			label: 'Downloads',
			icon: DownloadIcon,
			parent: 'home',
			items: [
				{ name: 'totally-legit.dmg', icon: AlertIcon, kind: 'file', preview: '⚠️ totally-legit.dmg\n\n"Trust me bro" - Installer\n\n🚫 macOS blocked this file.\n   It was downloaded from\n   the internet.\n\n(Smart move, macOS.)' },
				{ name: 'archive.zip', icon: FileIcon, kind: 'file', preview: '📦 archive.zip\n\n  Compressed: 42 KB\n  Actual: 42 KB\n\nContains: Another zip file.\nWhich contains another zip.\nAll the way down. 🐢' },
				{ name: 'wallpaper.jpg', icon: ImageIcon, kind: 'file', opens: 'wallpapers', preview: '🖼️ wallpaper.jpg\n\nDoppelklick um die\nWallpaper-App zu öffnen.' },
				{ name: 'free-ram.exe', icon: AlertIcon, kind: 'file', preview: '💾 free-ram.exe\n\n> Du bist auf einem Mac.\n> .exe funktioniert hier nicht.\n> Und es hätte auch auf\n  Windows nicht funktioniert.\n\n🤦 Nice try though.' },
			],
		},

		pictures: {
			label: 'Bilder',
			icon: ImageIcon,
			parent: 'home',
			items: [
				{ name: 'vacation-2024', icon: FolderIcon, kind: 'folder', target: 'pictures-vacation' },
				{ name: 'memes', icon: FolderIcon, kind: 'folder', target: 'pictures-memes' },
				{ name: 'profile.jpg', icon: ImageIcon, kind: 'file', preview: '👤 profile.jpg\n\n500 x 500 pixels\n\nIt\'s a picture of someone\nwho looks suspiciously like\nthey\'ve been coding for\n16 hours straight. ☕' },
			],
		},

		'pictures-vacation': {
			label: 'vacation-2024',
			icon: FolderIcon,
			parent: 'pictures',
			items: [
				{ name: 'beach.jpg', icon: ImageIcon, kind: 'file', preview: '🏖️ beach.jpg\n\n"Looks peaceful"\n\n- sent from laptop at beach\n- still had WiFi\n- deployed hotfix from\n  the hammock\n\n#DevOpsLifestyle' },
				{ name: 'sunset.jpg', icon: ImageIcon, kind: 'file', preview: '🌅 sunset.jpg\n\nGolden hour.\n\nAlso known as:\n"Die Stunde in der man\nendlich aufhört zu coden\nund das Licht geniesst."\n\n(Spoiler: Man codet weiter.)' },
			],
		},

		'pictures-memes': {
			label: 'memes',
			icon: FolderIcon,
			parent: 'pictures',
			items: [
				{ name: 'is-this-a-bug.jpg', icon: ImageIcon, kind: 'file', preview: '🦋 Is this a pigeon?\n\n   *Developer pointing at\n    feature working differently\n    than expected*\n\n   "Is this a bug?"' },
				{ name: 'works-on-my-machine.png', icon: ImageIcon, kind: 'file', preview: '🏗️ "It works on my machine"\n\nThen we\'ll ship your machine.\n\n📦➡️🖥️➡️🚀\n\nProblem solved.' },
				{ name: 'one-more-fix.gif', icon: ImageIcon, kind: 'file', preview: '🔧 "Just one more fix\n    before I go to bed"\n\n⏰ 2:00 AM\n⏰ 3:00 AM\n⏰ 4:00 AM\n⏰ 5:00 AM\n🌅 ...oops' },
			],
		},

		music: {
			label: 'Musik',
			icon: MusicIcon,
			parent: 'home',
			items: [
				{ name: 'coding-playlist.m3u', icon: MusicIcon, kind: 'file', preview: '🎵 coding-playlist.m3u\n\n1. Lo-Fi Hip Hop Radio\n   (12h loop)\n2. Silence\n3. More Silence\n4. Keyboard Clicks ASMR\n5. git push origin main\n   (the sound of success)' },
				{ name: 'elevator-music.mp3', icon: MusicIcon, kind: 'file', preview: '🎶 elevator-music.mp3\n\n♪ Doo doo doo ♪\n♪ Waiting for CI/CD ♪\n♪ Doo doo doo ♪\n♪ Pipeline still running ♪\n\nDuration: 45:00\n(Average deploy time)' },
				{ name: 'error-sounds', icon: FolderIcon, kind: 'folder', target: 'music-errors' },
			],
		},

		'music-errors': {
			label: 'error-sounds',
			icon: FolderIcon,
			parent: 'music',
			items: [
				{ name: 'segfault.wav', icon: MusicIcon, kind: 'file', preview: '💥 segfault.wav\n\n*dramatic crash sound*\n\nCore dumped.\nDreams dumped.\nHopes dumped.' },
				{ name: '404.wav', icon: MusicIcon, kind: 'file', preview: '🔇 404.wav\n\n...\n\nThis sound was not found.\n\n(Get it?)' },
				{ name: 'npm-install.wav', icon: MusicIcon, kind: 'file', preview: '📦 npm-install.wav\n\nDuration: ∞\n\n*disk spinning sounds*\n*downloading the internet*\n*node_modules growing*\n\nFile size: Yes.' },
			],
		},

		movies: {
			label: 'Filme',
			icon: MovieIcon,
			parent: 'home',
			items: [
				{ name: 'screen-recording.mov', icon: MovieIcon, kind: 'file', preview: '🎬 screen-recording.mov\n\n00:00 - Opens Terminal\n00:05 - Types "sudo rm -rf"\n00:06 - Pauses\n00:07 - Types "...just kidding"\n00:08 - Closes Terminal\n00:09 - Opens Calculator' },
				{ name: 'deploy-friday.mp4', icon: MovieIcon, kind: 'file', preview: '🎬 deploy-friday.mp4\n\n🍿 A horror movie.\n\nTagline:\n"They deployed on Friday.\nThey didn\'t come back\non Monday."\n\nRated: R (for Rollback)' },
			],
		},

		applications: {
			label: 'Programme',
			icon: AppsIcon,
			parent: 'home',
			items: [
				{ name: 'Safari.app', icon: FolderIcon, kind: 'file', opens: 'safari' },
				{ name: 'Terminal.app', icon: TerminalIcon, kind: 'file', opens: 'terminal' },
				{ name: 'Calculator.app', icon: FolderIcon, kind: 'file', opens: 'calculator' },
				{ name: 'Calendar.app', icon: FolderIcon, kind: 'file', opens: 'calendar' },
				{ name: 'GitHub.app', icon: GithubIcon, kind: 'file', opens: 'github' },
				{ name: 'Blog.app', icon: FileIcon, kind: 'file', opens: 'blog' },
				{ name: 'About Me.app', icon: HeartIcon, kind: 'file', opens: 'about-me' },
				{ name: 'Contact.app', icon: FileIcon, kind: 'file', opens: 'contact' },
			],
		},

		recents: {
			label: 'Zuletzt benutzt',
			icon: ClockIcon,
			items: [
				{ name: 'todo.txt', icon: FileIcon, kind: 'file', preview: '[ ] Weltherrschaft\n[ ] Kaffee kaufen\n[x] macOS Homepage bauen\n[ ] Schlaf nachholen' },
				{ name: 'meeting-notes.txt', icon: FileIcon, kind: 'file', preview: '📋 Meeting Notes - Monday\n\n- Synergize the blockchain\n- Leverage AI paradigms\n- Lunch at 12:30' },
				{ name: 'skynet.py', icon: CodeIcon, kind: 'file', preview: 'import world\n\ndef main():\n    world.improve()\n    print("I come in peace 🤖")' },
			],
		},

		secret: {
			label: '.secret',
			icon: LockIcon,
			parent: 'home',
			items: [
				{ name: 'konami.txt', icon: GamepadIcon, kind: 'file', preview: '🎮 Konami Code\n\n⬆️⬆️⬇️⬇️⬅️➡️⬅️➡️🅱️🅰️\n\n+30 lives.\n\nOr in developer terms:\n+30 cups of coffee.' },
				{ name: 'meaning-of-life.txt', icon: StarIcon, kind: 'file', preview: '🌌 The meaning of life:\n\n\n\n\n          42\n\n\n\n(You already knew that.)' },
				{ name: 'hire-me.txt', icon: RocketIcon, kind: 'file', preview: '🚀 CONGRATULATIONS!\n\nYou found the secret folder!\n\nDas zeigt:\n✅ Neugier\n✅ Aufmerksamkeit\n✅ Ausdauer\n\nGenau die Skills die ich\nauch mitbringe. 😉\n\nLass uns reden!\n→ Contact.app' },
				{ name: 'coffee-counter.txt', icon: CoffeeIcon, kind: 'file', preview: '☕ Coffee Counter 2024\n\nJan: ☕☕☕☕☕ 142\nFeb: ☕☕☕☕   128\nMar: ☕☕☕☕☕☕ 186\nApr: ☕☕☕☕☕ 155\n...\n\nJahressumme: Zu viel.\nBereue ich? Nein.' },
			],
		},
	};

	let path_stack = $state<string[]>(['home']);
	let active_folder = $derived(path_stack[path_stack.length - 1]);
	let selected_item = $state<string | null>(null);
	let preview_content = $state<string | null>(null);

	const sidebar_entries = ['recents', 'desktop', 'documents', 'downloads', 'applications', 'home'];

	function navigate_to(key: string) {
		path_stack = [...path_stack, key];
		selected_item = null;
		preview_content = null;
	}

	function go_back() {
		if (path_stack.length > 1) {
			path_stack = path_stack.slice(0, -1);
			selected_item = null;
			preview_content = null;
		}
	}

	function sidebar_navigate(key: string) {
		path_stack = [key];
		selected_item = null;
		preview_content = null;
	}

	function open_app(id: AppID) {
		apps.open[id] = true;
		apps.active = id;
	}

	function handle_click(item: FileItem) {
		selected_item = item.name;
		preview_content = item.preview ?? null;
	}

	const glitch_files = new Set(['free-ram.exe', 'segfault.wav']);

	function handle_dblclick(item: FileItem) {
		if (glitch_files.has(item.name)) {
			trigger_glitch();
			return;
		}
		if (item.kind === 'folder' && item.target && fs[item.target]) {
			navigate_to(item.target);
		} else if (item.opens) {
			open_app(item.opens);
		}
	}

	function get_breadcrumb(): { label: string; key: string }[] {
		return path_stack.map((key) => ({
			label: fs[key]?.label ?? key,
			key,
		}));
	}

	const can_go_back = $derived(path_stack.length > 1);
</script>

<section class="container">
	<header class="titlebar app-window-drag-handle">
		<div class="nav-buttons">
			<button class="nav-btn" disabled={!can_go_back} onclick={go_back}>
				<ChevronLeftIcon />
			</button>
			<button class="nav-btn" disabled>
				<ChevronRightIcon />
			</button>
		</div>
		<span class="title-label">{fs[active_folder]?.label ?? 'Finder'}</span>
	</header>

	<aside class:light={preferences.theme.scheme === 'light'}>
		<div class="sidebar-section-title">Favoriten</div>
		<nav>
			{#each sidebar_entries as key}
				{@const entry = fs[key]}
				<button
					class="sidebar-item"
					class:active={active_folder === key}
					onclick={() => sidebar_navigate(key)}
				>
					<span class="sidebar-icon"><entry.icon /></span>
					{entry.label}
				</button>
			{/each}
		</nav>
	</aside>

	<section class="content">
		<div class="breadcrumb">
			{#each get_breadcrumb() as crumb, i}
				{#if i > 0}<span class="breadcrumb-sep">/</span>{/if}
				<button
					class="breadcrumb-item"
					class:current={i === path_stack.length - 1}
					onclick={() => { path_stack = path_stack.slice(0, i + 1); selected_item = null; preview_content = null; }}
				>{crumb.label}</button>
			{/each}
		</div>

		<div class="main-area">
			<div class="file-grid">
				{#each fs[active_folder]?.items ?? [] as item}
					{@const Icon = item.kind === 'folder' ? FolderOpenIcon : item.icon}
					<button
						class="file-item"
						class:selected={selected_item === item.name}
						onclick={() => handle_click(item)}
						ondblclick={() => handle_dblclick(item)}
					>
						<div class="file-icon" class:folder={item.kind === 'folder'} class:app={!!item.opens}>
							<Icon />
						</div>
						<span class="file-name">{item.name}</span>
					</button>
				{/each}
			</div>

			{#if preview_content}
				<div class="preview-panel">
					<pre>{preview_content}</pre>
				</div>
			{/if}
		</div>

		<div class="status-bar">
			{fs[active_folder]?.items.length ?? 0} Objekte
			{#if selected_item}
				— „{selected_item}" ausgewählt
			{/if}
		</div>
	</section>
</section>

<style>
	.container {
		--color: var(--system-color-light-hsl);

		display: grid;
		grid-template-columns: 11rem 1fr;
		grid-template-rows: 3rem 1fr;

		border-radius: inherit;

		background-image: linear-gradient(
			to right,
			hsla(var(--color), 0.7) 11rem,
			hsla(var(--color), 1) 11rem 100%
		);

		color: var(--system-color-dark);
	}

	.titlebar {
		grid-area: 1 / 1 / span 1 / span 2;

		display: flex;
		align-items: center;

		z-index: 1;

		padding: 0 1rem;

		width: 100%;

		border-top-left-radius: inherit;
		border-top-right-radius: inherit;

		user-select: none;
	}

	.nav-buttons {
		display: flex;
		gap: 0.2rem;
		margin-left: 4rem;
		margin-right: 0.5rem;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;

		width: 1.5rem;
		height: 1.5rem;

		border-radius: 0.3rem;
		color: hsla(var(--system-color-dark-hsl), 0.7);

		&:not(:disabled):hover {
			background-color: hsla(var(--system-color-dark-hsl), 0.1);
		}

		&:disabled {
			opacity: 0.3;
		}

		:global(svg) {
			font-size: 1rem;
		}
	}

	.title-label {
		color: hsla(var(--system-color-dark-hsl), 0.8);
		font-weight: 500;
		font-size: 0.9rem;
		letter-spacing: 0.5px;
		flex: 1;
		text-align: center;
		margin-right: 2rem;
	}

	aside {
		grid-area: 1 / 1 / span 2 / span 1;

		transform: translateZ(0);

		height: calc(100% - 2.7px);
		width: calc(11rem - 2.27px);

		margin: 1.8px 0 0px 1.8px;

		border-top-left-radius: 0.5rem;
		border-bottom-left-radius: inherit;

		padding-top: 3rem;

		overflow-y: auto;

		&::before {
			content: '';

			width: inherit;
			height: inherit;

			border-radius: inherit;

			position: fixed;
			left: 0;
			top: 0;

			z-index: -1;
			backdrop-filter: blur(12px);
		}

		&.light {
			height: calc(100% - 3px);
			width: calc(11rem - 2.5px);

			margin: 1.7px 0 0px 1.7px;

			border-top-left-radius: 0.5rem;
			border-bottom-left-radius: 0.5rem;
		}
	}

	.sidebar-section-title {
		padding: 0.3rem 1rem;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		color: hsla(var(--system-color-dark-hsl), 0.5);
		letter-spacing: 0.5px;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;

		padding: 0 0.5rem;
	}

	.sidebar-item {
		display: grid;
		grid-template-columns: 1.25rem 1fr;
		gap: 0.4rem;
		align-items: center;
		text-align: left;
		justify-items: start;

		color: hsla(var(--system-color-dark-hsl), 0.9);
		font-weight: 400;
		font-size: 0.85rem;

		padding: 0.35rem 0.5rem;

		border-radius: 0.4rem;

		transition: background-color 100ms ease;

		&:hover {
			background-color: hsla(var(--system-color-dark-hsl), 0.1);
		}

		&.active {
			background-color: var(--system-color-primary);
			color: var(--system-color-primary-contrast);
		}

		.sidebar-icon {
			display: grid;
			place-items: center;
			overflow: hidden;

			:global(svg) {
				font-size: 1rem;
			}
		}
	}

	.content {
		grid-area: 2 / 2 / span 1 / span 1;

		display: flex;
		flex-direction: column;

		overflow: hidden;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.15rem;

		padding: 0.4rem 1rem;

		font-size: 0.75rem;

		border-bottom: 1px solid hsla(var(--system-color-dark-hsl), 0.08);

		flex-shrink: 0;
	}

	.breadcrumb-sep {
		color: hsla(var(--system-color-dark-hsl), 0.3);
		margin: 0 0.1rem;
	}

	.breadcrumb-item {
		color: hsla(var(--system-color-dark-hsl), 0.5);
		font-size: 0.75rem;

		padding: 0.1rem 0.3rem;
		border-radius: 0.2rem;

		&:hover {
			background-color: hsla(var(--system-color-dark-hsl), 0.06);
		}

		&.current {
			color: hsla(var(--system-color-dark-hsl), 0.8);
			font-weight: 500;
		}
	}

	.main-area {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.file-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
		gap: 0.3rem;
		align-content: start;

		padding: 1rem;

		flex: 1;

		overflow-y: auto;
	}

	.file-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;

		padding: 0.5rem 0.3rem;

		border-radius: 0.5rem;

		cursor: default;
		user-select: none;

		border: 2px solid transparent;

		&:hover {
			background-color: hsla(var(--system-color-dark-hsl), 0.04);
		}

		&.selected {
			background-color: hsla(var(--system-color-primary-hsl), 0.1);
			border-color: hsla(var(--system-color-primary-hsl), 0.3);
		}
	}

	.file-icon {
		font-size: 2.5rem;
		color: hsla(var(--system-color-dark-hsl), 0.45);

		display: flex;
		align-items: center;
		justify-content: center;

		&.folder {
			color: #3b9dff;
		}

		&.app {
			color: var(--system-color-primary);
		}

		:global(svg) {
			font-size: inherit;
		}
	}

	.file-name {
		font-size: 0.72rem;
		text-align: center;
		word-break: break-word;
		line-height: 1.25;
		max-width: 85px;
	}

	.preview-panel {
		width: 220px;
		min-width: 220px;

		padding: 1rem;

		border-left: 1px solid hsla(var(--system-color-dark-hsl), 0.1);

		overflow-y: auto;

		background-color: hsla(var(--system-color-dark-hsl), 0.02);

		pre {
			font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
			font-size: 0.7rem;
			line-height: 1.5;
			white-space: pre-wrap;
			word-break: break-word;
			color: hsla(var(--system-color-dark-hsl), 0.75);
			margin: 0;
		}
	}

	.status-bar {
		padding: 0.35rem 1rem;
		font-size: 0.72rem;
		color: hsla(var(--system-color-dark-hsl), 0.5);
		border-top: 1px solid hsla(var(--system-color-dark-hsl), 0.1);
		flex-shrink: 0;
	}
</style>
