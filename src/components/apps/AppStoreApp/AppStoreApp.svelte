<script lang="ts">
	import { trackEvent } from '🍎/helpers/tracking';
	import { preferences } from '🍎/state/preferences.svelte.ts';
	import GlobeIcon from '~icons/mdi/web';
	import GithubIcon from '~icons/mdi/github';
	import RssIcon from '~icons/mdi/rss';
	import StarIcon from '~icons/mdi/star';
	import DownloadIcon from '~icons/mdi/download';
	import SparklesIcon from '~icons/mdi/auto-fix';
	import HeartIcon from '~icons/mdi/heart';
	import CoffeeIcon from '~icons/mdi/coffee';

	type Category = 'featured' | 'websites' | 'github' | 'easter-eggs';

	let active_category: Category = $state('featured');
	const { ios_mode = false }: { ios_mode?: boolean } = $props();

	let konami_progress = $state(0);
	let show_nyan = $state(false);
	let download_clicks: Record<string, number> = $state({});

	const konami_code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

	function handle_keydown(e: KeyboardEvent) {
		if (e.key === konami_code[konami_progress]) {
			konami_progress++;
			if (konami_progress === konami_code.length) {
				trackEvent('EasterEgg', 'found', 'konami-code');
				show_nyan = true;
				konami_progress = 0;
				setTimeout(() => (show_nyan = false), 5000);
			}
		} else {
			konami_progress = 0;
		}
	}

	function handle_download(e: MouseEvent, id: string, url: string) {
		e.stopPropagation();
		e.preventDefault();
		download_clicks[id] = (download_clicks[id] || 0) + 1;
		trackEvent('AppStore', 'download', id);
		window.open(url, '_blank');
	}

	const websites = [
		{
			id: 'stylite',
			name: 'Stylite',
			subtitle: 'Digitalagentur',
			description: 'Full-Service Digitalagentur für Webentwicklung, Design und Beratung.',
			url: 'https://stylite.de',
			icon: '🏢',
			rating: 5,
			category: 'Wirtschaft',
		},
		{
			id: 'stylite-blog',
			name: 'Stylite Blog',
			subtitle: 'Tech & Einblicke',
			description: 'Artikel über Webentwicklung, Technologie und digitale Trends.',
			url: 'https://blog.stylite.de',
			icon: '📝',
			rating: 5,
			category: 'Bildung',
		},
		{
			id: 'bonis-de',
			name: 'bonis.de',
			subtitle: 'Diese Seite hier!',
			description: 'Das macOS-Portfolio-Erlebnis, das du gerade durchstöberst. Sehr meta.',
			url: 'https://www.bonis.de',
			icon: '🍎',
			rating: 5,
			category: 'Unterhaltung',
		},
	];

	const github_repos = [
		{
			id: 'homepage',
			name: 'homepage',
			subtitle: 'wbonis/homepage',
			description: 'Diese macOS-Portfolio-Website. Gebaut mit Svelte 5, TypeScript und Vite.',
			url: 'https://github.com/wbonis/homepage',
			icon: '🖥️',
			stars: '~',
			language: 'Svelte',
		},
		{
			id: 'wbonis',
			name: 'Wim Bonis',
			subtitle: 'GitHub Profile',
			description: 'Alle öffentlichen Repositories und Open-Source-Beiträge.',
			url: 'https://github.com/WBonis',
			icon: '👤',
			stars: '~',
			language: 'Various',
		},
	];

	const easter_eggs = [
		{
			id: 'konami',
			name: 'Konami Code',
			subtitle: 'Secret Unlockable',
			description: 'Try typing the Konami code on your keyboard...',
			icon: '🎮',
			hint: 'Up Up Down Down Left Right Left Right B A',
		},
		{
			id: 'coffee',
			name: '418 Coffee Maker',
			subtitle: "I'm a teapot",
			description: 'This app cannot brew coffee because it is, in fact, a teapot. (RFC 2324)',
			icon: '☕',
			hint: 'HTTP 418',
		},
		{
			id: 'hello-world',
			name: 'Hello World',
			subtitle: 'The First Program',
			description: 'printf("Hello, World!"); — Every developer\'s first love.',
			icon: '👋',
			hint: 'console.log("Hello!")',
		},
		{
			id: 'matrix',
			name: 'Red Pill',
			subtitle: 'Follow the white rabbit',
			description: 'You take the blue pill, the story ends. You take the red pill... you stay in the portfolio.',
			icon: '💊',
			hint: 'There is no spoon',
		},
	];

	const categories: { id: Category; label: string; icon: typeof GlobeIcon }[] = [
		{ id: 'featured', label: 'Empfohlen', icon: SparklesIcon },
		{ id: 'websites', label: 'Websites', icon: GlobeIcon },
		{ id: 'github', label: 'GitHub', icon: GithubIcon },
		{ id: 'easter-eggs', label: 'Easter Eggs', icon: CoffeeIcon },
	];

	function get_download_label(id: string): string {
		const clicks = download_clicks[id] || 0;
		if (clicks === 0) return 'GET';
		if (clicks === 1) return 'OPEN';
		if (clicks < 5) return 'OPEN';
		if (clicks < 10) return 'Again?';
		if (clicks < 20) return 'Really?';
		if (clicks < 30) return 'Stop it';
		if (clicks < 50) return '...';
		return '🫠';
	}
</script>

<svelte:window onkeydown={handle_keydown} />

<section class="container" class:ios={ios_mode}>
	{#if !ios_mode}
		<header class="titlebar app-window-drag-handle">
			<span>App Store</span>
		</header>

		<aside class:light={preferences.theme.scheme === 'light'}>
			<div class="sidebar-section-title">Entdecken</div>
			<nav>
				{#each categories as cat}
					<button
						class="nav-btn"
						class:active={active_category === cat.id}
						onclick={() => { active_category = cat.id; trackEvent('AppStore', 'category_changed', cat.id); }}
					>
						<cat.icon /> {cat.label}
					</button>
				{/each}
			</nav>
		</aside>
	{:else}
		<div class="ios-tabs">
			{#each categories as cat}
				<button
					class="ios-tab"
					class:active={active_category === cat.id}
					onclick={() => { active_category = cat.id; }}
				>
					{cat.label}
				</button>
			{/each}
		</div>
	{/if}

	<section class="content">
		{#if show_nyan}
			<div class="nyan-overlay">
				<div class="nyan-cat">🌈🐱</div>
				<p>You found the Konami Code!</p>
				<p class="nyan-sub">+30 developer credibility points</p>
			</div>
		{/if}

		{#if active_category === 'featured'}
			<div class="featured-banner">
				<div class="banner-content">
					<span class="banner-tag">PORTFOLIO-KOLLEKTION</span>
					<h1>Willkommen im App Store</h1>
					<p>Entdecke Wim Bonis' Websites, Open-Source-Projekte und ein paar versteckte Überraschungen.</p>
				</div>
			</div>

			<h2 class="section-title">Webseiten</h2>
			<div class="app-grid">
				{#each websites as site}
					<a href={site.url} target="_blank" rel="noopener noreferrer" class="app-card">
						<div class="app-icon-large">{site.icon}</div>
						<div class="app-card-info">
							<strong>{site.name}</strong>
							<span class="app-subtitle">{site.subtitle}</span>
							<span class="app-category">{site.category}</span>
						</div>
						<button
							class="get-btn"
							onclick={(e: MouseEvent) => handle_download(e, site.id, site.url)}
						>{get_download_label(site.id)}</button>
					</a>
				{/each}
			</div>

			<h2 class="section-title">Open Source</h2>
			<div class="app-grid">
				{#each github_repos as repo}
					<a href={repo.url} target="_blank" rel="noopener noreferrer" class="app-card">
						<div class="app-icon-large">{repo.icon}</div>
						<div class="app-card-info">
							<strong>{repo.name}</strong>
							<span class="app-subtitle">{repo.subtitle}</span>
							<span class="app-category">{repo.language}</span>
						</div>
						<button
							class="get-btn"
							onclick={(e: MouseEvent) => handle_download(e, repo.id, repo.url)}
						>{get_download_label(repo.id)}</button>
					</a>
				{/each}
			</div>
		{/if}

		{#if active_category === 'websites'}
			<h2 class="section-title"><GlobeIcon /> Webseiten & Dienste</h2>
			{#each websites as site}
				<a href={site.url} target="_blank" rel="noopener noreferrer" class="app-detail-card">
					<div class="app-icon-xlarge">{site.icon}</div>
					<div class="app-detail-info">
						<h3>{site.name}</h3>
						<span class="app-subtitle">{site.subtitle}</span>
						<p>{site.description}</p>
						<div class="rating">
							{#each Array(site.rating) as _}
								<StarIcon />
							{/each}
						</div>
					</div>
					<div class="app-detail-action">
						<button
							class="get-btn large"
							onclick={(e: MouseEvent) => handle_download(e, site.id, site.url)}
						>{get_download_label(site.id)}</button>
						<span class="app-category">{site.category}</span>
					</div>
				</a>
			{/each}
		{/if}

		{#if active_category === 'github'}
			<h2 class="section-title"><GithubIcon /> GitHub-Repositories</h2>
			{#each github_repos as repo}
				<a href={repo.url} target="_blank" rel="noopener noreferrer" class="app-detail-card">
					<div class="app-icon-xlarge">{repo.icon}</div>
					<div class="app-detail-info">
						<h3>{repo.name}</h3>
						<span class="app-subtitle">{repo.subtitle}</span>
						<p>{repo.description}</p>
						<div class="repo-meta">
							<span class="language-dot"></span> {repo.language}
						</div>
					</div>
					<div class="app-detail-action">
						<button
							class="get-btn large"
							onclick={(e: MouseEvent) => handle_download(e, repo.id, repo.url)}
						>{get_download_label(repo.id)}</button>
					</div>
				</a>
			{/each}
		{/if}

		{#if active_category === 'easter-eggs'}
			<h2 class="section-title"><CoffeeIcon /> Easter Eggs</h2>
			<p class="section-desc">Some things are hidden in plain sight...</p>
			{#each easter_eggs as egg}
				<div class="app-detail-card easter-card">
					<div class="app-icon-xlarge">{egg.icon}</div>
					<div class="app-detail-info">
						<h3>{egg.name}</h3>
						<span class="app-subtitle">{egg.subtitle}</span>
						<p>{egg.description}</p>
						<code class="hint">{egg.hint}</code>
					</div>
					<div class="app-detail-action">
						<HeartIcon />
					</div>
				</div>
			{/each}

			<div class="secret-footer">
				<p>You found the secret section! Here's a cookie: 🍪</p>
				<p class="tiny">No actual cookies were harmed in the making of this portfolio. <br/>(We use localStorage though, sorry.)</p>
			</div>
		{/if}
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

	.container.ios {
		display: flex;
		flex-direction: column;
		background-image: none;
		background-color: hsla(var(--color), 1);
		height: 100%;
	}

	.ios-tabs {
		display: flex;
		gap: 0;
		flex-shrink: 0;
		border-bottom: 0.5px solid hsla(var(--system-color-dark-hsl), 0.15);
	}

	.ios-tab {
		flex: 1;
		padding: 10px 0;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-size: 12px;
		font-weight: 500;
		font-family: inherit;
		color: hsla(var(--system-color-dark-hsl), 0.5);
		cursor: pointer;

		&.active {
			color: var(--system-color-primary);
			border-bottom-color: var(--system-color-primary);
		}
	}

	.container.ios .content {
		grid-area: unset;
		flex: 1;
	}

	.titlebar {
		grid-area: 1 / 1 / span 1 / span 2;
		display: flex;
		justify-content: center;
		z-index: 1;
		padding: 0.9rem 1rem;
		width: 100%;
		border-top-left-radius: inherit;
		border-top-right-radius: inherit;
		user-select: none;

		span {
			color: hsla(var(--system-color-dark-hsl), 0.8);
			font-weight: 500;
			font-size: 0.9rem;
			letter-spacing: 0.5px;
		}
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

	.nav-btn {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		justify-content: flex-start;
		color: hsla(var(--system-color-dark-hsl), 0.9);
		font-weight: 400;
		font-size: 0.85rem;
		padding: 0.35rem 0.5rem;
		border-radius: 0.4rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background-color 100ms ease;
		font-family: inherit;

		&:hover {
			background-color: hsla(var(--system-color-dark-hsl), 0.1);
		}

		&.active {
			background-color: var(--system-color-primary);
			color: var(--system-color-primary-contrast);
		}

		:global(svg) {
			font-size: 1rem;
			flex-shrink: 0;
			width: 1.1rem;
		}
	}

	.content {
		grid-area: 2 / 2 / span 1 / span 1;
		padding: 1rem 1.5rem;
		overflow-y: auto;
		position: relative;
	}

	.featured-banner {
		background: linear-gradient(135deg, var(--system-color-primary), #6366f1);
		border-radius: 0.75rem;
		padding: 2rem;
		margin-bottom: 1.5rem;
		color: white;
	}

	.banner-tag {
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		opacity: 0.8;
		text-transform: uppercase;
	}

	.banner-content h1 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0.5rem 0 0.3rem;
	}

	.banner-content p {
		font-size: 0.85rem;
		opacity: 0.9;
		margin: 0;
		line-height: 1.5;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 1.25rem 0 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.section-desc {
		font-size: 0.85rem;
		opacity: 0.6;
		margin: -0.25rem 0 1rem;
	}

	.app-grid {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.app-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0;
		border-bottom: 1px solid hsla(var(--system-color-dark-hsl), 0.08);
		text-decoration: none;
		color: inherit;
		transition: background-color 100ms ease;
		border-radius: 0.5rem;
		padding-inline: 0.5rem;

		&:hover {
			background-color: hsla(var(--system-color-dark-hsl), 0.04);
		}
	}

	.app-icon-large {
		font-size: 2rem;
		width: 2.75rem;
		height: 2.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsla(var(--system-color-dark-hsl), 0.05);
		border-radius: 0.6rem;
		flex-shrink: 0;
	}

	.app-icon-xlarge {
		font-size: 2.5rem;
		width: 3.5rem;
		height: 3.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsla(var(--system-color-dark-hsl), 0.05);
		border-radius: 0.75rem;
		flex-shrink: 0;
	}

	.app-card-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;

		strong {
			font-size: 0.85rem;
		}

		.app-subtitle {
			font-size: 0.75rem;
			opacity: 0.5;
		}

		.app-category {
			font-size: 0.7rem;
			opacity: 0.4;
		}
	}

	.get-btn {
		background: hsla(var(--system-color-primary-hsl), 0.12);
		color: var(--system-color-primary);
		border: none;
		border-radius: 1rem;
		padding: 0.3rem 0.9rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		flex-shrink: 0;
		transition: background-color 150ms ease;

		&:hover {
			background: hsla(var(--system-color-primary-hsl), 0.2);
		}

		&.large {
			padding: 0.4rem 1.2rem;
			font-size: 0.8rem;
		}
	}

	.app-detail-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		margin-bottom: 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid hsla(var(--system-color-dark-hsl), 0.08);
		text-decoration: none;
		color: inherit;
		transition: background-color 100ms ease;

		&:hover {
			background-color: hsla(var(--system-color-dark-hsl), 0.03);
		}
	}

	.easter-card {
		border-style: dashed;
	}

	.app-detail-info {
		flex: 1;

		h3 {
			font-size: 0.95rem;
			margin: 0;
		}

		.app-subtitle {
			font-size: 0.8rem;
			opacity: 0.5;
			display: block;
			margin-bottom: 0.3rem;
		}

		p {
			font-size: 0.8rem;
			opacity: 0.7;
			margin: 0.25rem 0 0.5rem;
			line-height: 1.4;
		}
	}

	.rating {
		display: flex;
		gap: 0.1rem;
		color: #f59e0b;
		font-size: 0.75rem;
	}

	.repo-meta {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.75rem;
		opacity: 0.5;
	}

	.language-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--system-color-primary);
	}

	.app-detail-action {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;

		.app-category {
			font-size: 0.7rem;
			opacity: 0.4;
		}

		:global(svg) {
			font-size: 1.25rem;
			opacity: 0.3;
		}
	}

	.hint {
		font-size: 0.7rem;
		background: hsla(var(--system-color-dark-hsl), 0.06);
		padding: 0.2rem 0.5rem;
		border-radius: 0.3rem;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	.secret-footer {
		margin-top: 2rem;
		padding: 1.5rem;
		text-align: center;
		border-top: 1px dashed hsla(var(--system-color-dark-hsl), 0.1);

		p {
			font-size: 0.85rem;
			margin: 0;
		}

		.tiny {
			font-size: 0.7rem;
			opacity: 0.4;
			margin-top: 0.5rem;
		}
	}

	.nyan-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			#ff0000 0% 16.66%,
			#ff8800 16.66% 33.33%,
			#ffff00 33.33% 50%,
			#00ff00 50% 66.66%,
			#0088ff 66.66% 83.33%,
			#8800ff 83.33% 100%
		);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 10;
		animation: nyan-fade 5s forwards;
		border-radius: inherit;

		.nyan-cat {
			font-size: 4rem;
			animation: nyan-bounce 300ms ease-in-out infinite alternate;
		}

		p {
			color: white;
			font-weight: 600;
			font-size: 1.2rem;
			text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
		}

		.nyan-sub {
			font-size: 0.85rem !important;
			font-weight: 400 !important;
			opacity: 0.8;
		}
	}

	@keyframes nyan-bounce {
		from { transform: translateY(0); }
		to { transform: translateY(-10px); }
	}

	@keyframes nyan-fade {
		0%, 80% { opacity: 1; }
		100% { opacity: 0; pointer-events: none; }
	}
</style>
