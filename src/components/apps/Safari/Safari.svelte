<script lang="ts">
	import { trackEvent } from '🍎/helpers/tracking';

	const { ios_mode = false }: { ios_mode?: boolean } = $props();

	let url = $state('https://stylite.de');
	let inputUrl = $state('https://stylite.de');
	let loading = $state(true);

	function navigate() {
		let target = inputUrl.trim();
		if (!target.startsWith('http')) {
			target = 'https://' + target;
		}
		trackEvent('Safari', 'navigate', target);
		url = target;
		loading = true;
	}

	function onLoad() {
		loading = false;
	}
</script>

<section class="container" class:ios={ios_mode}>
	{#if !ios_mode}
		<header class="titlebar app-window-drag-handle">
			<span>Safari</span>
		</header>

		<div class="toolbar">
			<div class="nav-buttons">
				<button class="nav-btn" disabled title="Back">‹</button>
				<button class="nav-btn" disabled title="Forward">›</button>
			</div>
			<form class="url-bar" onsubmit={(e) => { e.preventDefault(); navigate(); }}>
				<input
					type="text"
					bind:value={inputUrl}
					placeholder="Enter URL..."
					spellcheck="false"
				/>
			</form>
			<a class="external-btn" href={url} target="_blank" rel="noopener noreferrer" title="Open in new tab">↗</a>
		</div>
	{/if}

	<div class="browser-content">
		{#if loading}
			<div class="loading-bar"></div>
		{/if}
		<iframe
			src={url}
			title="Browser"
			onload={onLoad}
			sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
		></iframe>
	</div>

	{#if ios_mode}
		<div class="ios-toolbar">
			<form class="ios-url-bar" onsubmit={(e) => { e.preventDefault(); navigate(); }}>
				<input
					type="text"
					bind:value={inputUrl}
					placeholder="Search or enter URL"
					spellcheck="false"
				/>
			</form>
		</div>
	{/if}
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
		padding: 0.9rem 1rem 0.3rem;
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
		gap: 0.5rem;
		padding: 0.3rem 0.8rem 0.5rem;
		flex-shrink: 0;
	}

	.nav-buttons {
		display: flex;
		gap: 0.2rem;
	}

	.nav-btn {
		width: 28px;
		height: 28px;
		border-radius: 0.4rem;
		border: none;
		background: hsla(var(--system-color-dark-hsl), 0.06);
		color: hsla(var(--system-color-dark-hsl), 0.5);
		font-size: 1.2rem;
		line-height: 1;
		cursor: default;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.url-bar {
		flex: 1;

		input {
			width: 100%;
			padding: 0.4rem 0.8rem;
			border-radius: 0.5rem;
			border: 1px solid hsla(var(--system-color-dark-hsl), 0.12);
			background: hsla(var(--system-color-dark-hsl), 0.04);
			color: inherit;
			font-size: 0.82rem;
			outline: none;
			font-family: inherit;

			&:focus {
				border-color: var(--system-color-primary);
				background: hsla(var(--system-color-dark-hsl), 0.02);
			}
		}
	}

	.external-btn {
		width: 28px;
		height: 28px;
		border-radius: 0.4rem;
		background: hsla(var(--system-color-dark-hsl), 0.06);
		color: hsla(var(--system-color-dark-hsl), 0.7);
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		transition: background-color 100ms ease;

		&:hover {
			background: hsla(var(--system-color-dark-hsl), 0.12);
		}
	}

	.browser-content {
		flex: 1;
		position: relative;
		overflow: hidden;
		border-bottom-left-radius: inherit;
		border-bottom-right-radius: inherit;
	}

	.container.ios .browser-content {
		border-radius: 0;
	}

	.loading-bar {
		position: absolute;
		top: 0;
		left: 0;
		height: 2px;
		width: 100%;
		z-index: 1;
		background: linear-gradient(90deg, var(--system-color-primary) 0%, transparent 100%);
		animation: loading 1.5s ease-in-out infinite;
	}

	@keyframes loading {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}

	iframe {
		width: 100%;
		height: 100%;
		border: none;
		border-bottom-left-radius: inherit;
		border-bottom-right-radius: inherit;
		background: white;
	}

	.ios-toolbar {
		flex-shrink: 0;
		padding: 8px 12px;
		background: hsla(var(--system-color-light-hsl), 0.95);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-top: 0.5px solid hsla(var(--system-color-dark-hsl), 0.15);
	}

	.ios-url-bar {
		input {
			width: 100%;
			padding: 8px 12px;
			border-radius: 10px;
			border: none;
			background: hsla(var(--system-color-dark-hsl), 0.07);
			color: var(--system-color-dark);
			font-size: 15px;
			font-family: inherit;
			outline: none;
			text-align: center;

			&:focus {
				text-align: left;
				background: hsla(var(--system-color-dark-hsl), 0.05);
			}
		}
	}
</style>
