<script lang="ts">
	import { trackEvent } from '🍎/helpers/tracking';
	import RssIcon from '~icons/mdi/rss';
	import OpenIcon from '~icons/mdi/open-in-new';
	import RefreshIcon from '~icons/mdi/refresh';

	const RSS_URL = 'https://blog.stylite.de/blog/index.xml';

	interface BlogPost {
		title: string;
		url: string;
		date: string;
	}

	let posts = $state<BlogPost[]>([]);
	let loading = $state(true);
	let error = $state('');

	function parseRSS(xml: string): BlogPost[] {
		const parser = new DOMParser();
		const doc = parser.parseFromString(xml, 'text/xml');
		const items = doc.querySelectorAll('item');
		const result: BlogPost[] = [];

		items.forEach((item) => {
			const title = item.querySelector('title')?.textContent ?? '';
			const link = item.querySelector('link')?.textContent ?? '';
			const pubDate = item.querySelector('pubDate')?.textContent ?? '';

			const date = pubDate
				? new Date(pubDate).toLocaleDateString('de-DE', {
						day: '2-digit',
						month: 'short',
						year: 'numeric',
					})
				: '';

			result.push({ title, url: link, date });
		});

		return result;
	}

	async function fetchFeed() {
		loading = true;
		error = '';
		try {
			const res = await fetch(RSS_URL);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const xml = await res.text();
			posts = parseRSS(xml);
		} catch (e) {
			error = 'Feed konnte nicht geladen werden.';
			console.error('RSS fetch error:', e);
		} finally {
			loading = false;
		}
	}

	const { ios_mode = false }: { ios_mode?: boolean } = $props();

	fetchFeed();

	function openBlog() {
		trackEvent('Blog', 'open_external', 'https://blog.stylite.de/blog/');
		window.open('https://blog.stylite.de/blog/', '_blank');
	}
</script>

<section class="container">
	{#if !ios_mode}
		<header class="titlebar app-window-drag-handle">
			<span>Stylite Blog</span>
		</header>
	{/if}

	<div class="toolbar">
		<div class="toolbar-left">
			<RssIcon style="color: var(--system-color-primary); font-size: 1.3rem;" />
			<h2>Stylite AG Blog</h2>
		</div>
		<div class="toolbar-right">
			<button class="icon-btn" onclick={() => { trackEvent('Blog', 'refresh'); fetchFeed(); }} title="Aktualisieren">
				<RefreshIcon />
			</button>
			<button class="open-btn" onclick={openBlog}>
				<OpenIcon /> Zum Blog
			</button>
		</div>
	</div>

	<div class="posts">
		{#if loading}
			<div class="status">Lade Blog-Beiträge…</div>
		{:else if error}
			<div class="status error">{error}</div>
		{:else}
			{#each posts as post}
				<a class="post" href={post.url} target="_blank" rel="noopener noreferrer">
					<div class="post-content">
						<h3>{post.title}</h3>
						<span class="date">{post.date}</span>
					</div>
					<span class="arrow">›</span>
				</a>
			{/each}
		{/if}
	</div>
</section>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: 100%;
		border-radius: inherit;
		background-color: hsla(var(--system-color-light-hsl), 1);
		color: var(--system-color-dark);
	}

	.titlebar {
		display: flex;
		justify-content: center;
		padding: 0.9rem 1rem;
		width: 100%;
		border-top-left-radius: inherit;
		border-top-right-radius: inherit;
		user-select: none;
		flex-shrink: 0;

		span {
			color: hsla(var(--system-color-dark-hsl), 0.8);
			font-weight: 500;
			font-size: 0.9rem;
			letter-spacing: 0.5px;
		}
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1.5rem 1rem;
		flex-shrink: 0;
	}

	.toolbar-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;

		h2 {
			font-size: 1.5rem;
			font-weight: 700;
		}
	}

	.toolbar-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.4rem;
		border-radius: 0.5rem;
		border: none;
		background: transparent;
		color: hsla(var(--system-color-dark-hsl), 0.6);
		font-size: 1.1rem;
		cursor: pointer;
		transition: all 150ms ease;

		&:hover {
			background-color: hsla(var(--system-color-dark-hsl), 0.08);
			color: hsla(var(--system-color-dark-hsl), 0.9);
		}
	}

	.open-btn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem 0.8rem;
		border-radius: 0.5rem;
		border: none;
		background: var(--system-color-primary);
		color: white;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		font-family: inherit;
		transition: opacity 150ms ease;

		&:hover {
			opacity: 0.85;
		}
	}

	.posts {
		flex: 1;
		overflow-y: auto;
		padding: 0 1.5rem 1.5rem;
	}

	.status {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		font-size: 0.85rem;
		opacity: 0.5;
	}

	.status.error {
		color: var(--system-color-primary);
		opacity: 0.8;
	}

	.post {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1rem;
		border-radius: 0.6rem;
		cursor: pointer;
		transition: background-color 150ms ease;
		text-decoration: none;
		color: inherit;

		&:hover {
			background-color: hsla(var(--system-color-dark-hsl), 0.06);
		}

		& + .post {
			border-top: 1px solid hsla(var(--system-color-dark-hsl), 0.06);
		}
	}

	.post-content {
		flex: 1;
		min-width: 0;
	}

	h3 {
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1.4;
		margin-bottom: 0.3rem;
	}

	.date {
		font-size: 0.75rem;
		opacity: 0.5;
	}

	.arrow {
		font-size: 1.2rem;
		opacity: 0.3;
		flex-shrink: 0;
	}
</style>
