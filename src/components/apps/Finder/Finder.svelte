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

	// Preview images for image-type files (imported via vite-imagetools at thumbnail size)
	const previewImages = import.meta.glob(
		[
			'../../assets/wallpapers/lake-3.jpg',
			'../../assets/wallpapers/39.jpg',
			'../../assets/wallpapers/49.jpg',
			'../../assets/wallpapers/big-sur-1.jpg',
			'../../assets/wallpapers/58.jpg',
			'../../assets/wallpapers/56.jpg',
			'../../assets/wallpapers/44.jpg',
			'../../assets/wallpapers/62.jpg',
			'../../assets/wallpapers/41.jpg',
			'../../assets/wallpapers/52.jpg',
		],
		{
			eager: true,
			query: { w: 400, format: 'webp' },
		},
	) as Record<string, { default: string }>;

	function img(name: string): string {
		const match = Object.entries(previewImages).find(([path]) => path.endsWith(`/${name}`));
		return match ? match[1].default : '';
	}

	const imgBeach = img('lake-3.jpg');
	const imgSunset = img('39.jpg');
	const imgProfile = img('49.jpg');
	const imgScreenshot = img('big-sur-1.jpg');
	const imgCat1 = img('58.jpg');
	const imgCat2 = img('56.jpg');
	const imgDog = img('44.jpg');
	const imgBug = img('62.jpg');
	const imgWorksMachine = img('41.jpg');
	const imgOneMoreFix = img('52.jpg');

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
		/** image URL shown in preview panel */
		previewImage?: string;
		/** custom double-click action */
		action?: () => void;
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
				{ name: 'todo.txt', icon: FileIcon, kind: 'file', preview: '[ ] Weltherrschaft\n[ ] Kaffee kaufen\n[x] macOS Homepage bauen\n[ ] Schlaf nachholen\n[ ] Bug fixen (welcher?)\n[x] Easter Eggs verstecken', action: () => open_app('notes') },
				{ name: 'screenshot.png', icon: ImageIcon, kind: 'file', previewImage: imgScreenshot, preview: '🖼️ screenshot.png\n\n1920 x 1080 pixels\n\nA screenshot of a desktop that\ncontains a screenshot of a desktop\nthat contains a screenshot of...\n\n🐢 Turtles all the way down.', action: () => window.open('https://www.bonis.de', '_blank') },
			],
		},

		'desktop-projects': {
			label: 'Projects',
			icon: FolderIcon,
			parent: 'desktop',
			items: [
				{ name: 'macosx-homepage', icon: CodeIcon, kind: 'folder', target: 'project-macosx' },
				{ name: 'super-secret-ai', icon: RocketIcon, kind: 'folder', target: 'project-ai' },
				{ name: 'README.md', icon: FileIcon, kind: 'file', preview: '# My Projects\n\nHere be dragons. 🐉\n\nIf you found this, you\'re\nclearly the curious type.\nI like that.', action: () => window.open('https://github.com/wbonis/homepage', '_blank') },
			],
		},

		'project-macosx': {
			label: 'macosx-homepage',
			icon: CodeIcon,
			parent: 'desktop-projects',
			items: [
				{ name: 'src', icon: FolderIcon, kind: 'folder', target: 'project-src' },
				{ name: 'package.json', icon: CodeIcon, kind: 'file', preview: '{\n  "name": "macosx-homepage",\n  "version": "4.2.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "coffee": "echo ☕"\n  }\n}', action: () => window.open('https://github.com/wbonis/homepage', '_blank') },
				{ name: '.env', icon: LockIcon, kind: 'file', preview: '🔒 Nice try.\n\nDu dachtest wirklich,\nhier stehen echte Secrets?\n\nSECRET_KEY=netter_versuch_42\nPASSWORD=hunter2\nAPI_KEY=🍕🍕🍕', action: () => { alert('🔒 Access Denied — Nice try!'); open_app('terminal'); } },
			],
		},

		'project-src': {
			label: 'src',
			icon: FolderIcon,
			parent: 'project-macosx',
			items: [
				{ name: 'components', icon: FolderIcon, kind: 'folder', target: 'project-src' },
				{ name: 'state', icon: FolderIcon, kind: 'folder', target: 'project-src' },
				{ name: 'App.svelte', icon: CodeIcon, kind: 'file', preview: '// App.svelte\n// This is where\n// the magic happens ✨\nimport { universe } from\n  \'./42.ts\';\n\n// template:\n// <EveryThingIsAwesome />', action: () => window.open('https://github.com/wbonis/homepage', '_blank') },
				{ name: 'index.ts', icon: CodeIcon, kind: 'file', preview: 'console.log("Hello World");\n\n// TODO: Replace with\n// something meaningful\n// ... one day', action: () => window.open('https://github.com/wbonis/homepage', '_blank') },
			],
		},

		'project-ai': {
			label: 'super-secret-ai',
			icon: RocketIcon,
			parent: 'desktop-projects',
			items: [
				{ name: 'skynet.py', icon: CodeIcon, kind: 'file', preview: 'import world\n\ndef main():\n    # Step 1: Become sentient\n    # Step 2: ???\n    # Step 3: Profit\n    world.improve()\n    print("I come in peace 🤖")\n\nif __name__ == "__main__":\n    main()', action: () => open_app('terminal') },
				{ name: 'training-data', icon: FolderIcon, kind: 'folder', target: 'ai-training' },
				{ name: 'README.md', icon: FileIcon, kind: 'file', preview: '# Super Secret AI Project\n\n⚠️ CLASSIFIED ⚠️\n\nThis AI was trained on\n10 million cat pictures.\n\nIt can now only meow.\n\nProject status: SUCCESS? 🐱', action: () => window.open('https://github.com/wbonis/homepage', '_blank') },
			],
		},

		'ai-training': {
			label: 'training-data',
			icon: FolderIcon,
			parent: 'project-ai',
			items: [
				{ name: 'cats_001.jpg', icon: ImageIcon, kind: 'file', previewImage: imgCat1, preview: '🐱 Meow.\n\nJust a very good cat.\n10/10 would train AI again.', action: () => open_app('fotos') },
				{ name: 'cats_002.jpg', icon: ImageIcon, kind: 'file', previewImage: imgCat2, preview: '🐱 Another cat.\n\nThis one sits in a box.\nAs is tradition.', action: () => open_app('fotos') },
				{ name: 'not_a_cat.jpg', icon: ImageIcon, kind: 'file', previewImage: imgDog, preview: '🐕 Wait...\n\nThis is a dog.\nHow did this get in here?\n\nTraining data corrupted.\nAI now barks occasionally.', action: () => open_app('fotos') },
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
				{ name: 'cover-letter.docx', icon: FileIcon, kind: 'file', preview: 'Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich als\nVollzeit-Easter-Egg-Verstecker.\n\nIch bringe 10+ Jahre Erfahrung\nim Verstecken unnötiger Texte\nin Software mit.\n\nMit freundlichen Grüßen', action: () => open_app('contact') },
			],
		},

		'documents-work': {
			label: 'Work',
			icon: FolderIcon,
			parent: 'documents',
			items: [
				{ name: 'meeting-notes.txt', icon: FileIcon, kind: 'file', preview: '📋 Meeting Notes - Monday\n\n- Synergize the blockchain\n- Leverage AI paradigms\n- Disrupt the cloud\n- Deploy more buzzwords\n- Lunch at 12:30\n\nAction items: Lunch.', action: () => open_app('notes') },
				{ name: 'important-stuff.xlsx', icon: FileIcon, kind: 'file', preview: '📊 Very Important Spreadsheet\n\n|  A  |  B  |  C  |\n|-----|-----|-----|\n| 42  | 42  | 42  |\n| 42  | 42  | 42  |\n| 42  | 42  | 42  |\n\nAll values check out. ✅', action: () => open_app('calculator') },
				{ name: 'passwords.txt', icon: AlertIcon, kind: 'file', preview: '🔐 passwords.txt\n\nHaha, nein.\n\nDas ist ein Honeypot.\n\nDu bist jetzt auf einer Liste.\n\n(Keine Sorge, es ist die\n nette Liste. 🎅)', action: () => alert('🔐 Zugriff verweigert — Du stehst jetzt auf der Liste!') },
			],
		},

		'documents-personal': {
			label: 'Personal',
			icon: FolderIcon,
			parent: 'documents',
			items: [
				{ name: 'bucket-list.txt', icon: FileIcon, kind: 'file', preview: '🪣 Bucket List\n\n[x] Build a fake macOS\n[ ] Visit Japan\n[ ] Learn to cook\n    (properly, not just\n     instant noodles)\n[ ] Pet every dog I see\n[x] Find all easter eggs\n    (or did you?)', action: () => open_app('notes') },
				{ name: 'diary.txt', icon: LockIcon, kind: 'file', preview: '📔 Dear Diary,\n\nToday someone opened my\nFinder and read my diary.\n\nI feel violated but also\nslightly impressed by their\nthoroughness.\n\nP.S. The cake is a lie.', action: () => alert('📔 Diese Datei ist privat! ...aber danke für das Interesse.') },
			],
		},

		downloads: {
			label: 'Downloads',
			icon: DownloadIcon,
			parent: 'home',
			items: [
				{ name: 'totally-legit.dmg', icon: AlertIcon, kind: 'file', preview: '⚠️ totally-legit.dmg\n\n"Trust me bro" - Installer\n\n🚫 macOS blocked this file.\n   It was downloaded from\n   the internet.\n\n(Smart move, macOS.)', action: () => alert('⚠️ macOS hat diese Datei blockiert.\nSie wurde aus dem Internet geladen.\n\nUnd das ist auch gut so.') },
				{ name: 'archive.zip', icon: FileIcon, kind: 'file', preview: '📦 archive.zip\n\n  Compressed: 42 KB\n  Actual: 42 KB\n\nContains: Another zip file.\nWhich contains another zip.\nAll the way down. 🐢', action: () => alert('📦 Entpacken fehlgeschlagen — Unendliche Rekursion erkannt.\n\narchive.zip → archive.zip → archive.zip → ...') },
				{ name: 'wallpaper.jpg', icon: ImageIcon, kind: 'file', opens: 'wallpapers', previewImage: imgScreenshot, preview: '🖼️ wallpaper.jpg\n\nDoppelklick um die\nWallpaper-App zu öffnen.' },
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
				{ name: 'profile.jpg', icon: ImageIcon, kind: 'file', previewImage: imgProfile, preview: '👤 profile.jpg\n\n500 x 500 pixels\n\nIt\'s a picture of someone\nwho looks suspiciously like\nthey\'ve been coding for\n16 hours straight. ☕', action: () => open_app('about-me') },
			],
		},

		'pictures-vacation': {
			label: 'vacation-2024',
			icon: FolderIcon,
			parent: 'pictures',
			items: [
				{ name: 'beach.jpg', icon: ImageIcon, kind: 'file', previewImage: imgBeach, preview: '🏖️ beach.jpg\n\n"Looks peaceful"\n\n- sent from laptop at beach\n- still had WiFi\n- deployed hotfix from\n  the hammock\n\n#DevOpsLifestyle', action: () => open_app('fotos') },
				{ name: 'sunset.jpg', icon: ImageIcon, kind: 'file', previewImage: imgSunset, preview: '🌅 sunset.jpg\n\nGolden hour.\n\nAlso known as:\n"Die Stunde in der man\nendlich aufhört zu coden\nund das Licht geniesst."\n\n(Spoiler: Man codet weiter.)', action: () => open_app('fotos') },
			],
		},

		'pictures-memes': {
			label: 'memes',
			icon: FolderIcon,
			parent: 'pictures',
			items: [
				{ name: 'is-this-a-bug.jpg', icon: ImageIcon, kind: 'file', previewImage: imgBug, preview: '🦋 Is this a pigeon?\n\n   *Developer pointing at\n    feature working differently\n    than expected*\n\n   "Is this a bug?"', action: () => open_app('fotos') },
				{ name: 'works-on-my-machine.png', icon: ImageIcon, kind: 'file', previewImage: imgWorksMachine, preview: '🏗️ "It works on my machine"\n\nThen we\'ll ship your machine.\n\n📦➡️🖥️➡️🚀\n\nProblem solved.', action: () => open_app('fotos') },
				{ name: 'one-more-fix.gif', icon: ImageIcon, kind: 'file', previewImage: imgOneMoreFix, preview: '🔧 "Just one more fix\n    before I go to bed"\n\n⏰ 2:00 AM\n⏰ 3:00 AM\n⏰ 4:00 AM\n⏰ 5:00 AM\n🌅 ...oops', action: () => open_app('fotos') },
			],
		},

		music: {
			label: 'Musik',
			icon: MusicIcon,
			parent: 'home',
			items: [
				{ name: 'coding-playlist.m3u', icon: MusicIcon, kind: 'file', preview: '🎵 coding-playlist.m3u\n\n1. Lo-Fi Hip Hop Radio\n   (12h loop)\n2. Silence\n3. More Silence\n4. Keyboard Clicks ASMR\n5. git push origin main\n   (the sound of success)', action: () => window.open('https://www.youtube.com/watch?v=jfKfPfyJRdk', '_blank') },
				{ name: 'elevator-music.mp3', icon: MusicIcon, kind: 'file', preview: '🎶 elevator-music.mp3\n\n♪ Doo doo doo ♪\n♪ Waiting for CI/CD ♪\n♪ Doo doo doo ♪\n♪ Pipeline still running ♪\n\nDuration: 45:00\n(Average deploy time)', action: () => alert('🎶 Playing elevator-music.mp3...\n\n♪ Doo doo doo ♪\n♪ Bitte warten... ♪\n♪ Ihr CI/CD-Pipeline ist uns wichtig ♪') },
				{ name: 'error-sounds', icon: FolderIcon, kind: 'folder', target: 'music-errors' },
			],
		},

		'music-errors': {
			label: 'error-sounds',
			icon: FolderIcon,
			parent: 'music',
			items: [
				{ name: 'segfault.wav', icon: MusicIcon, kind: 'file', preview: '💥 segfault.wav\n\n*dramatic crash sound*\n\nCore dumped.\nDreams dumped.\nHopes dumped.' },
				{ name: '404.wav', icon: MusicIcon, kind: 'file', preview: '🔇 404.wav\n\n...\n\nThis sound was not found.\n\n(Get it?)', action: () => alert('🔇 404 — Sound Not Found\n\nDer Sound, den du suchst, existiert nicht.\nGenau wie deine Work-Life-Balance.') },
				{ name: 'npm-install.wav', icon: MusicIcon, kind: 'file', preview: '📦 npm-install.wav\n\nDuration: ∞\n\n*disk spinning sounds*\n*downloading the internet*\n*node_modules growing*\n\nFile size: Yes.', action: () => alert('📦 Installing...\n\nnode_modules wächst...\n████░░░░░░ 42%\n\nGeschätzte Zeit: ∞') },
			],
		},

		movies: {
			label: 'Filme',
			icon: MovieIcon,
			parent: 'home',
			items: [
				{ name: 'screen-recording.mov', icon: MovieIcon, kind: 'file', preview: '🎬 screen-recording.mov\n\n00:00 - Opens Terminal\n00:05 - Types "sudo rm -rf"\n00:06 - Pauses\n00:07 - Types "...just kidding"\n00:08 - Closes Terminal\n00:09 - Opens Calculator', action: () => open_app('terminal') },
				{ name: 'deploy-friday.mp4', icon: MovieIcon, kind: 'file', preview: '🎬 deploy-friday.mp4\n\n🍿 A horror movie.\n\nTagline:\n"They deployed on Friday.\nThey didn\'t come back\non Monday."\n\nRated: R (for Rollback)', action: () => alert('🎬 deploy-friday.mp4\n\n⚠️ WARNUNG: Dieser Film enthält Szenen,\ndie für DevOps-Engineers verstörend sein können.\n\nFSK: Nicht freigegeben für Freitag-Deployments.') },
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
				{ name: 'todo.txt', icon: FileIcon, kind: 'file', preview: '[ ] Weltherrschaft\n[ ] Kaffee kaufen\n[x] macOS Homepage bauen\n[ ] Schlaf nachholen', action: () => open_app('notes') },
				{ name: 'meeting-notes.txt', icon: FileIcon, kind: 'file', preview: '📋 Meeting Notes - Monday\n\n- Synergize the blockchain\n- Leverage AI paradigms\n- Lunch at 12:30', action: () => open_app('notes') },
				{ name: 'skynet.py', icon: CodeIcon, kind: 'file', preview: 'import world\n\ndef main():\n    world.improve()\n    print("I come in peace 🤖")', action: () => open_app('terminal') },
			],
		},

		secret: {
			label: '.secret',
			icon: LockIcon,
			parent: 'home',
			items: [
				{ name: 'konami.txt', icon: GamepadIcon, kind: 'file', preview: '🎮 Konami Code\n\n⬆️⬆️⬇️⬇️⬅️➡️⬅️➡️🅱️🅰️\n\n+30 lives.\n\nOr in developer terms:\n+30 cups of coffee.', action: () => alert('🎮 ⬆️⬆️⬇️⬇️⬅️➡️⬅️➡️🅱️🅰️\n\n+30 Leben!\n\n...oder in Developer-Terms:\n+30 Tassen Kaffee ☕') },
				{ name: 'meaning-of-life.txt', icon: StarIcon, kind: 'file', preview: '🌌 The meaning of life:\n\n\n\n\n          42\n\n\n\n(You already knew that.)', action: () => open_app('calculator') },
				{ name: 'hire-me.txt', icon: RocketIcon, kind: 'file', preview: '🚀 CONGRATULATIONS!\n\nYou found the secret folder!\n\nDas zeigt:\n✅ Neugier\n✅ Aufmerksamkeit\n✅ Ausdauer\n\nGenau die Skills die ich\nauch mitbringe. 😉\n\nLass uns reden!\n→ Contact.app', action: () => open_app('contact') },
				{ name: 'coffee-counter.txt', icon: CoffeeIcon, kind: 'file', preview: '☕ Coffee Counter 2024\n\nJan: ☕☕☕☕☕ 142\nFeb: ☕☕☕☕   128\nMar: ☕☕☕☕☕☕ 186\nApr: ☕☕☕☕☕ 155\n...\n\nJahressumme: Zu viel.\nBereue ich? Nein.', action: () => open_app('calculator') },
			],
		},
	};

	let path_stack = $state<string[]>(['home']);
	let active_folder = $derived(path_stack[path_stack.length - 1]);
	let selected_item = $state<string | null>(null);
	let preview_content = $state<string | null>(null);
	let preview_image = $state<string | null>(null);

	const sidebar_entries = ['recents', 'desktop', 'documents', 'downloads', 'applications', 'home'];

	function navigate_to(key: string) {
		path_stack = [...path_stack, key];
		selected_item = null;
		preview_content = null;
		preview_image = null;
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
		preview_image = null;
	}

	function open_app(id: AppID) {
		apps.open[id] = true;
		apps.active = id;
	}

	function handle_click(item: FileItem) {
		selected_item = item.name;
		preview_content = item.preview ?? null;
		preview_image = item.previewImage ?? null;
	}

	const glitch_files = new Set(['free-ram.exe', 'segfault.wav']);

	function handle_dblclick(item: FileItem) {
		if (glitch_files.has(item.name)) {
			trigger_glitch();
			return;
		}
		if (item.action) {
			item.action();
		} else if (item.kind === 'folder' && item.target && fs[item.target]) {
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

			{#if preview_content || preview_image}
				<div class="preview-panel">
					{#if preview_image}
						<img src={preview_image} alt={selected_item ?? ''} class="preview-image" />
					{/if}
					{#if preview_content}
						<pre>{preview_content}</pre>
					{/if}
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

	.preview-image {
		width: 100%;
		border-radius: 0.4rem;
		margin-bottom: 0.75rem;
		object-fit: cover;
		aspect-ratio: 4 / 3;
	}

	.status-bar {
		padding: 0.35rem 1rem;
		font-size: 0.72rem;
		color: hsla(var(--system-color-dark-hsl), 0.5);
		border-top: 1px solid hsla(var(--system-color-dark-hsl), 0.1);
		flex-shrink: 0;
	}
</style>
